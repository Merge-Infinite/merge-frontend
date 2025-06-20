import { WebApiClient } from "../../../scripts/shared/ui-api-client";
import { OmitToken } from "../../../types";
import { TransferCoinParams, TxEssentials } from "../../../core";
import { getTransactionBlock } from "../../../core/utils/txb-factory";
import { TransactionBlock } from "@mysten/sui.js";

export default async function createTransferCoinTxb(params: {
  apiClient: WebApiClient;
  context: OmitToken<TxEssentials> | undefined;
  coinType: string;
  recipient: string;
  amount: string;
}): Promise<TransactionBlock> {
  const { apiClient, context, coinType, recipient, amount } = params;

  if (!context) throw new Error("context is undefined");

  const serialized = await apiClient.callFunc<
    TransferCoinParams<OmitToken<TxEssentials>>,
    string
  >(
    "txn",
    "getSerializedTransferCoinTxb",
    {
      coinType,
      amount, // mock for dry run
      recipient,
      context,
    },
    { withAuth: true }
  );
  return getTransactionBlock(serialized);
}
