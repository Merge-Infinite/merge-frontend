"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApiClient } from "@/lib/wallet/hooks/useApiClient";
import { AppDispatch } from "@/lib/wallet/store";
import { updateAuthed } from "@/lib/wallet/store/app-context";
import { Loader2 } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";

/**
 * Enhanced PasscodeAuthDialog with built-in authentication logic
 *
 * This version is designed to prevent unwanted toggling when input changes
 */
export function PasscodeAuthDialog({
  open = false,
  setOpen,
  onSuccess,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess: () => Promise<void>;
}) {
  const stableId = useId(); // Generate a stable ID for this instance
  const apiClient = useApiClient();
  const dispatch = useDispatch<AppDispatch>();

  const [passcode, setPasscode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const isAuthenticating = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!passcode.trim() || passcode.length < 6) {
      setError("Please enter your complete 6-digit passcode");
      return;
    }

    // Prevent multiple submissions
    if (isAuthenticating.current) return;
    isAuthenticating.current = true;

    setIsLoading(true);
    setError("");

    try {
      // Call the validation function
      const result = await apiClient.callFunc<string, string>(
        "auth",
        "verifyPassword",
        passcode
      );

      if (!result) {
        setError("Password is incorrect, please try again");
        isAuthenticating.current = false;
        return;
      }

      // Update backend token
      await apiClient.callFunc<string, string>("auth", "login", passcode);

      // Effect Session Guard Component
      dispatch(updateAuthed(true));

      setOpen(false);

      // Reset authentication flag
      isAuthenticating.current = false;

      // Execute the pending function if exists (after dialog is closed)
      if (onSuccess) {
        try {
          await onSuccess();
        } catch (error) {
          console.error(
            "Error executing function after authentication:",
            error
          );
        }
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please try again.");
      isAuthenticating.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  const closeDialog = useCallback(() => {
    if (!isLoading && !isAuthenticating.current) {
      setOpen(false);
    }
  }, [isLoading, setOpen]);

  // Create a stable dialog component that doesn't re-render with every state change
  return (
    <Dialog
      key={`auth-dialog-${stableId}`}
      open={open}
      onOpenChange={(open) => {
        if (!open && !isLoading && !isAuthenticating.current) {
          closeDialog();
        }
      }}
    >
      <DialogContent
        className="p-4 bg-[#1A1A1A] rounded-lg border border-[#333333] w-[90%] max-w-md"
        onPointerDownOutside={(e) => {
          if (isLoading || isAuthenticating.current) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (isLoading || isAuthenticating.current) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-white text-lg font-medium font-['Sora']">
            Authentication Required
          </DialogTitle>
        </DialogHeader>

        <div className="flex-col justify-start items-start gap-3 flex w-full">
          <div className="w-full">
            <div className="text-white text-sm font-normal font-['Sora'] leading-normal mb-1">
              Enter Your Wallet Passcode:
            </div>
            <div className="w-full flex justify-center items-center">
              <div className="inline-block">
                <InputOTP
                  value={passcode}
                  onChange={(value) => setPasscode(value)}
                  maxLength={6}
                  disabled={isLoading}
                >
                  <InputOTPGroup className="gap-2">
                    <InputOTPSlot index={0} className="w-12 h-12 text-xl" />
                    <InputOTPSlot index={1} className="w-12 h-12 text-xl" />
                    <InputOTPSlot index={2} className="w-12 h-12 text-xl" />
                    <InputOTPSlot index={3} className="w-12 h-12 text-xl" />
                    <InputOTPSlot index={4} className="w-12 h-12 text-xl" />
                    <InputOTPSlot index={5} className="w-12 h-12 text-xl" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
            {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
          </div>
        </div>

        <DialogFooter className="w-full mt-4">
          <Button
            onClick={handleSubmit}
            disabled={isLoading || passcode.length < 6}
            className="w-full bg-gradient-to-r from-[#9747FF] to-[#7F45E2] hover:from-[#9747FF] hover:to-[#8a4dd4]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              "Authenticate"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
