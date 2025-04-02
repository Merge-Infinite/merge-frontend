import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { zodResolver } from "@hookform/resolvers/zod";
import classnames from "classnames";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import SettingOneLayout from "../../../../../layouts/SettingOneLayout";
import { Extendable } from "../../../../../types";
import styles from "./index.module.scss";

export type SetPasswordViewProps = Extendable & {
  type: "new" | "reset";
  onNext: (password: string, oldPassword?: string) => void;
};

const formSchema = z
  .object({
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

const resetFormSchema = z
  .object({
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
    oldPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type FormData = {
  password: string;
  confirmPassword: string;
  oldPassword?: string;
};

const SetPasswordView = (props: SetPasswordViewProps) => {
  const form = useForm<FormData>({
    resolver: zodResolver(
      props.type === "reset" ? resetFormSchema : formSchema
    ),
    defaultValues: {
      password: "",
      confirmPassword: "",
      oldPassword: "",
    },
  });

  useEffect(() => {
    return () => {
      form.reset();
    };
  }, []);

  const onSubmit = (data: FormData) => {
    console.log(data);
    props.onNext(data.password, data.oldPassword);
  };

  return (
    <SettingOneLayout titles={[]}>
      <section className={"w-full"}>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className={"flex flex-col gap-4 w-full"}
          >
            {props.type === "reset" && (
              <div className={styles["control-group"]}>
                <FormField
                  control={form.control}
                  name="oldPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Old Passcode</FormLabel>
                      <FormControl>
                        <InputOTP maxLength={6} {...field}>
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <div
              className={classnames(
                styles["control-group"],
                "flex flex-col gap-2"
              )}
            >
              <div className="justify-start text-white text-xl font-normal font-['Sora'] uppercase leading-7">
                Create passcode
              </div>
              <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
                Used to unlock your wallet.
              </div>
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passcode</FormLabel>
                    <FormControl>
                      <InputOTP maxLength={6} {...field}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div
              className={classnames(
                styles["control-group"],
                "flex flex-col gap-2"
              )}
            >
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Passcode</FormLabel>
                    <FormControl>
                      <InputOTP maxLength={6} {...field}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type={"submit"}>
              <div className="justify-start text-neutral-950 text-sm font-normal font-['Sora'] uppercase leading-normal">
                Continue
              </div>
            </Button>
          </form>
        </Form>
      </section>
    </SettingOneLayout>
  );
};

export default SetPasswordView;
