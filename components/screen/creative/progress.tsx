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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import creativeApi from "@/lib/api/creative";
import { formatAddress } from "@mysten/sui/utils";
import { Copy, Download, ExternalLink } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  FacebookIcon,
  FacebookShareButton,
  LinkedinIcon,
  LinkedinShareButton,
  RedditIcon,
  RedditShareButton,
  TelegramIcon,
  TelegramShareButton,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton,
  XIcon,
} from "react-share";

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
                        src={`https://walrus.tusky.io/${nft.blobId}`}
                        alt={nft.name}
                        width={176}
                        height={176}
                        unoptimized
                      />
                    )}
                  </div>
                  {nft.transactionHash && (
                    <Sheet>
                      <SheetTrigger asChild>
                        <div className="text-emerald-300 text-sm font-normal underline leading-normal cursor-pointer">
                          #{formatAddress(nft.transactionHash)}
                        </div>
                      </SheetTrigger>
                      <SheetContent
                        side="bottom"
                        className="w-96 pb-8 bg-[#141414] rounded-tl-3xl rounded-tr-3xl mx-auto"
                      >
                        <div className="inline-flex flex-col justify-start items-center gap-3 w-full">
                          <div className="self-stretch h-11 px-4 pt-4 inline-flex justify-between items-center">
                            <div className="justify-start text-white text-sm font-semibold font-['Sora'] uppercase leading-normal tracking-wide"></div>
                          </div>
                          <div className="self-stretch px-4 pb-2 flex flex-col justify-start items-start gap-6">
                            <div className="w-full flex flex-col justify-start items-start gap-1">
                              <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
                                Share via:
                              </div>
                              <div className="w-full inline-flex justify-start items-start gap-2 flex-wrap content-start overflow-hidden">
                                <div className="flex-1 min-w-24 p-4 bg-[#1f1f1f] rounded-2xl inline-flex flex-col justify-center items-center gap-2 overflow-hidden cursor-pointer hover:bg-[#2a2a2a] transition-colors">
                                  <FacebookShareButton
                                    url={`https://walrus.tusky.io/${nft.blobId}`}
                                    className="w-full h-full flex items-center justify-center"
                                    title={`Check out my NFT: ${nft.name}`}
                                  >
                                    <FacebookIcon size={24} round />
                                  </FacebookShareButton>
                                </div>
                                <div className="flex-1 min-w-24 p-4 bg-[#1f1f1f] rounded-2xl inline-flex flex-col justify-center items-center gap-2 overflow-hidden cursor-pointer hover:bg-[#2a2a2a] transition-colors">
                                  <TwitterShareButton
                                    url={`https://walrus.tusky.io/${nft.blobId}`}
                                    title={`Check out my NFT: ${nft.name}`}
                                    className="w-full h-full flex items-center justify-center"
                                  >
                                    <XIcon size={24} round />
                                  </TwitterShareButton>
                                </div>
                                <div className="flex-1 min-w-24 p-4 bg-[#1f1f1f] rounded-2xl inline-flex flex-col justify-center items-center gap-2 overflow-hidden cursor-pointer hover:bg-[#2a2a2a] transition-colors">
                                  <TelegramShareButton
                                    url={`https://walrus.tusky.io/${nft.blobId}`}
                                    title={`Check out my NFT: ${nft.name}`}
                                    className="w-full h-full flex items-center justify-center"
                                  >
                                    <TelegramIcon size={24} round />
                                  </TelegramShareButton>
                                </div>
                                <div className="flex-1 min-w-24 p-4 bg-[#1f1f1f] rounded-2xl inline-flex flex-col justify-center items-center gap-2 overflow-hidden cursor-pointer hover:bg-[#2a2a2a] transition-colors">
                                  <LinkedinShareButton
                                    url={`https://walrus.tusky.io/${nft.blobId}`}
                                    title={`Check out my NFT: ${nft.name}`}
                                    className="w-full h-full flex items-center justify-center"
                                  >
                                    <LinkedinIcon size={24} round />
                                  </LinkedinShareButton>
                                </div>
                                <div className="flex-1 min-w-24 p-4 bg-[#1f1f1f] rounded-2xl inline-flex flex-col justify-center items-center gap-2 overflow-hidden cursor-pointer hover:bg-[#2a2a2a] transition-colors">
                                  <RedditShareButton
                                    url={`https://walrus.tusky.io/${nft.blobId}`}
                                    title={`Check out my NFT: ${nft.name}`}
                                    className="w-full h-full flex items-center justify-center"
                                  >
                                    <RedditIcon size={24} round />
                                  </RedditShareButton>
                                </div>
                                <div className="flex-1 min-w-24 p-4 bg-[#1f1f1f] rounded-2xl inline-flex flex-col justify-center items-center gap-2 overflow-hidden cursor-pointer hover:bg-[#2a2a2a] transition-colors">
                                  <WhatsappShareButton
                                    url={`https://walrus.tusky.io/${nft.blobId}`}
                                    title={`Check out my NFT: ${nft.name}`}
                                    className="w-full h-full flex items-center justify-center"
                                  >
                                    <WhatsappIcon size={24} round />
                                  </WhatsappShareButton>
                                </div>
                              </div>
                            </div>
                            <div className="w-full flex flex-col justify-start items-start gap-2 overflow-hidden">
                              <div
                                onClick={() => {
                                  navigator.clipboard.writeText(nft.prompt);
                                }}
                                className="self-stretch px-4 py-3 bg-[#1f1f1f] rounded-2xl inline-flex justify-start items-center gap-2 overflow-hidden cursor-pointer hover:bg-[#2a2a2a] transition-colors"
                              >
                                <Copy className="w-6 h-6 text-white" />
                                <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
                                  Copy Prompt
                                </div>
                              </div>
                              <div
                                className="self-stretch px-4 py-3 bg-[#1f1f1f] rounded-2xl inline-flex justify-start items-center gap-2 overflow-hidden cursor-pointer hover:bg-[#2a2a2a] transition-colors"
                                onClick={() => {
                                  const link = document.createElement("a");
                                  link.href = `https://walrus.tusky.io/${nft.blobId}`;
                                  link.download = `${nft.name}.jpg`;
                                  link.click();
                                }}
                              >
                                <Download className="w-6 h-6 text-white" />
                                <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
                                  Download Image
                                </div>
                              </div>
                              <div
                                className="w-full px-4 py-3 bg-[#1f1f1f] rounded-2xl inline-flex justify-start items-center gap-2 overflow-hidden cursor-pointer hover:bg-[#2a2a2a] transition-colors"
                                onClick={() => {
                                  window.open(
                                    `https://suivision.xyz/txblock/${nft.transactionHash}`,
                                    "_blank"
                                  );
                                }}
                              >
                                <ExternalLink className="w-6 h-6 text-white" />
                                <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
                                  View on Explorer
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
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
                        ] || "#b78401",
                      color:
                        mappingStatusToBadgeTextColor[
                          nft.status as keyof typeof mappingStatusToBadgeTextColor
                        ],
                    }}
                  >
                    {mappingStatusToText[
                      nft.status as keyof typeof mappingStatusToText
                    ] || "Pending"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
      <Dialog open={duplicateDialog.open} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[425px] p-4 bg-[#1f1f1f] rounded-2xl border-none">
          <DialogHeader>
            <DialogDescription className="self-stretch justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
              This NFT name is already taken. Please enter a unique name to
              continue minting.
            </DialogDescription>
          </DialogHeader>
          <div className="self-stretch flex flex-col justify-start items-start gap-3">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter a new NFT name"
              className="self-stretch max-h-52 min-h-20 px-3 py-2 bg-[#141414] rounded-xl outline outline-1 outline-offset-[-1px] outline-[#333333] text-white text-sm font-normal font-['Sora'] leading-normal placeholder:text-[#858585] border-none"
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
              className="px-4 py-2 bg-white rounded-3xl flex justify-center items-center gap-2 text-black text-sm font-semibold font-['Sora'] uppercase leading-normal tracking-wide hover:bg-white border-none"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmitNewName}
              disabled={!newName.trim() || isUpdatingNftName}
              isLoading={isUpdatingNftName}
              className="flex-1 px-4 py-2 bg-[#a668ff] rounded-3xl flex justify-center items-center gap-2 text-white text-sm font-semibold font-['Sora'] uppercase leading-normal tracking-wide hover:bg-[#a668ff] border-none disabled:bg-[#6b4399] disabled:opacity-50"
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
