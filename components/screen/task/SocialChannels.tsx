"use client";

import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import useApi from "@/hooks/useApi";
import { useUser } from "@/hooks/useUser";
import { useUtils } from "@telegram-apps/sdk-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { UsernameDialog } from "./UsernameDialog";

const SocialChannelItem = ({
  reward,
  title,
  status,
  isLoading,
  onClick,
}: {
  title: string;
  reward?: string;
  status?: string;
  isLoading?: boolean;
  onClick?: () => void;
}) => {
  return (
    <div
      className={`flex justify-between items-center py-2 px-1 w-full ${
        status === "verified" ? "opacity-50" : ""
      }`}
    >
      <div className="flex-1">
        <p className="text-sm font-normal text-white">{title}</p>
        <div className="flex items-center gap-2">
          <Image
            src="/images/energy.svg"
            alt="Social Channel"
            width={16}
            height={16}
          />
          <span className="text-sm text-white">{reward}</span>
        </div>
      </div>
      {status !== "verified" ? (
        <Button
          variant="default"
          size="sm"
          className={`bg-primary hover:bg-purple-600 rounded-full px-4 h-8 w-fit ${
            status === "pending" ? "bg-white" : ""
          }`}
          disabled={status === "verified"}
          isLoading={isLoading}
          onClick={onClick}
        >
          <span className="text-xs text-black font-normal uppercase ">
            {status === "verified"
              ? "Completed"
              : status === "pending"
              ? "Verify"
              : "Go"}
          </span>
        </Button>
      ) : (
        <Image
          src="/images/green-success.svg"
          alt="Social Channel"
          width={20}
          height={20}
        />
      )}
    </div>
  );
};

const MiTask = ({ type }: { type: string }) => {
  const [open, setOpen] = useState(false);
  const [task, setTask] = useState<any>(null);
  const [socialChannelsOpen, setSocialChannelsOpen] = useState(true);
  const utils = useUtils();
  const { refetch } = useUser();

  const taskList = useApi({
    key: ["taskList"],
    url: `/social-tasks/list?type=${type}`,
    method: "GET",
  }).get;

  const userTaskList = useApi({
    key: ["userTaskList"],
    url: `/social-tasks/user-tasks`,
    method: "GET",
  }).get;

  const startTask = useApi({
    key: ["startTask"],
    url: `/social-tasks/start-task`,
    method: "POST",
  }).post;

  const verifyTask = useApi({
    key: ["verifyTask"],
    url: `/social-tasks/verify`,
    method: "POST",
  }).post;

  useEffect(() => {
    taskList?.refetch();
    userTaskList?.refetch();
  }, []);

  const onVerifyTask = useCallback(
    async (taskId: number, userIdentifier: string) => {
      await verifyTask?.mutateAsync({
        socialTaskId: taskId,
        userIdentifier: userIdentifier,
      });
      await userTaskList?.refetch();
      await refetch();
    },
    [verifyTask, userTaskList, refetch]
  );

  const onStartTask = useCallback(
    async (task: any, link: string) => {
      const userTask = userTaskList?.data?.find(
        (userTask: any) => userTask.socialTaskId === task.id
      );
      if (!userTask) {
        await startTask?.mutateAsync({ socialTaskId: task.id });
        if (link?.includes("https://t.me/")) {
          utils.openTelegramLink(link);
        } else {
          utils.openLink(link);
        }
      } else if (userTask?.status === "PENDING") {
        if (task.platform !== "telegram") {
          setOpen(true);
        } else {
          await onVerifyTask(task.id, "");
        }
      }
      await userTaskList?.refetch();
    },
    [startTask, userTaskList, onVerifyTask]
  );

  const handleSubmit = async (username: string) => {
    try {
      setOpen(false);
      await onVerifyTask(task.id, username);
    } catch (error) {
      console.error("Failed to verify username:", error);
    } finally {
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 h-full] relative ">
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
            <h3 className="text-sm font-bold text-white">
              {type === "special" ? "MI Special Challenge" : "Social Channel"}
            </h3>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
              {!socialChannelsOpen ? (
                <Image
                  src="/images/add.svg"
                  alt="Social Channel"
                  width={20}
                  height={20}
                />
              ) : (
                <Image
                  src="/images/remove-black.svg"
                  alt="Social Channel"
                  width={20}
                  height={20}
                />
              )}
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="p-0">
            <div className="px-4 space-y-1">
              {taskList?.data?.map((task: any, index: number) => (
                <SocialChannelItem
                  key={index}
                  reward={task.reward}
                  title={task.description}
                  onClick={() => {
                    setTask(task);
                    onStartTask(task, task.url);
                  }}
                  isLoading={startTask?.isPending || verifyTask?.isPending}
                  status={userTaskList?.data
                    ?.find((userTask: any) => userTask.socialTaskId === task.id)
                    ?.status.toLowerCase()}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* <Collapsible
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
            <p className="text-sm text-muted-foreground">No contributors yet</p>
          </CardContent>
        </CollapsibleContent>
      </Collapsible> */}
      <UsernameDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
        task={task}
        answerType={task?.answerType}
      />
    </div>
  );
};

export default MiTask;
