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
import classNames from "classnames";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Nav from "../../components/Nav";
import Typo from "../../components/Typo";
import { useApiClient } from "../../hooks/useApiClient";
import { AppDispatch } from "../../store";
import { updateAuthed } from "../../store/app-context";
import ForgetPassword from "./ForgetPassword";
import styles from "./index.module.scss";

type FormData = {
  password: string;
};

const LockPage = () => {
  const apiClient = useApiClient();
  const form = useForm({
    mode: "onSubmit",
    defaultValues: {
      password: "",
    },
  });
  const [step, setStep] = useState(1);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  async function handleSubmit(data: FormData) {
    const result = await apiClient.callFunc<string, string>(
      "auth",
      "verifyPassword",
      data.password
    );
    if (!result) {
      form.setError("password", {
        type: "custom",
        message: "Password is incorrect, please try again",
      });
      return;
    }
    // update backend token
    await apiClient.callFunc<string, string>("auth", "login", data.password);
    // effect Session Guard Component
    dispatch(updateAuthed(true));
  }

  if (step === 2) {
    return (
      <div className={classNames(styles["page"], "no-scrollbar")}>
        <Nav
          title={"Forget Password"}
          onNavBack={() => {
            setStep(1);
          }}
        />
        <ForgetPassword />
      </div>
    );
  }
  return (
    <div className={" flex-1 flex flex-col gap-4  items-center w-full"}>
      <section className={" w-full"}>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-4 items-center w-full"
          >
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel> Passcode</FormLabel>
                  <FormControl className="w-full">
                    <InputOTP maxLength={6} {...field} className="w-full">
                      <InputOTPGroup className="justify-between">
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

            <Button type={"submit"} state={"primary"} className={"mt-[24px]"}>
              Unlock
            </Button>
          </form>
        </Form>
      </section>
      <Typo.Normal
        className={"mt-auto cursor-pointer"}
        onClick={() => {
          setStep(2);
        }}
      >
        Forget Password?
      </Typo.Normal>
    </div>
  );
};

export default LockPage;
