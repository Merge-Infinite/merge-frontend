import styles from "./index.module.scss";
import { Link } from "react-router-dom";
import { Modal } from "../../../components/modals";
import WaterDropIcon from "../../../components/WaterDropIcon";
import Typo from "../../../components/Typo";
import QRCodeSVG from "qrcode.react";
import classnames from "classnames";
import Address from "../../../components/Address";
import Skeleton from "react-loading-skeleton";
import { formatCurrency, formatSUI } from "../../../core";
import message from "../../../components/message";
import { useEffect, useState } from "react";
import { LoadingSpokes } from "../../../components/Loading";
import Banner from "../Banner";
import { useFeatureFlagsWithNetwork } from "../../../hooks/useFeatureFlags";
import useSuiBalance from "../../../hooks/coin/useSuiBalance";
import useCoins from "../../../hooks/coin/useCoins";
import { useQuery } from "@apollo/client";
import { GET_SUPPORT_SWAP_COINS } from "../../../utils/graphql/query";
import SuiIcon from "../../../assets/icons/sui.svg";
import IconQrCode from "../../../assets/icons/qrcode.svg";
import Image from "next/image";
export type ReceiveButtonProps = {
  address: string;
};

const ReceiveButton = (props: ReceiveButtonProps) => {
  return (
    <Modal
      title={
        <div className={"flex items-center"}>
          <span>Receive</span>
        </div>
      }
      trigger={
        <div
          className={classnames(
            "flex flex-1 w-full h-8 px-3 py-1 rounded-3xl border border-white justify-center items-center gap-2 text-white text-xs bg-transparent uppercase"
          )}
        >
          <span>Receive</span>
        </div>
      }
      contentProps={{
        onOpenAutoFocus: (e) => {
          e.preventDefault(); // prevent autofocus on the close btn
        },
      }}
    >
      <div className={"flex flex-col items-center gap-4"}>
        <div className={"flex flex-col items-center w-full gap-4"}>
          <QRCodeSVG value={props.address} className={"w-full h-full"} />
          <Typo.Normal
            className={classnames(
              "mt-[2px]",
              styles["text-scan"],
              "text-sm font-normal"
            )}
          >
            scan to receive
          </Typo.Normal>
        </div>
        <Address value={props.address} className={"mt-[21px]"} />
      </div>
    </Modal>
  );
};

export type DashboardProps = {
  address: string;
  networkId: string;
};

function MainPage({ address, networkId }: DashboardProps) {
  // const {
  //   data: suiBalance,
  //   loading: isBalanceLoading,
  //   error: balanceError,
  // } = useSuiBalance(address);
  const {
    data: coins,
    loading: isLoading,
    error: coinsError,
  } = useCoins(address);
  const t = new Date();
  const [airdropTime, setAirdropTime] = useState(t.setTime(t.getTime() - 5000));
  const [airdropLoading, setAirdropLoading] = useState(false);
  const featureFlags = useFeatureFlagsWithNetwork();
  const faucetApi =
    featureFlags?.faucet_api ?? `https://faucet.${networkId}.sui.io/gas`;
  // preload swap data
  useQuery(GET_SUPPORT_SWAP_COINS, {
    fetchPolicy: "cache-and-network",
    variables: {
      ownerAddress: address,
    },
    skip: !address,
  });
  const balance = coins
    .map((coin) => {
      return Number(coin.balance);
    })
    .reduce((total, value) => total + value, 0);

  useEffect(() => {
    if (!coinsError) return;
    message.error("Fetch balance failed: " + coinsError.message);
  }, [coinsError]);

  return (
    <div
      className={classnames(
        styles["main-content"],
        "rounded-2xl border border-[#1f1f1f] p-4 gap-4 flex flex-col"
      )}
    >
      <Address
        value={address}
        className={classnames(
          "px-3 py-1 bg-white rounded-3xl justify-center items-center gap-2 w-fit"
        )}
      />

      <div className={"flex gap-2 items-center"}>
        <SuiIcon width={24} height={24} />
        {isLoading || coinsError ? (
          <Skeleton width={"140px"} height={"36px"} />
        ) : (
          <span className="text-white text-sm font-normal font-['Sora'] leading-normal">
            {formatCurrency(balance, {
              decimals: coins[0]?.decimals ?? 0,
              withAbbr: false,
            })}{" "}
            SUI
          </span>
        )}
      </div>
      <div className={classnames("flex gap-2 w-full")}>
        <ReceiveButton address={address} />

        <Link
          to={"/send"}
          className="flex flex-1 w-full h-8 px-3 py-1 rounded-3xl border border-white justify-center items-center gap-2 text-white text-xs bg-transparent uppercase"
        >
          <div className={classnames()}>Send</div>
        </Link>
      </div>
    </div>
  );
}

export default MainPage;
