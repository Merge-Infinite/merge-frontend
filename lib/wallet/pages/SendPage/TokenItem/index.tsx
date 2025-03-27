import classnames from "classnames";
import SuiIcon from "../../../assets/icons/sui.svg";
import IconToken from "../../../assets/icons/token.svg";
import UnverifiedIcon from "../../../assets/icons/unverified.svg";
import VerifiedIcon from "../../../assets/icons/verified.svg";
import IconWaterDrop from "../../../assets/icons/waterdrop.svg";
import TokenIcon from "../../../components/TokenIcon";
import Tooltip from "../../../components/Tooltip";
import Typo from "../../../components/Typo";
import { formatCurrency } from "../../../core";
import { Extendable } from "../../../types";
import { isSuiToken } from "../../../utils/check";
import styles from "./index.module.scss";
type TokenItemProps = Extendable & {
  symbol: string;
  type: string;
  balance: string;
  isVerified: boolean;
  decimals: number;
  iconURL?: string;
  onClick?: (coinType: string) => void;
  selected?: boolean;
  verified?: boolean;
  usd: string | null;
  pricePercentChange24h: string | null;
  wrappedChain: string | null;
  bridge: string | null;
};

const TokenIconUrl: Record<string, string> = {
  SUI: IconWaterDrop,
  DEFAULT: IconToken,
};

const TokenItem = (props: TokenItemProps) => {
  const {
    balance = 0,
    type: coinType,
    symbol,
    iconURL,
    decimals,
    onClick,
    selected,
    isVerified,
    usd,
    pricePercentChange24h,
    wrappedChain,
    bridge,
  } = props;

  let tokenIcon = TokenIconUrl[symbol] || TokenIconUrl.DEFAULT;
  if (iconURL) {
    tokenIcon = iconURL;
  }
  const isSUI = isSuiToken(coinType);

  return (
    <div
      className={classnames(
        styles["token-item"],
        isSUI ? styles["token-item-sui"] : null,
        selected && styles["selected"],
        onClick && styles["clickable"]
      )}
      onClick={() => {
        onClick?.(coinType);
      }}
    >
      <div className="flex items-center gap-2">
        {!isSUI ? (
          <TokenIcon
            icon={tokenIcon}
            alt="water-drop"
            className={isSUI ? "" : styles["icon-wrap-default"]}
          />
        ) : (
          <SuiIcon width={24} height={24} />
        )}
        <div className={"flex flex-col ml-[13px]"}>
          <div className="flex items-center">
            <Typo.Normal
              className={classnames(
                styles["token-name"],
                isSUI ? styles["token-name-sui"] : null
              )}
            >
              {symbol}
            </Typo.Normal>
            {isVerified ? (
              <Tooltip message={"Verified"}>
                <VerifiedIcon className="ml-1" width={14} height={14} />
              </Tooltip>
            ) : (
              <Tooltip
                message={
                  "Unverified: proceed with caution and research before use"
                }
              >
                <UnverifiedIcon className="ml-1" width={14} height={14} />
              </Tooltip>
            )}
          </div>

          <Typo.Small
            className={classnames(
              styles["token-amount"],
              isSUI ? styles["token-amount-sui"] : null
            )}
          >
            {`${formatCurrency(balance, { decimals })} ${symbol}`}
          </Typo.Small>
        </div>
      </div>
    </div>
  );
};

export default TokenItem;
