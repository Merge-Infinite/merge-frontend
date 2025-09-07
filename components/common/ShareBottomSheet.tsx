"use client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Copy, Download, ExternalLink } from "lucide-react";
import { ReactNode } from "react";
import {
  FacebookIcon,
  FacebookShareButton,
  RedditIcon,
  RedditShareButton,
  TelegramIcon,
  TelegramShareButton,
  TwitterShareButton,
  XIcon,
} from "react-share";
import { toast } from "sonner";

interface ShareBottomSheetProps {
  trigger: ReactNode;
  blobId?: string;
  name?: string;
  prompt?: any;
  transactionHash?: string;
  nftId?: string;
}

export const ShareBottomSheet = ({
  trigger,
  blobId,
  name,
  prompt,
  transactionHash,
  nftId,
}: ShareBottomSheetProps) => {
  const shareUrl = blobId ? `https://walrus.tusky.io/${blobId}` : "";
  const shareTitle = `Check out my NFT: ${name || ""}`;

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
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
                    url={shareUrl}
                    className="w-full h-full flex items-center justify-center"
                    title={shareTitle}
                  >
                    <FacebookIcon size={24} round />
                  </FacebookShareButton>
                </div>
                <div className="flex-1 min-w-24 p-4 bg-[#1f1f1f] rounded-2xl inline-flex flex-col justify-center items-center gap-2 overflow-hidden cursor-pointer hover:bg-[#2a2a2a] transition-colors">
                  <TwitterShareButton
                    url={shareUrl}
                    title={shareTitle}
                    className="w-full h-full flex items-center justify-center"
                  >
                    <XIcon size={24} round />
                  </TwitterShareButton>
                </div>
                <div className="flex-1 min-w-24 p-4 bg-[#1f1f1f] rounded-2xl inline-flex flex-col justify-center items-center gap-2 overflow-hidden cursor-pointer hover:bg-[#2a2a2a] transition-colors">
                  <TelegramShareButton
                    url={shareUrl}
                    title={shareTitle}
                    className="w-full h-full flex items-center justify-center"
                  >
                    <TelegramIcon size={24} round />
                  </TelegramShareButton>
                </div>

                <div className="flex-1 min-w-24 p-4 bg-[#1f1f1f] rounded-2xl inline-flex flex-col justify-center items-center gap-2 overflow-hidden cursor-pointer hover:bg-[#2a2a2a] transition-colors">
                  <RedditShareButton
                    url={shareUrl}
                    title={shareTitle}
                    className="w-full h-full flex items-center justify-center"
                  >
                    <RedditIcon size={24} round />
                  </RedditShareButton>
                </div>
              </div>
            </div>
            <div className="w-full flex flex-col justify-start items-start gap-2 overflow-hidden">
              {prompt && (
                <div
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `https://app.cr3dentials.xyz/creative?prompt=${JSON.stringify(
                        prompt
                      )}`
                    );
                    toast.success("Prompt copied to clipboard");
                  }}
                  className="self-stretch px-4 py-3 bg-[#1f1f1f] rounded-2xl inline-flex justify-start items-center gap-2 overflow-hidden cursor-pointer hover:bg-[#2a2a2a] transition-colors"
                >
                  <Copy className="w-6 h-6 text-white" />
                  <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
                    Copy Prompt
                  </div>
                </div>
              )}
              {blobId && (
                <div
                  className="self-stretch px-4 py-3 bg-[#1f1f1f] rounded-2xl inline-flex justify-start items-center gap-2 overflow-hidden cursor-pointer hover:bg-[#2a2a2a] transition-colors"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = shareUrl;
                    link.download = `${name || "nft"}.jpg`;
                    link.click();
                  }}
                >
                  <Download className="w-6 h-6 text-white" />
                  <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
                    Download Image
                  </div>
                </div>
              )}
              {(transactionHash || nftId) && (
                <div
                  className="w-full px-4 py-3 bg-[#1f1f1f] rounded-2xl inline-flex justify-start items-center gap-2 overflow-hidden cursor-pointer hover:bg-[#2a2a2a] transition-colors"
                  onClick={() => {
                    const explorerUrl = transactionHash
                      ? `https://suivision.xyz/txblock/${transactionHash}`
                      : `https://suivision.xyz/object/${nftId}`;
                    window.open(explorerUrl, "_blank");
                  }}
                >
                  <ExternalLink className="w-6 h-6 text-white" />
                  <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
                    View on Explorer
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
