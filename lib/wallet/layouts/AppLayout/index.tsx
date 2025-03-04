import Header from "./Header";
import Menu from "./Menu";
import styles from "./index.module.scss";
import { useLocation } from "react-router-dom";
import classnames from "classnames";
import { Extendable } from "../../types";

export enum LayoutMode {
  DEFAULT = "default",
  WITHOUT_HEADER = "without-header",
  WITHOUT_MENU = "without-menu",
  EMPTY = "empty",
}
export type AppLayoutProps = Extendable & {
  layoutMode?: LayoutMode;
};

function AppLayout(props: AppLayoutProps) {
  const { layoutMode = LayoutMode.WITHOUT_HEADER } = props;
  const location = useLocation();
  const state = (location.state || {}) as Record<string, any>;

  return (
    <div
      className={classnames(
        styles[`main-page--${layoutMode}`],
        "flex flex-col items-center w-full justify-between h-full"
      )}
    >
      <Header className={styles["header"]} openSwitcher={state?.openSwitcher} />
      <main
        className={classnames(
          styles["main"],
          "no-scrollbar w-full",
          props.className
        )}
      >
        {props.children}
      </main>
      <Menu />
    </div>
  );
}

export default AppLayout;
