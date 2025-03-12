// components/KioskCreator.tsx
import { useState } from "react";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { useWallet } from "@/lib/wallet/hooks/useWallet";
import { createUnstakeTransaction } from "@/lib/wallet/pages/StakingPage/utils";
import {
  SendAndExecuteTxParams,
  TxEssentials,
} from "@/lib/wallet/core/api/txn";
import { OmitToken } from "@/lib/wallet/types";
import { useApiClient } from "@/lib/wallet/hooks/useApiClient";
import { RootState } from "@/lib/wallet/store";
import { useSelector } from "react-redux";
import { useNetwork } from "@/lib/wallet/hooks/useNetwork";
import { useAccount } from "@/lib/wallet/hooks/useAccount";

export const KioskCreator = () => {
  const apiClient = useApiClient();
  const appContext = useSelector((state: RootState) => state.appContext);
  const { address } = useAccount(appContext.accountId);
  const { data: network } = useNetwork(appContext.networkId);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    kioskId?: string;
    kioskCap?: string;
    error?: string;
    txDigest?: string;
  } | null>(null);

  console.log(address);

  const handleCreateKiosk = async () => {
    try {
      setLoading(true);

      // Create transaction block for kiosk creation
      const txb = new TransactionBlock();

      // Call the kiosk creation function
      const [kiosk, kioskCap] = txb.moveCall({
        target: "0x2::kiosk::new",
      });

      // Share the kiosk object to make it accessible
      txb.moveCall({
        target: "0x2::transfer::public_share_object",
        arguments: [kiosk],
      });

      // Transfer the kiosk cap to the wallet owner
      txb.transferObjects([kioskCap], txb.pure(address));

      txb.setGasBudget(700_000_000);
      const response = await apiClient.callFunc<
        SendAndExecuteTxParams<string, OmitToken<TxEssentials>>,
        undefined
      >(
        "txn",
        "signAndExecuteTransactionBlock",
        {
          transactionBlock: txb.serialize(),
          context: {
            network,
            walletId: appContext.walletId,
            accountId: appContext.accountId,
          },
        },
        { withAuth: false }
      );

      // Process the transaction response
      if (response && response.digest) {
        // Extract created objects from the transaction results
        const createdObjects = response.objectChanges?.filter(
          (change) => change.type === "created"
        );

        // Find the kiosk and kiosk cap objects
        const kioskObject = createdObjects?.find(
          (obj) =>
            "objectType" in obj && obj.objectType.includes("::kiosk::Kiosk")
        );

        const kioskCapObject = createdObjects?.find(
          (obj) =>
            "objectType" in obj &&
            obj.objectType.includes("::kiosk::KioskOwnerCap")
        );

        if (
          kioskObject &&
          kioskCapObject &&
          "objectId" in kioskObject &&
          "objectId" in kioskCapObject
        ) {
          setResult({
            success: true,
            message: "Kiosk created successfully",
            kioskId: kioskObject.objectId,
            kioskCap: kioskCapObject.objectId,
            txDigest: response.digest,
          });
        } else {
          setResult({
            success: false,
            message:
              "Failed to extract kiosk information from transaction results",
            txDigest: response.digest,
          });
        }
      } else {
        setResult({
          success: false,
          message: "Transaction failed",
          error: "No transaction digest returned",
        });
      }
    } catch (error) {
      console.error("Error creating kiosk:", error);
      setResult({
        success: false,
        message: "Error creating kiosk",
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Sui Kiosk Creator</h2>
      <button
        onClick={handleCreateKiosk}
        disabled={loading}
        className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Kiosk"}
      </button>
      {result && (
        <div className="mt-6 p-4 rounded-lg bg-gray-50">
          <h3 className="font-bold text-lg mb-2">
            {result.success ? "Success!" : "Error"}
          </h3>
          <p className="mb-2">{result.message}</p>

          {result.success && (
            <>
              <div className="mb-2">
                <p>
                  <strong>Kiosk ID:</strong>
                </p>
                <p className="text-sm break-all bg-gray-100 p-2 rounded">
                  {result.kioskId}
                </p>
              </div>
              <div className="mb-2">
                <p>
                  <strong>Kiosk Cap:</strong>
                </p>
                <p className="text-sm break-all bg-gray-100 p-2 rounded">
                  {result.kioskCap}
                </p>
              </div>
              <div>
                <p>
                  <strong>Transaction:</strong>
                </p>
                <a
                  href={`https://explorer.sui.io/transaction/${result.txDigest}?network=mainnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm break-all"
                >
                  {result.txDigest}
                </a>
              </div>
            </>
          )}

          {!result.success && result.error && (
            <p className="text-red-600">{result.error}</p>
          )}
        </div>
      )}
    </div>
  );
};
