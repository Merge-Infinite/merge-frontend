import { Button } from "@/components/ui/button";
import classNames from "classnames";
import { useMemo, useState } from "react";
import InputAmount from "../../../components/InputAmount";
import Typo from "../../../components/Typo";
import {
  addressEllipsis,
  formatCurrency,
  formatSUI,
  isCoinAmountValid,
  maxCoinAmountWithDecimal,
} from "../../../core";
import { CoinDto } from "../../../hooks/coin/useCoins";
import { isSuiToken } from "../../../utils/check";
import commonStyles from "../common.module.scss";
import { SendData } from "../types";
import styles from "./index.module.scss";

export function SendConfirmItem({ name, value }: Record<string, string>) {
  return (
    <div className="flex justify-between my-[16px]">
      <Typo.Title
        className={styles["send-confirm-name"]}
        style={{
          color: "#fff",
        }}
      >
        {name}
      </Typo.Title>
      <Typo.Title
        className={styles["send-confirm-value"]}
        style={{
          color: "#fff",
        }}
      >
        {value}
      </Typo.Title>
    </div>
  );
}

function SendConfirm({
  state,
  selectedCoin,
  suiBalance,
  gasBudget,
  // TODO: display gas error and prevent confirm
  gasError,
  onInputCoinAmountWithDecimals,
  onSubmit,
}: {
  state: SendData;
  selectedCoin: CoinDto;
  suiBalance: string;
  gasBudget: string;
  gasError?: string;
  onInputCoinAmountWithDecimals: (coinAmountWithDecimals: string) => void;
  onSubmit: () => Promise<void>;
}) {
  const [sendLoading, setSendLoading] = useState(false);

  // the max amount of coin that can be sent = the total balance - remaining gas budget
  const maxAmount = useMemo(() => {
    return maxCoinAmountWithDecimal(
      selectedCoin.type,
      selectedCoin.balance,
      selectedCoin.decimals,
      {
        gasBudget,
      }
    );
  }, [selectedCoin, gasBudget]);

  const isInputValid = useMemo(() => {
    const { coinAmountWithDecimals } = state;
    return isCoinAmountValid(coinAmountWithDecimals, maxAmount);
  }, [state, maxAmount]);

  return (
    <div className="h-[436px]">
      <div className={classNames("flex", "flex-col", "h-full")}>
        <InputAmount
          className={classNames("mx-[36px]", "grow", "bg-black")}
          coinSymbol={selectedCoin.symbol}
          initCoinAmount={state.coinAmountWithDecimals}
          maxCoinAmount={maxAmount}
          decimals={selectedCoin.decimals}
          isValid={state.coinAmountWithDecimals === "0" || isInputValid}
          onInput={onInputCoinAmountWithDecimals}
        />
        <div className={classNames("flex-none", styles["send-confirm-list"])}>
          <SendConfirmItem
            name="To"
            value={addressEllipsis(state.recipientAddress)}
          />
          <SendConfirmItem
            name="Balance"
            value={`${formatCurrency(selectedCoin.balance, {
              decimals: selectedCoin.decimals,
            })} ${selectedCoin.symbol}`}
          />
          {!isSuiToken(selectedCoin.type) && (
            <SendConfirmItem
              name="SUI Balance"
              value={`${formatSUI(suiBalance)} SUI`}
            />
          )}
          <SendConfirmItem
            name="Gas Budget"
            value={`${formatSUI(gasBudget)} SUI`}
          />
        </div>
        <div className={commonStyles["next-step"]}>
          <Button
            type={"submit"}
            disabled={!isInputValid}
            onClick={async () => {
              setSendLoading(true);
              try {
                await onSubmit();
              } finally {
                setSendLoading(false);
              }
            }}
            isLoading={sendLoading}
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SendConfirm;
