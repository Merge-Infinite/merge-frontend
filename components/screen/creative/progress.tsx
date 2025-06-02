"use client";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import creativeApi from "@/lib/api/creative";
import { formatAddress } from "@mysten/sui/utils";
import Image from "next/image";
import { useEffect, useState } from "react";

export const NFTGenerationJobStatus = {
  PENDING: "PENDING",
  GENERATING_IMAGE: "GENERATING_IMAGE",
  UPLOADING_IPFS: "UPLOADING_IPFS",
  MINTING: "MINTING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  DUPLICATE_NFT: "DUPLICATE_NFT",
};

const mappingStatusToText = {
  [NFTGenerationJobStatus.PENDING]: "Pending",
  [NFTGenerationJobStatus.GENERATING_IMAGE]: "Generating Image",
  [NFTGenerationJobStatus.UPLOADING_IPFS]: "Uploading IPFS",
  [NFTGenerationJobStatus.MINTING]: "Minting",
  [NFTGenerationJobStatus.COMPLETED]: "Completed",
  [NFTGenerationJobStatus.FAILED]: "Failed",
};

const mappingStatusToBadgeColor = {
  [NFTGenerationJobStatus.PENDING]: "#ffebad",
  [NFTGenerationJobStatus.GENERATING_IMAGE]: "#ffebad",
  [NFTGenerationJobStatus.UPLOADING_IPFS]: "#ffebad",
  [NFTGenerationJobStatus.MINTING]: "#ffebad",
  [NFTGenerationJobStatus.COMPLETED]: "#99ffc6",
  [NFTGenerationJobStatus.FAILED]: "#ff1744",
};

const mappingStatusToBadgeTextColor = {
  [NFTGenerationJobStatus.PENDING]: "#b78401",
  [NFTGenerationJobStatus.GENERATING_IMAGE]: "#b78401",
  [NFTGenerationJobStatus.UPLOADING_IPFS]: "#b78401",
  [NFTGenerationJobStatus.MINTING]: "#b78401",
  [NFTGenerationJobStatus.COMPLETED]: "#009093",
  [NFTGenerationJobStatus.FAILED]: "#fff",
};

const CreatureCustomizer = () => {
  const [duplicateDialog, setDuplicateDialog] = useState<{
    open: boolean;
    nft: any;
  }>({ open: false, nft: null });

  const [newName, setNewName] = useState("");
  const {
    data: nftJobs,
    isLoading: nftJobsLoading,
    refetch: refetchNftJobs,
  } = creativeApi.getNftJob.useQuery();

  const { mutateAsync: updateNftName, isPending: isUpdatingNftName } =
    creativeApi.updateNftName.useMutation();

  useEffect(() => {
    const interval = setInterval(() => {
      refetchNftJobs();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDuplicateClick = (nft: any) => {
    setDuplicateDialog({ open: true, nft });
    setNewName(nft.name || "");
  };

  const handleSubmitNewName = async () => {
    if (!newName.trim() || !duplicateDialog.nft) return;

    try {
      // Replace with your actual API call
      await updateNftName({
        jobId: duplicateDialog.nft.id,
        name: newName.trim(),
      });

      setDuplicateDialog({ open: false, nft: null });
      setNewName("");
      refetchNftJobs();
    } catch (error) {
      console.error("Failed to resubmit NFT:", error);
    } finally {
    }
  };

  const handleCloseDialog = () => {
    setDuplicateDialog({ open: false, nft: null });
    setNewName("");
  };

  return (
    <>
      <div className="flex justify-start items-start gap-4 grid grid-cols-2">
        {nftJobsLoading ? (
          <SkeletonCard />
        ) : (
          <>
            {(nftJobs as any[])?.map((nft) => (
              <Card className="w-44 bg-transparent border-none" key={nft.id}>
                <CardContent className="p-0 flex flex-col items-center gap-2">
                  <div className="w-44 h-44 bg-zinc-800 rounded-2xl flex justify-center items-center overflow-hidden">
                    {nft.blobId && (
                      <Image
                        src={`https://wal.gg/${nft.blobId}`}
                        alt={nft.name}
                        width={176}
                        height={176}
                      />
                    )}
                  </div>
                  {nft.transactionHash && (
                    <div
                      onClick={() => {
                        window.open(
                          `https://suivision.xyz/txblock/${nft.transactionHash}`,
                          "_blank"
                        );
                      }}
                      className="text-emerald-300 text-sm font-normal underline leading-normal cursor-pointer"
                    >
                      #{formatAddress(nft.transactionHash)}
                    </div>
                  )}
                  <div className="text-white text-sm font-normal leading-normal text-center">
                    {nft.name}
                  </div>
                  <Badge
                    variant="secondary"
                    className="w-full justify-center bg-white text-black hover:bg-white font-['Sora'] rounded-3xl py-1 text-xs"
                    onClick={() => {
                      if (nft.status === NFTGenerationJobStatus.DUPLICATE_NFT) {
                        handleDuplicateClick(nft);
                      }
                    }}
                    style={{
                      backgroundColor:
                        mappingStatusToBadgeColor[
                          nft.status as keyof typeof mappingStatusToBadgeColor
                        ],
                      color:
                        mappingStatusToBadgeTextColor[
                          nft.status as keyof typeof mappingStatusToBadgeTextColor
                        ],
                    }}
                  >
                    {
                      mappingStatusToText[
                        nft.status as keyof typeof mappingStatusToText
                      ]
                    }
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
      <Dialog open={duplicateDialog.open} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Duplicate NFT Name</DialogTitle>
            <DialogDescription>
              This NFT name already exists. Please provide a new name to
              continue with the minting process.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newName" className="text-right">
                New Name
              </Label>
              <Input
                id="newName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="col-span-3"
                placeholder="Enter a new name for your NFT"
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !isUpdatingNftName &&
                    newName.trim()
                  ) {
                    handleSubmitNewName();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isUpdatingNftName}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmitNewName}
              disabled={!newName.trim() || isUpdatingNftName}
              isLoading={isUpdatingNftName}
            >
              {isUpdatingNftName ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreatureCustomizer;
