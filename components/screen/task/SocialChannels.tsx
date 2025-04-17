"use client";

import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const SocialChannelItem = ({
  title,
  points = "+50",
}: {
  title: string;
  points?: string;
}) => {
  return (
    <div className="flex justify-between items-center py-2 px-1 w-full">
      <div className="flex-1">
        <p className="text-sm font-normal text-white">{title}</p>
        <div className="flex items-center gap-2">
          <Image
            src="/images/energy.svg"
            alt="Social Channel"
            width={16}
            height={16}
          />
          <span className="text-sm text-white">{points}</span>
        </div>
      </div>
      <Button
        variant="default"
        size="sm"
        className="bg-primary hover:bg-purple-600 rounded-full px-4 h-8 w-fit"
      >
        <span className="text-xs text-black font-normal uppercase underline">
          GO
        </span>
      </Button>
    </div>
  );
};

const MiTask = ({ tasks }: { tasks: string[] }) => {
  const [socialChannelsOpen, setSocialChannelsOpen] = useState(true);
  const [contributorsOpen, setContributorsOpen] = useState(false);

  return (
    <div className="w-full flex flex-col gap-4">
      <Collapsible
        open={socialChannelsOpen}
        onOpenChange={setSocialChannelsOpen}
        className="rounded-3xl border border-[#1f1f1f]"
      >
        <CardHeader className="px-4 py-3 flex flex-row justify-between items-center">
          <div className="flex items-center gap-2">
            <Image
              src="/images/m3r8_symbol.svg"
              alt="Social Channel"
              width={24}
              height={24}
            />
            <h3 className="text-sm font-bold text-white">Social Channel</h3>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
              {socialChannelsOpen ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="p-0">
            <div className="px-4 space-y-1">
              {tasks.map((task, index) => (
                <SocialChannelItem key={index} title={task} />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible
        open={contributorsOpen}
        onOpenChange={setContributorsOpen}
        className="rounded-3xl border border-[#1f1f1f]"
      >
        <CardHeader className="px-4 py-3 flex flex-row justify-between items-center">
          <div className="flex items-center gap-2">
            <Image
              src="/images/m3r8_symbol.svg"
              alt="Social Channel"
              width={24}
              height={24}
            />
            <h3 className="text-sm font-bold text-white">MI Contributors</h3>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
              {contributorsOpen ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="px-4 py-2">
            {/* Contributors content would go here */}
            <p className="text-sm text-muted-foreground">No contributors yet</p>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default MiTask;
