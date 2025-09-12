"use client";
import { useUniversalApp } from "@/app/context/UniversalAppContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useUser } from "@/hooks/useUser";
import { Copy, Download, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const shareUrl = blobId
    ? blobId.includes("https")
      ? blobId
      : `https://wal.gg/${blobId}`
    : "";
  const shareTitle = `Check out my NFT: ${name || ""}`;
  const { user } = useUser();
  const { isTelegram } = useUniversalApp();

  const onCopy = async () => {
    try {
      if (isTelegram) {
        navigator.clipboard.writeText(
          `${process.env.NEXT_PUBLIC_TELEGRAM_APP}?startapp=${user?.referralCode}`
        );
      } else {
        navigator.clipboard.writeText(
          `${process.env.NEXT_PUBLIC_APP_URL}?referralCode=${user?.referralCode}`
        );
      }
      toast("Copied to clipboard");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="bottom"
        className="w-full pb-8 bg-[#141414] rounded-tl-3xl rounded-tr-3xl mx-auto"
      >
        <div className="inline-flex flex-col justify-start items-center gap-3 w-full">
          <div className="self-stretch h-11 px-4 pt-4 inline-flex justify-between items-center">
            <div className="justify-start text-white text-sm font-semibold font-['Sora'] uppercase leading-normal tracking-wide"></div>
          </div>
          <div className="self-stretch px-4 pb-2 inline-flex flex-col justify-start items-start gap-6">
            <div className="size- flex flex-col justify-start items-start gap-1">
              <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
                Share via:
              </div>
              <div className="w-full inline-flex justify-start items-start gap-2 flex-wrap content-start overflow-hidden">
                <div
                  className="flex-1 min-w-24 px-4 py-3 bg-[#1f1f1f] rounded-2xl inline-flex flex-col justify-center items-center gap-2 overflow-hidden cursor-pointer hover:bg-[#2a2a2a] transition-colors"
                  onClick={onCopy}
                >
                  <Copy className="size-6 text-white" />
                  <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
                    Copy link
                  </div>
                </div>
                <div className="flex-1 min-w-24 px-4 py-3 bg-[#1f1f1f] rounded-2xl inline-flex flex-col justify-center items-center gap-2 overflow-hidden cursor-pointer hover:bg-[#2a2a2a] transition-colors">
                  <TwitterShareButton
                    url={shareUrl}
                    title={shareTitle}
                    className="w-full h-full flex flex-col items-center justify-center gap-2"
                  >
                    <XIcon size={24} round />
                    <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
                      X
                    </div>
                  </TwitterShareButton>
                </div>
                <div className="flex-1 min-w-24 px-4 py-3 bg-[#1f1f1f] rounded-2xl inline-flex flex-col justify-center items-center gap-2 overflow-hidden cursor-pointer hover:bg-[#2a2a2a] transition-colors">
                  <TelegramShareButton
                    url={shareUrl}
                    title={shareTitle}
                    className="w-full h-full flex flex-col items-center justify-center gap-2"
                  >
                    <TelegramIcon size={24} round />
                    <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
                      Telegram
                    </div>
                  </TelegramShareButton>
                </div>
                <div className="flex-1 min-w-24 px-4 py-3 bg-[#1f1f1f] rounded-2xl inline-flex flex-col justify-center items-center gap-2 overflow-hidden cursor-pointer hover:bg-[#2a2a2a] transition-colors">
                  <FacebookShareButton
                    url={shareUrl}
                    className="w-full h-full flex flex-col items-center justify-center gap-2"
                    title={shareTitle}
                  >
                    <FacebookIcon size={24} round />
                    <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
                      Facebook
                    </div>
                  </FacebookShareButton>
                </div>
                {/* <div className="flex-1 min-w-24 px-4 py-3 bg-[#1f1f1f] rounded-2xl inline-flex flex-col justify-center items-center gap-2 overflow-hidden cursor-pointer hover:bg-[#2a2a2a] transition-colors">
                  <FacebookMessengerShareButton
                    appId={process.env.NEXT_PUBLIC_FACEBOOK_APP_ID}
                    url={shareUrl}
                    title={shareTitle}
                    className="w-full h-full flex flex-col items-center justify-center gap-2"
                  >
                    <FacebookMessengerIcon size={24} round />
                    <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">Messenger</div>
                  </FacebookMessengerShareButton>
                </div> */}
                <div className="flex-1 min-w-24 px-4 py-3 bg-[#1f1f1f] rounded-2xl inline-flex flex-col justify-center items-center gap-2 overflow-hidden cursor-pointer hover:bg-[#2a2a2a] transition-colors">
                  <RedditShareButton
                    url={shareUrl}
                    title={shareTitle}
                    className="w-full h-full flex flex-col items-center justify-center gap-2"
                  >
                    <RedditIcon size={24} round />
                    <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
                      Reddit
                    </div>
                  </RedditShareButton>
                </div>
              </div>
            </div>
            <div className="w-full flex flex-col justify-start items-start gap-2 overflow-hidden">
              {prompt && (
                <div
                  onClick={() => {
                    router.push(`/creative?prompt=${JSON.stringify(prompt)}`);
                  }}
                  className="self-stretch px-4 py-3 bg-[#1f1f1f] rounded-2xl inline-flex justify-start items-center gap-2 overflow-hidden cursor-pointer hover:bg-[#2a2a2a] transition-colors"
                >
                  <div className="size-6 relative overflow-hidden">
                    <Copy className="size-5 absolute left-[2px] top-[2px] text-white" />
                    <div className="size-2 left-[13px] top-[2.27px] absolute bg-white" />
                  </div>
                  <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
                    Use Promt
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
                  <div className="size-6 relative overflow-hidden">
                    <Download className="size-5 absolute left-[2px] top-[2px] text-white" />
                  </div>
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
                  <div className="size-6 relative overflow-hidden">
                    <ExternalLink className="size-5 absolute left-[2px] top-[2px] text-white" />
                  </div>
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
