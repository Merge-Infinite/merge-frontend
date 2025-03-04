import React, { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { DialogContentProps, DialogProps } from "@radix-ui/react-dialog";
import styles from "./index.module.scss";
import IconClose from "../../../assets/icons/close.svg";
import classnames from "classnames";
import Image from "next/image";
export type ModalProps = DialogProps & {
  title: string | ReactNode;
  trigger: ReactNode;
  contentProps?: DialogContentProps;
};

const Modal = (props: ModalProps) => {
  const { children, trigger, title, contentProps, ...restProps } = props;

  return (
    <Dialog.Root {...restProps}>
      <Dialog.Trigger asChild={true}>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={styles["overlay"]}>
          <Dialog.Content
            {...contentProps}
            className={classnames(
              styles["content"],
              contentProps?.className,
              "flex flex-col justify-between h-full"
            )}
          >
            <div className={"flex justify-between items-center"}>
              <Dialog.Title className={styles["title"]}>{title}</Dialog.Title>
              <Dialog.Close>
                <IconClose alt="close" width={24} height={24} />
              </Dialog.Close>
            </div>
            {children}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Modal;
