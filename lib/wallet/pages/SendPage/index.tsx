import { useApolloClient } from "@apollo/client";
import { useCallback, useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import message from "../../components/message";
import Nav from "../../components/Nav";
import Typo from "../../components/Typo";
import { DEFAULT_SUI_COIN } from "../../constants/coin";
import {
  SendAndExecuteTxParams,
  TxEssentials,
  calculateCoinAmount,
} from "../../core";
import { getTransactionBlock } from "../../core/utils/txb-factory";
import { CoinDto } from "../../hooks/coin/useCoins";
import useSuiBalance from "../../hooks/coin/useSuiBalance";
import { useAccount } from "../../hooks/useAccount";
import { useApiClient } from "../../hooks/useApiClient";
import { useNetwork } from "../../hooks/useNetwork";
import { RootState } from "../../store";
import { OmitToken } from "../../types";
import { compareCoinAmount } from "../../utils/check";
import AddressInputPage from "./AddressInput";
import useCoinsWithSuiOnTop from "./hooks/useCoinsWithSuiOnTop";
import useGasBudgetForTransferCoin from "./hooks/useGasBudgetForTranferCoin";
import styles from "./index.module.scss";
import SendConfirm from "./SendConfirm";
import TokenItem from "./TokenItem";
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
  const [sendData, setSendData] = useState<SendData>({
    recipientAddress: "",
    coinType: "",
    coinAmountWithDecimals: "0",
  });

  const { data: gasResult, error: gasError } = useGasBudgetForTransferCoin({
    coinType: sendData.coinType,
    recipient: sendData.recipientAddress,
    network,
    walletId,
    accountId,
  });

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
      {mode === Mode.symbol && (
        <>
          <div className={"px-[32px]"}>
            <Typo.Title
              className={"mt-[48px] font-bold text-[36px] text-white"}
            >
              Select Token
            </Typo.Title>
          </div>
          <div className="flex flex-col gap-4">
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
                        console.log(coinType);
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
              state={"primary"}
              disabled={
                !sendData.coinType ||
                compareCoinAmount(selectedCoin.balance, 0) <= 0
              }
              onClick={() => {
                setMode(Mode.address);
              }}
            >
              {compareCoinAmount(selectedCoin.balance, 0) <= 0
                ? "Insufficient Balance"
                : "Next Step"}
            </Button>
          </div>
        </>
      )}
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

export default SendPage;
