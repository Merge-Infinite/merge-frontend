import { SUI_TYPE_ARG } from "@mysten/sui.js";
import classNames from "classnames";
import IconToken from "../../assets/icons/token.svg";
import IconWaterDrop from "../../assets/icons/waterdrop.svg";
import { formatCurrency } from "../../core";
import type { Extendable } from "../../types";
import { isSuiToken } from "../../utils/check";
import TokenIcon from "../TokenIcon";
import Typo from "../Typo";
import styles from "./index.module.scss";

import { useNavigate } from "react-router-dom";

import { useQuery } from "@apollo/client";
import Image from "next/image";
import Skeleton from "react-loading-skeleton";
import { useSelector } from "react-redux";
import UnverifiedIcon from "../../assets/icons/unverified.svg";
import VerifiedIcon from "../../assets/icons/verified.svg";
import { useAccount } from "../../hooks/useAccount";
import { useNetwork } from "../../hooks/useNetwork";
import { RootState } from "../../store";
import { CoinType } from "../../types/coin";
import { GET_DELEGATED_STAKES } from "../../utils/graphql/query";
import Tooltip from "../Tooltip";
type TokenItemProps = Extendable & {
  onClick?: (symbol: string) => void;
  selected?: boolean;
  coin: CoinType;
  wrapperClass?: string;
  showStaking?: false;
};

const TokenIconUrl: Record<string, string> = {
  SUI: IconWaterDrop,
  DEFAULT: IconToken,
};

export const TokenItem = (props: TokenItemProps) => {
  const navigate = useNavigate();
  const appContext = useSelector((state: RootState) => state.appContext);
  const { data: network } = useNetwork(appContext.networkId);

  const { address } = useAccount(appContext.accountId);

  const isSUI = isSuiToken(props.coin.type);
  function handleClick() {
    // TODO: support other coins for detail page
    // if (isSUI) {
    navigate(`/coin/detail/${props.coin.type}`);
    // }
  }
  return (
    <div
      className={classNames("hover:bg-zinc-50", {
        "cursor-pointer": isSUI,
      })}
    >
      <div
        className={classNames(
          // 'py-[20px]',
          // 'border-t',
          // // 'border',
          // 'border-gray-100',
          props.wrapperClass,
          "w-full"
        )}
        onClick={handleClick}
      >
        <div className="flex  w-full flex-row items-center justify-between">
          <div className="flex w-full justify-between gap-2">
            <TokenInfo coin={props.coin}></TokenInfo>

            <div
              className={classNames(
                "flex",
                "flex-col",
                "items-end",
                "justify-center"
              )}
            >
              {props.coin.usd && (
                <div
                  className={classNames("font-medium", "text-white")}
                  style={{
                    fontSize: "14px",
                  }}
                >
                  $
                  {formatCurrency(Number(props.coin.usd) * 10000, {
                    decimals: 4,
                  })}
                </div>
              )}
              {props.coin.pricePercentChange24h && (
                <div
                  className={classNames([
                    "rounded-lg",
                    Number(props.coin.pricePercentChange24h) > 0 && [
                      "text-green-500",
                      "bg-green-100",
                    ],
                    Number(props.coin.pricePercentChange24h) === 0 && [
                      "text-gray-500",
                      "bg-gray-100",
                    ],
                    Number(props.coin.pricePercentChange24h) < 0 && [
                      "text-red-500",
                      "bg-red-100",
                    ],
                  ])}
                  style={{
                    fontWeight: 450,
                    fontSize: "12px",
                    padding: "2px 5px",
                  }}
                >
                  {Number(props.coin.pricePercentChange24h) > 0 && "+"}
                  {Number(props.coin.pricePercentChange24h) === 0 && ""}
                  {Number(props.coin.pricePercentChange24h).toFixed(2)}%
                </div>
              )}
            </div>
          </div>
          {props.coin.type === SUI_TYPE_ARG &&
            network?.enableStaking &&
            props.showStaking && (
              <button
                className={styles["click-button"]}
                onClick={(e) => {
                  // to={'/staking'}
                  e.preventDefault();
                  e.stopPropagation();
                  navigate("/staking");
                }}
              >
                Stake
              </button>
            )}
        </div>
      </div>
    </div>
  );
};

export const TokenInfo = (props: TokenProps) => {
  if (!props.coin) {
    return (
      <>
        <Skeleton></Skeleton>
      </>
    );
  }
  const appContext = useSelector((state: RootState) => state.appContext);
  const { data: network } = useNetwork(appContext.networkId);
  const isSUI = isSuiToken(props.coin.type);
  const { address } = useAccount(appContext.accountId);

  const { data: delegatedStakesResult, loading: stakesLoading } = useQuery(
    GET_DELEGATED_STAKES,
    {
      variables: {
        address,
      },
      skip: !address || !props.showStaking,
    }
  );
  const delegatedStakes = delegatedStakesResult?.delegatedStakes;
  const stakedBalance =
    delegatedStakes?.reduce((accumulator, current) => {
      const sum = current.stakes.reduce(
        (stakesAccumulator, stake) => stakesAccumulator + stake.principal,
        0
      );
      return accumulator + sum;
    }, 0) ?? 0;
  return (
    <>
      <div className="relative">
        <TokenLogo coin={props.coin} className="mr-[6px]"></TokenLogo>
      </div>
      <div className={classNames("flex", "flex-col", "grow")}>
        <div className="flex items-center gap-1">
          <Tooltip message={props.coin.type}>
            <Typo.Normal
              className={classNames(
                styles["token-name"],
                isSUI ? styles["token-name-sui"] : null
              )}
            >
              {props.coin.symbol}
            </Typo.Normal>
          </Tooltip>
          {props.coin.isVerified ? (
            <Tooltip message={"Verified"}>
              <VerifiedIcon alt="verified" width={14} height={14} />
            </Tooltip>
          ) : (
            <Tooltip
              message={
                "Unverified: proceed with caution and research before use"
              }
            >
              <UnverifiedIcon alt="unverified" width={14} height={14} />
            </Tooltip>
          )}
          {props.coin.metadata?.bridge && (
            <Tooltip message={`${props.coin.metadata?.bridge} bridge`}>
              <Image
                src={`https://assets.suiet.app/img/bridges/${props.coin.metadata.bridge}.png`}
                className={classNames("w-[16px]", "h-[16px]", "rounded-md")}
                style={{
                  boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.1)",
                  borderRadius: "50%",
                }}
                alt={props.coin.metadata.bridge}
                width={16}
                height={16}
              />
            </Tooltip>
          )}
        </div>

        <div className={classNames("flex", "gap-1", "grow-0")}>
          {props.coin.metadata?.decimals && (
            <Typo.Small
              className={classNames(
                "text-gray-100",
                styles["token-amount"],
                "whitespace-nowrap",
                isSUI ? styles["token-amount-sui"] : null
              )}
              style={{}}
            >
              {props.coin.balance &&
                formatCurrency(props.coin.balance, {
                  decimals: props.coin.metadata?.decimals,
                  withAbbr: false,
                })}
              {" " + props.coin.symbol}
            </Typo.Small>
          )}

          {isSUI && network?.enableStaking && props.showStaking && (
            <>
              <Typo.Small
                className={classNames("inline", styles["token-amount"])}
                style={{ color: "rgba(0,0,0,0.3)" }}
              >
                +
              </Typo.Small>

              <Typo.Small
                className={classNames(
                  "inline",
                  styles["token-amount"],
                  isSUI ? styles["token-amount"] : null
                )}
                style={{ color: "#0096FF" }}
              >
                {formatCurrency(stakedBalance, {
                  decimals: 9,
                  withAbbr: false,
                })}{" "}
                Staked
              </Typo.Small>
            </>
          )}
        </div>
      </div>
    </>
  );
};

type TokenProps = Extendable & {
  coin: CoinType;
  showStaking?: false;
};
export function TokenLogo(props: TokenProps) {
  const isSUI = isSuiToken(props.coin.type);
  return (
    <div className={classNames("relative", props.className)}>
      {props.coin.iconURL ? (
        <Image
          src={props.coin.iconURL}
          className={classNames("w-[24px]", "h-[24px]", "rounded-full")}
          alt={props.coin.symbol}
          width={24}
          height={24}
        />
      ) : isSUI ? (
        <Image
          src={"/images/sui.svg"}
          alt="water-drop"
          className={classNames("w-[24px]", "h-[24px]", "rounded-full")}
          width={24}
          height={24}
        />
      ) : (
        <TokenIcon icon={IconToken} alt="water-drop" className={""} />
      )}
      {props.coin.metadata?.wrappedChain && (
        <div
          className={classNames("w-[20px]", "h-[20px]", "absolute")}
          style={{
            bottom: "-10px",
            right: "-5px",
          }}
        >
          <Tooltip
            className={classNames()}
            message={`Wrapped from ${props.coin.metadata.wrappedChain?.toUpperCase()}`}
          >
            <Image
              src={`https://assets.suiet.app/img/chains/${props.coin.metadata?.wrappedChain}.png`}
              className={classNames("rounded-full", "bg-transparent")}
              style={{
                boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.1)",
              }}
              width={20}
              height={20}
              alt={props.coin.metadata?.wrappedChain}
            />
          </Tooltip>
        </div>
      )}
    </div>
  );
}

export default TokenItem;
