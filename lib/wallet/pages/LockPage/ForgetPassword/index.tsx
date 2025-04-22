import { Button } from "@/components/ui/button";
import classNames from "classnames";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import Form from "../../../components/form/Form";
import FormControl from "../../../components/form/FormControl";
import Input from "../../../components/Input";
import Typo from "../../../components/Typo";
import { useApiClient } from "../../../hooks/useApiClient";
import SettingOneLayout from "../../../layouts/SettingOneLayout";
import { AppDispatch } from "../../../store";
import { resetAppContext } from "../../../store/app-context";
import { getInputStateByFormState } from "../../../utils/form";
import styles from "./index.module.scss";

export type ForgetPasswordProps = {
  titles?: string[];
  desc?: string;
};

type FormData = {
  reset: string;
};

const ForgetPassword = (props: ForgetPasswordProps) => {
  const RESET_KEYWORD = "RESET";
  const apiClient = useApiClient();
  const dispatch = useDispatch<AppDispatch>();
  const form = useForm<FormData>({
    mode: "onSubmit",
    defaultValues: {
      reset: "",
    },
  });
  const {
    titles = ["Forget", "Password"],
    desc = "You need to reset the Merge Wallet app.",
  } = props;

  return (
    <SettingOneLayout titles={titles} desc={desc}>
      <section className={"mt-6 w-full"}>
        <Form
          form={form}
          onSubmit={async () => {
            await apiClient.callFunc<null, undefined>(
              "root",
              "resetAppData",
              null
            );
            await dispatch(resetAppContext()).unwrap();
          }}
        >
          <div className="flex flex-col gap-2">
            <Typo.Normal className={styles["reset-title text-white"]}>
              Reset Merge Wallet
            </Typo.Normal>
            <Typo.Hints
              className={classNames("mt-[8px]", styles["reset-desc"])}
            >
              Merge Wallet will clear all the data and you need to re-import
              wallets. Input “RESET” to confirm and reset.
            </Typo.Hints>
            <FormControl
              name={"reset"}
              registerOptions={{
                required: "input should not be empty",
                validate: (val) =>
                  val !== RESET_KEYWORD
                    ? "Please enter RESET to confirm"
                    : true,
              }}
            >
              <Input
                state={getInputStateByFormState(form.formState, "reset")}
                className={"mt-4"}
                placeholder={"Please enter RESET to confirm"}
              />
            </FormControl>
          </div>

          <Button type={"submit"} className={"mt-6"}>
            Reset Merge Wallet
          </Button>
        </Form>
      </section>
    </SettingOneLayout>
  );
};

export default ForgetPassword;
