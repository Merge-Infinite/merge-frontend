import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useApolloClient } from "@apollo/client";
import { formatAddress, isValidSuiAddress } from "@mysten/sui.js";
import { useDebounceEffect } from "ahooks";
import classNames from "classnames";
import dayjs from "dayjs";
import {
  ChevronDown,
  ClipboardCopy,
  Scan,
  Search,
  ViewIcon,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { resolveDomain } from "../../api/suins";
import IconToken from "../../assets/icons/token.svg";
import UnverifiedIcon from "../../assets/icons/unverified.svg";
import VerifiedIcon from "../../assets/icons/verified.svg";
import { TokenIcon } from "../../components/icons";
import message from "../../components/message";
import Nav from "../../components/Nav";
import Tooltip from "../../components/Tooltip";
import { DEFAULT_SUI_COIN } from "../../constants/coin";
import {
  SendAndExecuteTxParams,
  TxEssentials,
  addressEllipsis,
  calculateCoinAmount,
  formatCurrency,
  formatSUI,
  maxCoinAmountWithDecimal,
} from "../../core";
import { getTransactionBlock } from "../../core/utils/txb-factory";
import { CoinDto } from "../../hooks/coin/useCoins";
import useSuiBalance from "../../hooks/coin/useSuiBalance";
import { useAccount } from "../../hooks/useAccount";
import { useApiClient } from "../../hooks/useApiClient";
import { useNetwork } from "../../hooks/useNetwork";
import { RootState } from "../../store";
import { OmitToken } from "../../types";
import { isValidDomain } from "../../utils/address";
import { compareCoinAmount, isSuiToken } from "../../utils/check";
import AddressInputPage from "./AddressInput";
import useCoinsWithSuiOnTop from "./hooks/useCoinsWithSuiOnTop";
import useGasBudgetForTransferCoin from "./hooks/useGasBudgetForTranferCoin";
import useTransactionList from "./hooks/useTransactionList";
import styles from "./index.module.scss";
import SendConfirm, { SendConfirmItem } from "./SendConfirm";
import { SendData } from "./types";
import createTransferCoinTxb from "./utils/createTransferCoinTxb";
enum Mode {
  symbol,
  address,
  confirm,
}

const SendPage = () => {
  const { accountId, walletId, networkId } = useSelector(
    (state: RootState) => state.appContext
  );
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const { data: network } = useNetwork(networkId);
  const client = useApolloClient();
  const apiClient = useApiClient();
  const navigate = useNavigate();
  const { address } = useAccount(accountId);
  const { data: suiBalance } = useSuiBalance(address);
  const { data: coinsWithSuiOnTop, loading: coinsLoading } =
    useCoinsWithSuiOnTop(address);

  const [mode, setMode] = useState(Mode.symbol);
  const [selectedCoin, setSelectedCoin] = useState<CoinDto>(DEFAULT_SUI_COIN);
  const [namerServiceAddress, setNameServiceAddress] = useState("");
  const [isLoadingNameServiceAddress, setIsLoadingNameServiceAddress] =
    useState(false);
  const { getTransactionList, data: history, loading } = useTransactionList();

  const [sendData, setSendData] = useState<SendData>({
    recipientAddress: "",
    coinType: "",
    coinAmountWithDecimals: "0",
  });
  const resolvedAddress = namerServiceAddress || sendData.recipientAddress;
  const isValidateInput = isValidSuiAddress(resolvedAddress);
  const { data: gasResult, error: gasError } = useGasBudgetForTransferCoin({
    coinType: sendData.coinType,
    recipient: sendData.recipientAddress,
    network,
    walletId,
    accountId,
  });

  console.log("history", history);

  useDebounceEffect(() => {
    console.log("sendData.recipientAddress", sendData.recipientAddress);
    if (isValidDomain(sendData.recipientAddress)) {
      setIsLoadingNameServiceAddress(true);
      resolveDomain(sendData.recipientAddress, { networkId })
        .then((address) => {
          setNameServiceAddress(address);
          setIsLoadingNameServiceAddress(false);
        })
        .finally(() => setIsLoadingNameServiceAddress(false));
    } else {
      setNameServiceAddress("");
    }
  }, [sendData.recipientAddress]);

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

  const submitTransaction = useCallback(async () => {
    if (!sendData.recipientAddress || !sendData.coinType) return;
    if (!network) throw new Error("network is undefined");

    const txEssentials: OmitToken<TxEssentials> = {
      network,
      walletId,
      accountId,
    };
    const coinAmount = calculateCoinAmount(
      sendData.coinAmountWithDecimals,
      selectedCoin.decimals
    );
    const serializedTxb = await createTransferCoinTxb({
      apiClient,
      context: txEssentials,
      coinType: sendData.coinType,
      recipient: sendData.recipientAddress,
      amount: coinAmount,
    });
    const txb = getTransactionBlock(serializedTxb);
    txb.setGasBudget(BigInt(gasResult.gasBudget));
    try {
      await apiClient.callFunc<
        SendAndExecuteTxParams<string, OmitToken<TxEssentials>>,
        void
      >(
        "txn",
        "signAndExecuteTransactionBlock",
        {
          transactionBlock: txb.serialize(),
          context: txEssentials,
        },
        {
          withAuth: true,
        }
      );
      message.success("Send transaction succeeded");
      navigate("/transaction/flow");
    } catch (e: any) {
      console.error(e);
      message.error(`Send transaction failed: ${e?.message}`);
    }

    // refetch tx in 500ms
    setTimeout(() => {
      client.resetStore();
    }, 500);
  }, [gasResult, sendData, selectedCoin]);

  useEffect(() => {
    if (coinsWithSuiOnTop.length === 0) return;
    if (selectedCoin === DEFAULT_SUI_COIN) {
      const firstCoin = coinsWithSuiOnTop[0];
      setSendData((prev) => ({
        ...prev,
        coinType: firstCoin.type,
      }));
      setSelectedCoin(firstCoin);
    }
  }, [coinsWithSuiOnTop]);

  const onSelectCoin = (coin: CoinDto) => {
    setSelectedCoin(coin);
    setSendData((prev) => ({
      ...prev,
      coinType: coin.type,
    }));
  };

  console.log("selectedCoin", selectedCoin);

  const maxAmount = useMemo(() => {
    return maxCoinAmountWithDecimal(
      selectedCoin.type,
      selectedCoin.balance,
      selectedCoin.decimals,
      {
        gasBudget: gasResult.gasBudget,
      }
    );
  }, [selectedCoin, gasResult.gasBudget]);

  return (
    <div className={styles["page"]}>
      <Nav
        position={"relative"}
        onNavBack={() => {
          switch (mode) {
            case Mode.symbol:
              navigate(-1);
              break;
            case Mode.address:
              setMode(Mode.symbol);
              break;
            case Mode.confirm:
              setMode(Mode.address);
              break;
            default:
          }
        }}
        title="Send"
      />
      <div className="w-full  flex flex-col gap-4">
        <h1 className="text-xl uppercase font-normal text-white">Send</h1>

        {/* Token Selection */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-white">Token</label>
          <Button
            variant="outline"
            className="justify-between rounded-full h-auto py-2 border-muted bg-[#141414]"
            onClick={() => setShowTokenSelector(true)}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 bg-blue-500 rounded-sm flex items-center justify-center cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTokenSelector(true);
                }}
              >
                {selectedCoin.iconURL ? (
                  <Image
                    src={selectedCoin.iconURL || ""}
                    alt={selectedCoin.symbol}
                    className="w-6 h-6 rounded-sm"
                    width={24}
                    height={24}
                  />
                ) : isSuiToken(selectedCoin.type) ? (
                  <Image
                    src={"/images/sui.svg"}
                    alt="water-drop"
                    className="w-6 h-6 rounded-sm"
                    width={24}
                    height={24}
                  />
                ) : (
                  <TokenIcon
                    icon={IconToken}
                    alt="water-drop"
                    className={classNames(
                      [
                        isSuiToken(selectedCoin.type)
                          ? ""
                          : styles["icon-wrap-default"],
                      ],
                      "grow-0"
                    )}
                  />
                )}
              </div>
              <span className="text-sm">{selectedCoin.symbol}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-sm">
              {formatCurrency(selectedCoin.balance, {
                decimals: selectedCoin.decimals,
                withAbbr: false,
              })}
            </span>
          </Button>
        </div>

        {/* Amount Input */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-white">Amount</label>
          <div className="flex items-center justify-between rounded-full border border-muted bg-[#141414] px-3 py-2">
            <Input
              type="number"
              value={sendData.coinAmountWithDecimals}
              className="border-0 shadow-none p-0 h-auto text-sm focus-visible:ring-0 focus-visible:ring-offset-0 text-white"
              onChange={(e) => {
                setSendData((prev) => ({
                  ...prev,
                  coinAmountWithDecimals: e.target.value,
                }));
              }}
            />
            <Button
              onClick={() => {
                setSendData((prev) => ({
                  ...prev,
                  coinAmountWithDecimals: maxAmount,
                }));
              }}
              variant="link"
              className="underline h-auto p-0 text-white"
            >
              MAX
            </Button>
          </div>
        </div>

        {/* Recipient Input */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-white">To</label>
          <div className="flex items-center justify-between rounded-full border border-muted bg-[#141414] px-3 py-2">
            <Input
              type="text"
              placeholder="Enter SUI address or domain name"
              className="border-0 shadow-none p-0 h-auto text-xs focus-visible:ring-0 focus-visible:ring-offset-0 text-white"
              value={sendData.recipientAddress}
              onChange={(e) => {
                setSendData((prev) => ({
                  ...prev,
                  recipientAddress: e.target.value,
                }));
              }}
            />
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                <Scan className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0"
                onClick={async () => {
                  // Get the value from clipboard
                  try {
                    const clipboardText = await navigator.clipboard.readText();
                    if (clipboardText) {
                      setSendData((prev) => ({
                        ...prev,
                        recipientAddress: clipboardText,
                      }));
                    }
                  } catch (error) {
                    console.error("Failed to read clipboard:", error);
                    message.error("Failed to read from clipboard");
                  }
                }}
              >
                <ClipboardCopy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isLoadingNameServiceAddress ||
          (isValidDomain(sendData.recipientAddress) &&
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
            isValidDomain(sendData.recipientAddress) &&
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
                className={classNames(
                  styles["transaction-num"],
                  "flex mt-4 text-white justify-between bg-[#141414] p-2 rounded-full"
                )}
                style={{
                  color: "#fff",
                }}
              >
                {history?.length} transactions in a week
                <div
                  onClick={() => {
                    window.open(
                      `https://suiscan.xyz/mainnet/account/${resolvedAddress}`,
                      "_blank"
                    );
                  }}
                  className={classNames(
                    styles["view-btn"],
                    "text-white flex items-center gap-1"
                  )}
                >
                  view <ViewIcon />
                </div>
              </div>
            ) : (
              <div
                className={classNames(
                  styles["transaction-num"],
                  styles["warn"],
                  "mt-4 bg-[#141414] p-2 rounded-full"
                )}
              >
                <div className={styles["warn-btn"]}>Warn</div>
                <div className={styles["warn-desc"]}>
                  No recent transactions
                </div>
              </div>
            ))
          )}
        </div>

        {sendData.coinType &&
          compareCoinAmount(selectedCoin.balance, 0) > 0 &&
          isValidateInput && (
            <div
              className={classNames("flex-none", styles["send-confirm-list"])}
            >
              <SendConfirmItem
                name="To"
                value={addressEllipsis(sendData.recipientAddress)}
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
                  value={`${formatSUI(suiBalance.balance)} SUI`}
                />
              )}
              <SendConfirmItem
                name="Gas Budget"
                value={`${formatSUI(gasResult.gasBudget)} SUI`}
              />
            </div>
          )}

        {/* Send Button */}
        <Button
          className="hover:bg-purple-600 text-black uppercase"
          type={"submit"}
          disabled={
            !sendData.coinType ||
            compareCoinAmount(selectedCoin.balance, 0) <= 0 ||
            !isValidateInput ||
            sendLoading
          }
          isLoading={sendLoading}
          onClick={async () => {
            setSendLoading(true);
            try {
              await submitTransaction();
            } finally {
              setSendLoading(false);
            }
          }}
        >
          {compareCoinAmount(selectedCoin.balance, 0) <= 0
            ? "Insufficient Balance"
            : "Send"}
        </Button>

        {/* Token Selection Bottom Sheet */}
        <TokenSelector
          isOpen={showTokenSelector}
          setIsOpen={setShowTokenSelector}
          coinList={coinsWithSuiOnTop}
          onSelectCoin={onSelectCoin}
        />
      </div>
      {/* {mode === Mode.symbol && (
        <>
          <div className={"px-[32px]"}>
            <Typo.Title
              className={"mt-[48px] font-bold text-[36px] text-white"}
            >
              Select Token
            </Typo.Title>
          </div>
          <div className="flex flex-col gap-4 ">
            <div className={styles["token-list"]}>
              {coinsLoading && (
                <Skeleton width="100%" height="73px" className="block" />
              )}
              {!coinsLoading &&
                coinsWithSuiOnTop.map((coin) => {
                  return (
                    <TokenItem
                      key={coin.type}
                      type={coin.type}
                      symbol={coin.symbol}
                      balance={coin.balance}
                      decimals={coin.decimals}
                      verified={coin.isVerified}
                      selected={sendData.coinType === coin.type}
                      isVerified={coin.isVerified}
                      usd={coin.usd}
                      pricePercentChange24h={coin.pricePercentChange24h}
                      wrappedChain={coin.wrappedChain}
                      bridge={coin.bridge}
                      onClick={(coinType) => {
                        console.log("sendData", sendData.coinType);
                        console.log(coin);
                        setSelectedCoin(coin);
                        setSendData((prev) => ({
                          ...prev,
                          coinType,
                        }));
                      }}
                    />
                  );
                })}
            </div>
            <Button
              type={"submit"}
              className="w-full"
              disabled={
                !sendData.coinType ||
                compareCoinAmount(selectedCoin.balance, 0) <= 0
              }
              onClick={() => {
                console.log("sendData");
                setMode(Mode.address);
              }}
            >
              {compareCoinAmount(selectedCoin.balance, 0) <= 0
                ? "Insufficient Balance"
                : "Next Step"}
            </Button>
          </div>
        </>
      )} */}
      {mode === Mode.address && (
        <AddressInputPage
          onNext={() => {
            setMode(Mode.confirm);
          }}
          state={sendData}
          onSubmit={(address) => {
            setSendData((prev) => {
              return {
                ...prev,
                recipientAddress: address,
              };
            });
          }}
        />
      )}
      {mode === Mode.confirm && (
        <SendConfirm
          state={sendData}
          selectedCoin={selectedCoin}
          suiBalance={suiBalance.balance}
          gasBudget={gasResult.gasBudget}
          gasError={gasError}
          onInputCoinAmountWithDecimals={(amountWithDecimals) => {
            setSendData((prev) => {
              return {
                ...prev,
                coinAmountWithDecimals: amountWithDecimals,
              };
            });
          }}
          onSubmit={submitTransaction}
        />
      )}
    </div>
  );
};

export const TokenSelector = ({
  isOpen,
  setIsOpen,
  coinList,
  onSelectCoin,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  coinList: CoinDto[];
  onSelectCoin: (coin: CoinDto | string) => void;
}) => {
  console.log("coinList", coinList);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        side="bottom"
        className="p-0 rounded-3xl bg-transparent"
        style={{
          height: "70%",
        }}
      >
        <div className="w-full bg-[#141414] rounded-3xl p-4 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-normal text-white">Select a token</h3>
          </div>

          <div className="flex items-center  gap-2 mb-4 border border-[#333333] rounded-full px-4">
            <Search className="h-4 w-4 text-white" />

            <Input
              placeholder="Search name or address"
              className="pl-10 bg-[#141414] border-none rounded-full text-gray-400"
            />
          </div>

          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-white">Asset</span>
            <span className="text-sm text-white">Balance</span>
          </div>

          <div className="space-y-2  overflow-y-auto">
            {coinList.map((coin) => {
              const isSUI = isSuiToken(coin.type);
              return (
                <div
                  className="flex justify-between items-center p-2 hover:bg-accent hover:bg-opacity-20 rounded-lg cursor-pointer"
                  onClick={() => {
                    onSelectCoin(coin);
                    setIsOpen(false);
                  }}
                  key={coin.type}
                >
                  <div className="flex items-center gap-2">
                    {coin.iconURL ? (
                      <Image
                        src={coin.iconURL || ""}
                        alt={coin.symbol}
                        className="w-6 h-6 rounded-sm"
                        width={24}
                        height={24}
                      />
                    ) : isSUI ? (
                      <Image
                        src={"/images/sui.svg"}
                        alt="water-drop"
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
                    <div className="flex flex-col gap-1">
                      <div className="text-sm text-white gap-1 flex items-center">
                        {coin.symbol}
                        {coin.isVerified ? (
                          <Tooltip message={"Verified"}>
                            <VerifiedIcon
                              alt="verified"
                              width={14}
                              height={14}
                            />
                          </Tooltip>
                        ) : (
                          <Tooltip
                            message={
                              "Unverified: proceed with caution and research before use"
                            }
                          >
                            <UnverifiedIcon
                              alt="unverified"
                              width={14}
                              height={14}
                            />
                          </Tooltip>
                        )}
                      </div>
                      <div className="justify-start text-white text-xs font-normal font-['Sora'] leading-none">
                        {coin.type.length > 15
                          ? formatAddress(coin.type)
                          : coin.type}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm text-white">
                    {coin.balance &&
                      formatCurrency(coin.balance, {
                        decimals: coin.metadata?.decimals || coin.decimals,
                        withAbbr: false,
                      })}
                    {" " + coin.symbol}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
export default SendPage;
