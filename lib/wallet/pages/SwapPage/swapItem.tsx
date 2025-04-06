import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SUI_DECIMALS } from "@mysten/sui.js";
import classNames from "classnames";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { ReactNode, useState } from "react";
import { formatCurrency, maxCoinAmountWithDecimal } from "../../core";
import useCoinBalance from "../../hooks/coin/useCoinBalance";
import { CoinDto } from "../../hooks/coin/useCoins";
import { Extendable } from "../../types";
import { CoinType } from "../../types/coin";
import { TokenSelector } from "../SendPage";
type SwapItemProps = Extendable & {
  type: "From" | "To";
  data: CoinType[] | undefined;
  coinInfo: CoinType | undefined;
  address: string;
  defaultValue?: any;
  onChange: (value: string) => void;
  inputErrorMessage?: string | null;
  amount: string | undefined;
  value: string;
  maxAmount?: string;
  onAmountChange?: (value: string) => void;
  trigger: ReactNode;
};

export default function SwapItem(props: SwapItemProps) {
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const { data: currentCoinBalance } = useCoinBalance(
    props.address,
    props.coinInfo?.type!
  );
  const onSelectCoin = (coin: CoinDto | string) => {
    console.log(coin);
    if (typeof coin === "string") {
      props.onChange(coin);
    } else {
      props.onChange(coin.type);
    }
  };
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="self-stretch inline-flex justify-between items-start">
        <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
          {props.type === "From" ? "Pay" : "Receive"}
        </div>
        <div className="flex justify-start items-center gap-2">
          <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
            Balance:{" "}
            {formatCurrency(currentCoinBalance?.balance, {
              decimals: currentCoinBalance.decimals,
              withAbbr: false,
            })}{" "}
            {props.coinInfo?.symbol}
          </div>
          <div
            onClick={() => {
              if (props.onAmountChange) {
                props.onAmountChange(
                  maxCoinAmountWithDecimal(
                    props.coinInfo?.type!,
                    currentCoinBalance?.balance,
                    currentCoinBalance.decimals
                  )
                );
              }
            }}
            className="justify-start text-[#68ffd1] text-sm font-normal font-['Sora'] underline leading-normal"
          >
            MAX
          </div>
        </div>
      </div>
      <div className="self-stretch px-3 py-2 bg-[#141414] rounded-xl outline outline-1 outline-offset-[-1px] outline-[#333333] inline-flex justify-between items-center">
        {/* <Select
        className="z-50"
        // onValueChange={console.log}
        // layoutClass="fixed left-0 right-0 bottom-0 w-[100wh] h-[400px]"
        defaultValue={props.defaultValue}
        value={props.value}
        onChange={props.onChange}
        trigger={props.trigger}
      >
        {props.data?.map((coin) => {
          return (
            <SelectItem
              key={coin.type}
              className="focus:outline-0"
              value={coin.type}
            >
              <TokenItem
                coin={coin}
                wrapperClass={"py-[20px] px-[20px] border-gray-100"}
              ></TokenItem>
            </SelectItem>
          );
        })}
      </Select> */}

        <Button
          variant="outline"
          className="justify-between rounded-full h-auto py-2 border-muted bg-[#141414] p-0"
          onClick={() => {
            setShowTokenSelector(true);
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 bg-blue-500 rounded-sm flex items-center justify-center cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setShowTokenSelector(true);
              }}
            >
              {props.coinInfo?.iconURL ? (
                <Image
                  src={props.coinInfo.iconURL || ""}
                  alt={props.coinInfo.symbol}
                  className="w-6 h-6 rounded-sm"
                  width={24}
                  height={24}
                />
              ) : (
                <Image
                  src={"/images/sui.svg"}
                  alt="water-drop"
                  className="w-6 h-6 rounded-sm"
                  width={24}
                  height={24}
                />
              )}
            </div>
            <span className="text-sm">{props.coinInfo?.symbol}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </Button>
        <div className="flex flex-col items-end">
          {props.type === "From" ? (
            <Input
              className={classNames(
                "text-white text-sm font-normal font-['Sora'] leading-normal border-none px-0 min-w-[100px]"
              )}
              // type="text"
              type="number"
              min="0"
              max={props.maxAmount}
              placeholder="0.00"
              value={props.amount}
              style={{
                textAlign: "end",
              }}
              onChange={(e) => {
                props.onAmountChange &&
                  props.onAmountChange((e.target as any).value);
              }}
            />
          ) : (
            <div
              className="focus:outline-0 text-xl flex-shrink text-right bg-transparent w-[110px] font-bold overflow-x-scroll no-scrollbar"
              style={{
                fontSize: 28,
              }}
            >
              {props.amount ? Number(props.amount).toString() : "-"}
            </div>
          )}

          {
            // if has error, how error
            props.inputErrorMessage ? (
              <p
                style={{
                  color: "#FF0000",
                }}
              >
                {props.inputErrorMessage}
              </p>
            ) : props.amount && props.coinInfo?.usdPrice ? (
              <p
                className="text-sm font-normal font-['Sora'] leading-normal"
                style={{
                  fontSize: 12,
                  color: "#858585",
                  textAlign: "end",
                }}
              >
                $
                {Number(
                  Number(props.amount) * Number(props.coinInfo.usdPrice)
                ).toLocaleString()}
              </p>
            ) : (
              <p
                className="text-white"
                style={{
                  textAlign: "end",
                  color: "#858585",
                }}
              >
                {"-"}
              </p>
            )
          }
        </div>
        <TokenSelector
          isOpen={showTokenSelector}
          setIsOpen={setShowTokenSelector}
          coinList={
            props.data?.map((coin: CoinType) => ({
              ...coin,
              decimals: coin.metadata?.decimals || SUI_DECIMALS,
              wrappedChain: coin.metadata?.wrappedChain || "",
              bridge: coin.metadata?.bridge || "",
            })) || []
          }
          onSelectCoin={onSelectCoin}
        />
      </div>
    </div>
  );
}
