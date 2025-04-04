import classnames from "classnames";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Nav from "../../components/Nav";
import { useAccount } from "../../hooks/useAccount";
import { useAuth } from "../../hooks/useAuth";
import { useWallet } from "../../hooks/useWallet";
import { RootState } from "../../store";
import { Extendable } from "../../types";
type SettingItemProps = Extendable & {
  title: string;
  icon: React.ReactNode;
  hideArrow?: boolean;
  externalLink?: boolean;
  onClick?: () => void;
};

type SettingGroupProps = Extendable & {
  onClick?: () => void;
};

const SettingItem = (props: SettingItemProps) => {
  return (
    <div
      onClick={props.onClick}
      className={
        "w-full p-4 bg-neutral-950/60 rounded-2xl outline outline-1 outline-offset-[-1px] outline-[#1f1f1f] inline-flex justify-between items-center"
      }
    >
      <div className="flex justify-start items-center gap-2">
        {props.icon}
        <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
          {props.title}
        </div>
      </div>
      <ArrowRight />
    </div>
  );
};

const SettingsGroup = (props: SettingGroupProps) => {
  return <div className={classnames(props.className)}>{props.children}</div>;
};

const SettingPage = () => {
  const navigate = useNavigate();
  const { context } = useSelector((state: RootState) => ({
    context: state.appContext,
  }));
  const { data: wallet } = useWallet(context.walletId);
  const { address } = useAccount(context.accountId);
  const { logout } = useAuth();

  return (
    <div className={"w-full h-full overflow-y-auto bg-black no-scrollbar"}>
      <Nav
        position={"sticky"}
        onNavBack={() => {
          navigate("/");
        }}
        title="Settings"
        className={"bg-black"}
      />
      <div className={""}>
        {/* <div className={"flex flex-col items-center"}>
          <Avatar size={"lg"} model={wallet?.avatar} pfp={wallet?.avatarPfp} />
          <div
            className={classnames(
              styles["wallet-name"],
              "mt-[8px]",
              "text-white"
            )}
            style={{
              color: "#fff",
            }}
          >
            {wallet?.name}
          </div>
          <Address value={address} className={styles["address"]} />
        </div> */}

        <section className="mt-4">
          <SettingsGroup className="w-full gap-2 flex flex-col">
            {/* <SettingItem
              title="Wallet"
              icon={
                <Image
                  src={"/images/bag.svg"}
                  alt="Wallet"
                  width={20}
                  height={20}
                />
              }
              onClick={() => {
                navigate("/settings/wallet");
              }}
            /> */}

            <SettingItem
              title="Security"
              icon={
                <Image
                  src={"/images/security.svg"}
                  alt="Security"
                  width={20}
                  height={20}
                />
              }
              onClick={() => {
                navigate("security");
              }}
            />
            <SettingItem
              title="Lock"
              icon={
                <Image
                  src={"/images/lock.svg"}
                  alt="Lock"
                  width={20}
                  height={20}
                />
              }
              onClick={() => {
                logout();
              }}
              hideArrow={true}
            >
              Lock wallet
            </SettingItem>
          </SettingsGroup>
        </section>
      </div>
    </div>
  );
};

export default SettingPage;
