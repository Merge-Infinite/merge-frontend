import classnames from "classnames";
import { useMatch, useNavigate, useResolvedPath } from "react-router-dom";
import type { Extendable, StyleExtendable } from "../../../types";
import styles from "./index.module.scss";
import IconHome from "../../../assets/icons/bag.svg";
import IconNFT from "../../../assets/icons/nft.svg";
import IconHistory from "../../../assets/icons/history.svg";
import IconGrid from "../../../assets/icons/grid.svg";
import IconSwap from "../../../assets/icons/swap.svg";
import IconExplore from "../../../assets/icons/explore.svg";
import { ReactNode, useState } from "react";
import { useFeatureFlagsWithNetwork } from "../../../hooks/useFeatureFlags";
import { useLocalStorageState } from "ahooks";
import classNames from "classnames";

export type MenuProps = StyleExtendable;
type MenuItemProps = StyleExtendable & {
  active?: boolean;
  icon: ReactNode;
  alt?: string;
  onClick?: () => void;
  to: string;
  redDot?: boolean;
};

const MenuItem = (props: MenuItemProps) => {
  const navigate = useNavigate();
  const resolved = useResolvedPath(props.to);
  const match = useMatch({ path: resolved.pathname, end: false });

  return (
    <div
      className={classnames(styles["menu-item"], "relative", {
        [styles["menu-item--active"]]: match,
      })}
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
      <div className={styles["menu-icon"]}>{props.icon}</div>
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
      <MenuItem to="/wallet/home" icon={<IconHome />} alt="home" />
      {/* <MenuItem to="/dapps" icon={<IconExplore />} alt="explore" /> */}

      <MenuItem
        redDot={!clickedSwap}
        onClick={() => setClickedSwap(true)}
        to="/wallet/swap"
        icon={<IconSwap />}
        alt="swap"
      />

      <MenuItem
        to="/wallet/transaction/flow"
        icon={<IconHistory />}
        alt="history"
      />
      <MenuItem to="/wallet/nft" icon={<IconNFT />} alt="nft" />

      {/* <MenuItem
        to="/transaction/flow"
        icon={<IconHistory />}
        alt="transaction"
      /> */}
    </div>
  );
};

export default Menu;
