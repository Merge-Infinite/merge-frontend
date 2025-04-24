import { useLocalStorageState } from "ahooks";
import { default as classnames, default as classNames } from "classnames";
import { ReactNode } from "react";
import { useMatch, useNavigate, useResolvedPath } from "react-router-dom";
import IconHome from "../../../assets/icons/bag.svg";
import IconHistory from "../../../assets/icons/history.svg";
import IconNFT from "../../../assets/icons/nft.svg";
import IconSwap from "../../../assets/icons/swap.svg";
import { useFeatureFlagsWithNetwork } from "../../../hooks/useFeatureFlags";
import type { Extendable, StyleExtendable } from "../../../types";
import styles from "./index.module.scss";

export type MenuProps = StyleExtendable;
type MenuItemProps = StyleExtendable & {
  active?: boolean;
  icon: ReactNode;
  alt?: string;
  onClick?: () => void;
  to: string;
  redDot?: boolean;
  title: string;
};

const MenuItem = (props: MenuItemProps) => {
  const navigate = useNavigate();
  const resolved = useResolvedPath(props.to);
  const match = useMatch({ path: resolved.pathname, end: false });

  return (
    <div
      className={classnames(
        styles["menu-item"],
        "relative",
        {
          [styles["menu-item--active"]]: match,
        },
        "flex flex-col items-center justify-center"
      )}
      onClick={() => {
        navigate(props.to);
        props.onClick?.();
      }}
    >
      {props.redDot && (
        <div
          className={
            "rounded absolute bg-red-300 w-2 h-2 right-[5px] top-[5px]"
          }
        />
      )}
      <div
        style={{
          fill: match ? "hsl(var(--primary))" : "#fff",
        }}
      >
        {props.icon}
      </div>
      <div
        className={classnames(
          "text-center justify-start text-white leading-3",
          match && "text-primary-50"
        )}
        style={{
          fontSize: 10,
          color: match ? "hsl(var(--primary))" : "#fff",
        }}
      >
        {props.title || ""}
      </div>
    </div>
  );
};

const Menu: React.FC<MenuProps> = (props: Extendable) => {
  const featureFlags = useFeatureFlagsWithNetwork();
  const [clickedSwap, setClickedSwap] = useLocalStorageState("clicked-swap", {
    defaultValue: false,
  });
  return (
    <div
      className={classNames(
        "flex justify-between p-4 bg-neutral-950/60 rounded-3xl border border-[#333333] backdrop-blur-blur justify-start items-start gap-6 inline-flex overflow-hidden",
        props.className
      )}
      style={{
        position: "fixed",
        bottom: "10px",
        width: "70%",
      }}
    >
      <MenuItem to="/home" icon={<IconHome />} alt="home" title="Wallet" />
      {/* <MenuItem
        to="/dapps"
        icon={<IconExplore />}
        alt="explore"
        title="Explore"
      /> */}

      <MenuItem
        redDot={!clickedSwap}
        onClick={() => setClickedSwap(true)}
        to="/swap"
        icon={<IconSwap />}
        alt="swap"
        title="Swap"
      />

      <MenuItem
        to="/transaction/flow"
        icon={<IconHistory />}
        alt="history"
        title="History"
      />
      <MenuItem to="/wallet/nft" icon={<IconNFT />} alt="nft" title="NFT" />

      {/* <MenuItem
        to="/transaction/flow"
        icon={<IconHistory />}
        alt="transaction"
        title="Transaction"
      /> */}
    </div>
  );
};

export default Menu;
