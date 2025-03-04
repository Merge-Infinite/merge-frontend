"use client";
import styles from "./index.module.scss";
import Typo from "../../components/Typo";
import classnames from "classnames";
import LogoGrey from "../../assets/icons/logo-grey.svg";
import Image from "next/image";
import { Extendable } from "../../types";

export type BrandLayoutProps = Extendable & {
  grayTitle?: string;
  blackTitle?: string;
  desc?: string;
};

const BrandLayout = (props: BrandLayoutProps) => {
  return (
    <div className={classnames(styles["main-page"], "bg-black")}>
      <div className={classnames(styles["content"], "flex flex-col gap-6")}>
        <div className={""}>
          <div className="mt-[32px]">
            {props.desc && (
              <Typo.Normal className={classnames("text-white")}>
                {props.desc}
              </Typo.Normal>
            )}
          </div>
        </div>

        {props.children}
      </div>
    </div>
  );
};

export default BrandLayout;
