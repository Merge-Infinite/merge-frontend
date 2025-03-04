"use client";

import { ToastContainer } from "react-toastify";
import "./styles/react-toastify.scss";

interface ToastProviderProps {
  children: React.ReactNode;
}

export default function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}
