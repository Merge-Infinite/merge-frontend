"use client";

import { useUser } from "@/hooks/useUser";
import { AppDispatch, RootState } from "@/lib/wallet/store";
import {
  TabMode,
  updateAuthed,
  updateInitialized,
  updateTabMode,
} from "@/lib/wallet/store/app-context";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
interface GamePlayInfoProps {
  explore?: number;
  reward?: number;
  mask?: number;
  dep?: number;
  freq?: number;
}

export default function UserInfo({}: GamePlayInfoProps) {
  const router = useRouter();
  const { user } = useUser();
  const userStore = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch<AppDispatch>();
  const clearData = async () => {
    // Clear localStorage

    // Clear IndexedDB
    const databases = await indexedDB.databases();
    for (const db of databases) {
      console.log("db", db);
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
        localStorage.clear();
        dispatch(updateInitialized(false));
        dispatch(updateAuthed(false));
        window.location.reload();
      }
    }
    toast.success("Data cleared");
  };

  return (
    <div className="w-full px-4 py-2 bg-neutral-950/60 rounded-2xl border border-[#1f1f1f] flex-col justify-start items-start gap-2 inline-flex">
      <div className="self-stretch justify-center items-center gap-2 inline-flex">
        <div className="grow shrink basis-0 text-white text-base font-bold font-['Sora'] leading-normal capitalize">
          Hi {user?.username}!!!
        </div>
        {/* <Button
          className="w-fit px-2 py-1 rounded-full"
          size="sm"
          onClick={clearData}
        >
          Clear data
        </Button> */}
      </div>
      <div className="self-stretch justify-start items-center gap-6 inline-flex">
        <div
          className="justify-start items-center gap-1 flex"
          onClick={() => {
            dispatch(updateTabMode(TabMode.SHOP));
          }}
        >
          <Image src="/images/energy.svg" alt="energy" width={24} height={24} />
          <div className="text-center text-white text-sm font-normal font-['Sora'] leading-normal">
            {userStore?.profile?.userBalance?.energyBalance.toLocaleString() ||
              0}
          </div>
          <Image src="/images/plus.svg" alt="energy" width={24} height={24} />
        </div>
        <div className="justify-start items-start gap-1 flex">
          <Image src="/images/m3r8.svg" alt="mask" width={24} height={24} />
          <div className="text-center text-white text-sm font-normal font-['Sora'] leading-normal">
            {userStore?.profile?.m3rBalance?.balance.toLocaleString() || 0}
          </div>
        </div>
        <div
          className="justify-start items-start gap-1 flex"
          onClick={() => router.push("/friends")}
        >
          <Image src="/images/friend.svg" alt="mask" width={24} height={24} />
          <div className="text-center text-[#68ffd1] text-sm font-normal font-['Sora'] underline uppercase leading-normal">
            {userStore?.profile?.friendCount || 0}
          </div>
        </div>
      </div>
    </div>
  );
}
