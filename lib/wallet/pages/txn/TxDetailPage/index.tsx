import classNames from "classnames";
import Image from "next/image";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Icon, IconContainer } from "../../../components/icons";
import Nav from "../../../components/Nav";
import { TxSummaryItem } from "../../../components/tx-history";
import TemplateText from "../../../components/tx-history/TemplateText";
import Typo from "../../../components/Typo";
import { isNonEmptyArray, safe } from "../../../core";
import { useAccount } from "../../../hooks/useAccount";
import { RootState } from "../../../store";
import { Extendable } from "../../../types";
import { DisplayItemDto } from "../types";
import useTxnDetail, {
  TxnDetailAssetChangeDto,
  TxnDetailMetadataDto,
  TxnDetailSubAssetChangesDto,
} from "./hooks/useTxnDetail";
export type TxDetailPageProps = {};

const TxnMetric = (
  props: Extendable & {
    label: string;
    value: string;
    icon?: string;
    valueType?: "text";
  }
) => {
  const { label, value, icon, valueType = "text" } = props;
  return (
    <div className={"flex items-center justify-between w-full"}>
      <Typo.Small
        className={
          " text-white text-sm font-normal font-['Sora'] leading-normal "
        }
      >
        {label}
      </Typo.Small>
      <TemplateText
        type={valueType}
        value={value}
        className={
          "text-[#858585] text-sm font-normal font-['Sora'] leading-normal"
        }
      />
    </div>
  );
};

export type TxnSubAssetChangeItemProps = Extendable & {
  icon: string | null;
  text: DisplayItemDto | null;
  assetChange: DisplayItemDto | null;
};

function TxnSubAssetChangeItem(props: TxnSubAssetChangeItemProps) {
  const { icon, text, assetChange } = props;
  return (
    <div className={"flex items-center px-[24px] py-[8px]"}>
      <IconContainer
        shape={"circle"}
        color={"transparent"}
        className={"w-[16px] h-[16px] ml-[10px]"}
      >
        <Icon icon={safe(icon, "Wallet")} stroke={"#7D89B0"} />
      </IconContainer>
      <TemplateText
        className={classNames(
          "ml-[26px]",
          safe(assetChange?.color, "text-gray-500")
        )}
        value={safe(text?.text, "")}
        type={safe(text?.type, "text")}
      />
      <Typo.Small
        className={classNames(
          "text-small ml-auto ellipsis max-w-[130px]",
          safe(assetChange?.color, "text-gray-400")
        )}
      >
        {safe(assetChange?.text, "")}
      </Typo.Small>
    </div>
  );
}

const Divider = (props: Extendable) => {
  return (
    <div
      className={classNames("w-full h-[1px] bg-gray-100", props.className)}
    ></div>
  );
};

const ExternalLink = (
  props: Extendable & {
    href: string;
  }
) => {
  return (
    <a
      target="_blank"
      href={props.href}
      className={props.className}
      rel="noreferrer"
    >
      <div
        className={classNames(
          "text-zinc-500",
          "hover:text-zinc-600",
          "px-4",
          "py-2",
          "rounded-lg",
          "font-medium",
          "w-fit",
          "hover:bg-zinc-100",
          "active:bg-zinc-200",
          "transition-all"
        )}
      >
        {props.children}
      </div>
    </a>
  );
};

const TxDetailPage = (props: TxDetailPageProps) => {
  const navigate = useNavigate();
  const { networkId } = useSelector((state: RootState) => state.appContext);
  const params = useParams();
  const digest = safe(params?.digest, "");
  const { accountId } = useSelector((state: RootState) => state.appContext);
  const { address } = useAccount(accountId);
  const { data: txnDetailRes } = useTxnDetail(digest, address);
  const txnDetail = txnDetailRes?.display?.detail;
  const assetChanges = safe<TxnDetailAssetChangeDto[]>(
    txnDetail?.assetChanges,
    []
  );
  const metadataList = safe<TxnDetailMetadataDto[]>(txnDetail?.metadata, []);

  useEffect(() => {
    if (!digest) {
      throw new Error("digest is required");
    }
  }, []);

  console.log("txnDetail", txnDetail);

  return (
    <div
      className={
        "w-full h-full overflow-y-auto no-scrollbar bg-black gap-4 flex flex-col"
      }
    >
      <Nav
        title={"Txn Detail"}
        className={"sticky top-0 z-10 "}
        onNavBack={() => navigate("/transaction/flow")}
      />
      <header className={"flex flex-col items-start gap-3"}>
        <div className="justify-start text-white text-xl font-normal font-['Sora'] uppercase leading-7">
          TXN detail
        </div>
        <div className={"flex items-center gap-2"}>
          <Image
            src={`/images/Txn.svg`}
            alt={txnDetail?.title || ""}
            width={20}
            height={35}
            className={classNames("mr-[3px]")}
          />
          <TemplateText
            type={"text"}
            value={txnDetail?.title}
            className={classNames(
              "justify-start text-white text-base font-normal font-['Sora'] leading-normal tracking-wide"
            )}
          />
        </div>
      </header>
      <main>
        {isNonEmptyArray(assetChanges) && (
          <>
            <Divider className={"my-[16px]"} />
            {assetChanges.map((item, index) => {
              const description = safe<DisplayItemDto | null>(
                item?.description,
                null
              );
              const assetChange = safe<DisplayItemDto | null>(
                item?.assetChange,
                null
              );
              const assetChangeDescription = safe<DisplayItemDto | null>(
                item?.assetChangeDescription,
                null
              );
              const subAssetChanges = safe<TxnDetailSubAssetChangesDto[]>(
                item?.subAssetChanges,
                []
              );

              return (
                <div key={item.title + index}>
                  <TxSummaryItem
                    className={"!px-[24px]"}
                    title={safe(item?.title, "")}
                    desc={safe(description?.text, "")}
                    descType={safe(description?.type, "text")}
                    icon={safe(item?.icon, "Txn")}
                    changeTitle={safe(assetChange?.text, "")}
                    changeTitleColor={safe(assetChange?.color, "")}
                    changeDesc={safe(assetChangeDescription?.text, "")}
                    changeDescColor={safe(assetChangeDescription?.color, "")}
                    changeDescType={safe(assetChangeDescription?.type, "text")}
                  />
                  {subAssetChanges.map((subAssetChange, index) => {
                    return (
                      <TxnSubAssetChangeItem
                        key={safe(subAssetChange?.text?.text, "") + index}
                        icon={subAssetChange?.icon}
                        text={subAssetChange?.text}
                        assetChange={subAssetChange?.assetChange}
                      />
                    );
                  })}
                </div>
              );
            })}
          </>
        )}
      </main>
      <footer className={"pb-[32px]"}>
        {isNonEmptyArray(metadataList) && (
          <div className="self-stretch p-4 bg-neutral-950/60 rounded-2xl outline outline-1 outline-offset-[-1px] outline-[#1f1f1f] inline-flex flex-col justify-start items-start gap-2 w-full">
            {metadataList.map((metadata, index) => {
              return (
                <TxnMetric
                  key={metadata?.key + index}
                  icon={safe(metadata?.icon, "")}
                  label={safe(metadata?.key, "")}
                  value={safe(metadata?.value?.text, "")}
                  valueType={safe(metadata?.value?.type, "text")}
                />
              );
            })}
          </div>
        )}
        <div className={"flex mt-4"}>
          <ExternalLink
            href={
              `https://${
                networkId === "testnet" ? "testnet." : ""
              }suivision.xyz/txblock/` + encodeURIComponent(digest)
            }
            className="rounded-3xl border border-white  items-center justify-center "
          >
            <div className="flex items-center gap-2">
              <div className="justify-start text-white text-xs font-normal font-['Sora'] uppercase leading-normal">
                Suivision
              </div>
              <Image
                src={`/images/explore.svg`}
                alt={"external"}
                width={20}
                className="text-white"
                height={20}
              />
            </div>
          </ExternalLink>
        </div>
      </footer>
    </div>
  );
};

export default TxDetailPage;
