import { isValidSuiAddress } from "@mysten/sui.js";
import { useDebounceEffect } from "ahooks";
import classNames from "classnames";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import Skeleton from "react-loading-skeleton";
import { useSelector } from "react-redux";
import { resolveDomain } from "../../../api/suins";
import ViewIcon from "../../../assets/icons/view.svg";
import AddressInput from "../../../components/AddressInput";
import Button from "../../../components/Button";
import Form from "../../../components/form/Form";
import Typo from "../../../components/Typo";
import { RootState } from "../../../store";
import { isValidDomain } from "../../../utils/address";
import { getInputStateByFormState } from "../../../utils/form";
import commonStyles from "../common.module.scss";
import useTransactionList from "../hooks/useTransactionList";
import { SendData } from "../types";
import styles from "./index.module.scss";
interface AddressInputValues {
  address: string;
}

function AddressInputPage({
  onNext,
  onSubmit,
  state,
}: {
  onNext: () => void;
  onSubmit: (address: string) => void;
  state: SendData;
}) {
  const form = useForm<AddressInputValues>({
    mode: "onChange",
    defaultValues: {
      address: state.recipientAddress,
    },
  });
  const { networkId } = useSelector((state: RootState) => state.appContext);
  const addressState = getInputStateByFormState(form.formState, "address");

  const [namerServiceAddress, setNameServiceAddress] = useState("");
  const [isLoadingNameServiceAddress, setIsLoadingNameServiceAddress] =
    useState(false);

  const formAddress = form.getValues().address;

  const resolvedAddress = namerServiceAddress || formAddress;
  const isValidateInput = isValidSuiAddress(resolvedAddress);
  const { getTransactionList, data: history, loading } = useTransactionList();
  useWatch({ name: "address", control: form.control });

  useDebounceEffect(() => {
    if (isValidDomain(formAddress)) {
      setIsLoadingNameServiceAddress(true);
      resolveDomain(formAddress, { networkId })
        .then((address) => {
          setNameServiceAddress(address);
          setIsLoadingNameServiceAddress(false);
        })
        .finally(() => setIsLoadingNameServiceAddress(false));
    } else {
      setNameServiceAddress("");
    }
  }, [formAddress]);

  // const loading = true;
  const disabled =
    addressState === "error" ||
    (state.recipientAddress === "" && addressState === "default");

  useEffect(() => {
    if (isValidSuiAddress(resolvedAddress)) {
      getTransactionList({
        variables: {
          fromAddress: resolvedAddress,
          toAddress: resolvedAddress,
          startTime: dayjs().subtract(7, "d").valueOf(),
          endTime: dayjs().valueOf(),
        },
      });
    }
  }, [resolvedAddress]);

  return (
    <>
      <Form
        form={form}
        onSubmit={(data) => {
          onNext?.();
          onSubmit(resolvedAddress);
        }}
      >
        <div className={"px-[32px]"}>
          <Typo.Title className={"mt-[48px] font-bold text-[36px]"}>
            Input Address
          </Typo.Title>
          <Typo.Normal className={`mt-[8px] ${styles["desc"]}`}>
            Enter an validate address or domain
          </Typo.Normal>

          <AddressInput form={form} className={"mt-[24px]"} />

          {isLoadingNameServiceAddress ||
          (isValidDomain(formAddress) &&
            !isLoadingNameServiceAddress &&
            namerServiceAddress) ? (
            <div className="mt-4 p-2  px-3 rounded-lg bg-slate-100 border border-gray-200 break-words text-gray-500">
              {isLoadingNameServiceAddress ? (
                <p>Loading name service address</p>
              ) : (
                <p> {namerServiceAddress}</p>
              )}
            </div>
          ) : null}

          {!isLoadingNameServiceAddress &&
            isValidDomain(formAddress) &&
            !namerServiceAddress && (
              <div className="mt-4 p-2 px-3 rounded-lg bg-orange-100 border border-orange-200 break-words text-orange-500">
                <p>Unable to resolve domain name</p>
              </div>
            )}
          {loading ? (
            <Skeleton className="h-[28px] mt-4"></Skeleton>
          ) : (
            history &&
            isValidateInput &&
            (history.length > 0 ? (
              <div
                className={classNames(styles["transaction-num"])}
                style={{
                  color: "#fff",
                }}
              >
                {history?.length} transactions in a week
                <div
                  onClick={() => {
                    window.open(
                      `https://suiscan.xyz/mainnet/account/${resolvedAddress}}`,
                      "_blank"
                    );
                  }}
                  className={styles["view-btn"]}
                >
                  view <ViewIcon />
                </div>
              </div>
            ) : (
              <div
                className={classNames(
                  styles["transaction-num"],
                  styles["warn"]
                )}
                style={{
                  color: "#b54708",
                }}
              >
                <div className={styles["warn-btn"]}>Warn</div>
                <div className={styles["warn-desc"]}>
                  No recent transactions
                </div>
              </div>
            ))
          )}
        </div>

        <div className={commonStyles["next-step"]}>
          <Button type={"submit"} state={"primary"}>
            Next Step
          </Button>
        </div>
      </Form>
    </>
  );
}

export default AddressInputPage;
