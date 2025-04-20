"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUtils } from "@telegram-apps/sdk-react";
import Image from "next/image";
import { useMemo, useState } from "react";

interface UsernameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (username: string) => void;
  task: any;
}

export function UsernameDialog({
  open,
  onOpenChange,
  onSubmit,
  task,
}: UsernameDialogProps) {
  const [username, setUsername] = useState("");
  const utils = useUtils();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onSubmit(username);
    }
  };

  const logo = useMemo(() => {
    switch (task.platform) {
      case "telegram":
        return "/images/telegram.svg";
      case "reddit":
        return "/images/reddit.svg";
      case "discord":
        return "/images/discord.svg";
      default:
        return "/images/m3r8_symbol.svg";
    }
  }, [task.platform]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full h-1/3 p-0 bg-[#121212] border-[#1f1f1f] text-white fixed bottom-0 top-auto rounded-t-xl rounded-b-none max-w-full"
        style={{
          height: 300,
        }}
      >
        <form
          onSubmit={handleSubmit}
          className="flex flex-col h-full justify-between py-4"
        >
          <DialogHeader className="pb-4 border-b border-[#333333]">
            <div
              className="flex justify-between items-center"
              style={{
                marginLeft: 16,
              }}
            >
              <div className="flex items-center gap-2">
                <Image
                  src={logo}
                  alt="Telegram Logo"
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
                <span className="text-white font-normal">
                  {task.description}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-[#a668ff] rounded-3xl h-6 px-4"
                  onClick={() => {
                    if (task.url.includes("https://t.me/")) {
                      utils.openTelegramLink(task.url);
                    } else {
                      utils.openLink(task.url);
                    }
                  }}
                >
                  <span className="text-neutral-950 text-xs font-bold underline">
                    GO
                  </span>
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="px-4 flex-1 h-full">
            <div className="flex flex-col gap-2 mt-4">
              <label className="text-white text-sm font-normal">
                Verification
              </label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-[#141414] border-[#333333] rounded-3xl h-10 text-[#5c5c5c]"
                placeholder="Type Your Username..."
                autoComplete="off"
              />
              <span className="text-white text-sm font-normal">
                Verify to claim your reward
              </span>
            </div>
          </div>

          <DialogFooter className="px-4 pb-10 mt-auto">
            <Button
              type="submit"
              disabled={!username.trim()}
              variant="outline"
              className="w-full bg-white text-black rounded-3xl"
            >
              <span className="uppercase text-sm font-normal">Verify</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
