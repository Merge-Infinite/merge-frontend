import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

import { DialogContentProps, DialogProps } from "@radix-ui/react-dialog";
import { ReactNode } from "react";
export type ModalProps = DialogProps & {
  title: string | ReactNode;
  trigger: ReactNode;
  contentProps?: DialogContentProps;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const Modal = (props: ModalProps) => {
  const {
    children,
    trigger,
    title,
    contentProps,
    defaultOpen,
    onOpenChange,
    ...restProps
  } = props;

  return (
    <Dialog open={defaultOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild={true}>{trigger}</DialogTrigger>

      <DialogContent className="bg-black top-[50%] flex flex-col items-center justify-start">
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
