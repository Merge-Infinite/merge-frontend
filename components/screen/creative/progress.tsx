"use client";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NFTImage } from "@/components/ui/nft-image";
import creativeApi from "@/lib/api/creative";
import React, { useEffect, useState } from "react";

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
  [NFTGenerationJobStatus.DUPLICATE_NFT]: "Change name",
};

const mappingStatusToBadgeColor = {
  [NFTGenerationJobStatus.PENDING]: "#ffebad",
  [NFTGenerationJobStatus.GENERATING_IMAGE]: "#ffebad",
  [NFTGenerationJobStatus.UPLOADING_IPFS]: "#ffebad",
  [NFTGenerationJobStatus.MINTING]: "#ffebad",
  [NFTGenerationJobStatus.COMPLETED]: "#99ffc6",
  [NFTGenerationJobStatus.FAILED]: "#ff1744",
  [NFTGenerationJobStatus.DUPLICATE_NFT]: "#ff1744",
};

const mappingStatusToBadgeTextColor = {
  [NFTGenerationJobStatus.PENDING]: "#b78401",
  [NFTGenerationJobStatus.GENERATING_IMAGE]: "#b78401",
  [NFTGenerationJobStatus.UPLOADING_IPFS]: "#b78401",
  [NFTGenerationJobStatus.MINTING]: "#b78401",
  [NFTGenerationJobStatus.COMPLETED]: "#009093",
  [NFTGenerationJobStatus.FAILED]: "#fff",
  [NFTGenerationJobStatus.DUPLICATE_NFT]: "#fff",
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

  // Group NFTs by date
  const groupNftsByDate = (nfts: any[]) => {
    const groups: { [key: string]: any[] } = {};
    const today = new Date().toDateString();

    nfts?.forEach((nft) => {
      const nftDate = nft.createdAt
        ? new Date(nft.createdAt).toDateString()
        : today;
      const dateKey =
        nftDate === today
          ? "Today"
          : new Date(nft.createdAt).toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(nft);
    });

    return groups;
  };

  const groupedNfts = groupNftsByDate(nftJobs as any[]);

  return (
    <>
      <div className="self-stretch inline-flex flex-col justify-start items-start gap-4 max-w-md">
        {nftJobsLoading ? (
          <SkeletonCard />
        ) : (
          <>
            {Object.entries(groupedNfts).map(([date, nfts], groupIndex) => (
              <div
                key={date}
                className="self-stretch inline-flex flex-col justify-start items-start gap-4"
              >
                <div className="self-stretch px-4 inline-flex justify-start items-center gap-2">
                  <div className="justify-start text-[#858585] text-sm font-bold font-['Sora'] leading-normal">
                    {date}
                  </div>
                </div>
                {nfts.map((nft, index) => (
                  <React.Fragment key={nft.id}>
                    <div className="w-full px-4 inline-flex justify-start items-start gap-3">
                      <div className="size-20 bg-[#1f1f1f] rounded-2xl flex justify-center items-center gap-2 overflow-hidden">
                        {nft.blobId ? (
                          <NFTImage
                            src={nft.blobId}
                            alt={nft.name}
                            width={80}
                            height={80}
                            className={`flex-1 h-20 object-cover ${
                              nft.status ===
                                NFTGenerationJobStatus.GENERATING_IMAGE ||
                              nft.status === NFTGenerationJobStatus.PENDING
                                ? "blur-[10px]"
                                : ""
                            }`}
                          />
                        ) : (
                          <div className="flex-1 h-20 bg-zinc-800" />
                        )}
                      </div>
                      <div className="flex-1 inline-flex flex-col justify-start items-start gap-1">
                        <div className="self-stretch justify-start text-white text-sm font-normal font-['Sora'] leading-tight line-clamp-2">
                          {nft.name}
                        </div>
                        {nft.transactionHash && (
                          <div
                            onClick={() => {
                              window.open(
                                `https://suivision.xyz/txblock/${nft.transactionHash}`,
                                "_blank"
                              );
                            }}
                            className="justify-start text-[#68ffd1] text-sm font-normal font-['Sora'] underline leading-normal cursor-pointer"
                          >
                            Transaction details
                          </div>
                        )}
                        <Badge
                          variant="secondary"
                          className={`px-2 py-1 rounded-3xl inline-flex justify-center items-center gap-1 font-['Sora'] ${
                            nft.status === NFTGenerationJobStatus.DUPLICATE_NFT
                              ? "cursor-pointer"
                              : ""
                          }`}
                          onClick={() => {
                            if (
                              nft.status ===
                              NFTGenerationJobStatus.DUPLICATE_NFT
                            ) {
                              handleDuplicateClick(nft);
                            }
                          }}
                          style={{
                            backgroundColor:
                              nft.status ===
                              NFTGenerationJobStatus.DUPLICATE_NFT
                                ? "#c02432"
                                : mappingStatusToBadgeColor[
                                    nft.status as keyof typeof mappingStatusToBadgeColor
                                  ] || "#ffebad",
                            color:
                              mappingStatusToBadgeTextColor[
                                nft.status as keyof typeof mappingStatusToBadgeTextColor
                              ] || "#b78401",
                          }}
                        >
                          {nft.status ===
                            NFTGenerationJobStatus.DUPLICATE_NFT && (
                            <div className="size-4 relative overflow-hidden">
                              <div className="size-3.5 left-[1.33px] top-[1.33px] absolute opacity-95 bg-white" />
                            </div>
                          )}
                          <div className="justify-start text-xs font-normal font-['Sora'] leading-none">
                            {mappingStatusToText[
                              nft.status as keyof typeof mappingStatusToText
                            ] || "Pending"}
                          </div>
                        </Badge>
                      </div>
                    </div>
                    {index < nfts.length - 1 && (
                      <div className="self-stretch h-0 relative">
                        <div className="w-full h-0 left-0 top-0 absolute outline outline-1 outline-offset-[-0.50px] outline-[#1f1f1f]" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
                {groupIndex < Object.keys(groupedNfts).length - 1 && (
                  <div className="self-stretch h-0 relative">
                    <div className="w-full h-0 left-0 top-0 absolute outline outline-1 outline-offset-[-0.50px] outline-[#1f1f1f]" />
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
      <Dialog open={duplicateDialog.open} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[425px] p-6 bg-gradient-to-b from-[#1f1f1f] to-[#171717] rounded-3xl border border-zinc-800 shadow-2xl">
          <DialogHeader>
            <DialogDescription className="self-stretch justify-start text-zinc-200 text-sm font-normal font-['Sora'] leading-relaxed">
              This NFT name is already taken. Please enter a unique name to
              continue minting.
            </DialogDescription>
          </DialogHeader>
          <div className="self-stretch flex flex-col justify-start items-start gap-3">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter a new NFT name"
              className="self-stretch max-h-52 min-h-20 px-4 py-3 bg-[#0a0a0a] rounded-xl outline outline-1 outline-offset-[-1px] outline-zinc-700 text-white text-sm font-normal font-['Sora'] leading-normal placeholder:text-zinc-500 border-none focus:outline-2 focus:outline-purple-500 transition-all"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isUpdatingNftName && newName.trim()) {
                  handleSubmitNewName();
                }
              }}
            />
          </div>
          <DialogFooter className="self-stretch inline-flex justify-start items-start gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isUpdatingNftName}
              className="px-5 py-2.5 bg-white rounded-full flex justify-center items-center gap-2 text-black text-sm font-semibold font-['Sora'] uppercase leading-normal tracking-wide hover:bg-gray-100 border-none transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmitNewName}
              disabled={!newName.trim() || isUpdatingNftName}
              isLoading={isUpdatingNftName}
              className="flex-1 px-5 py-2.5 bg-gradient-to-r from-[#a668ff] to-[#9050e0] rounded-full flex justify-center items-center gap-2 text-white text-sm font-semibold font-['Sora'] uppercase leading-normal tracking-wide hover:from-[#9050e0] hover:to-[#8040d0] border-none disabled:bg-[#6b4399] disabled:opacity-50 transition-all shadow-lg hover:shadow-purple-500/25"
            >
              {isUpdatingNftName ? "Renaming..." : "Rename & Mint"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreatureCustomizer;
