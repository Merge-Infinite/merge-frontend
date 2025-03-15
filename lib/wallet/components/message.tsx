import { toast, ToastOptions } from "react-toastify";
import IconSuccess from "../assets/icons/msg-success.svg";
import IconError from "../assets/icons/msg-error.svg";
import IconInfo from "../assets/icons/msg-info.svg";
import Image from "next/image";
function createToast(content: string, options?: ToastOptions) {
  const commonOpts: ToastOptions = {
    position: "top-center",
    closeButton: false,
    hideProgressBar: true,
    autoClose: 2000,
  };

  return toast(content, {
    ...commonOpts,
    ...options,
  });
}

export const success = (content: string, options?: ToastOptions) => {
  return createToast(content, {
    icon: <IconSuccess alt="success" width={24} height={24} />,
    type: "success",
    ...options,
  });
};

export const error = (content: string, options?: ToastOptions) => {
  return createToast(content, {
    icon: <IconError alt="error" width={24} height={24} />,
    type: "error",
    ...options,
  });
};

export const info = (content: string, options?: ToastOptions) => {
  return createToast(content, {
    icon: <IconInfo alt="info" width={24} height={24} />,
    type: "info",
    ...options,
  });
};

export default {
  success,
  error,
  info,
};
