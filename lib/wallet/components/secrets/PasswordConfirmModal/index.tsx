import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import IconError from "../../../assets/icons/error.svg";
import IconKey from "../../../assets/icons/key.svg";
import IconQuestionError from "../../../assets/icons/question-error.svg";
import IconShareError from "../../../assets/icons/share-error.svg";
import { useApiClient } from "../../../hooks/useApiClient";
import { Extendable } from "../../../types";
import { getInputStateByFormState } from "../../../utils/form";
import Form from "../../form/Form";
import FormControl from "../../form/FormControl";
import Input from "../../Input";
import { Modal } from "../../modals";
import Typo from "../../Typo";
import styles from "./index.module.scss";
export type PasswordConfirmModalProps = Extendable & {
  trigger: React.ReactNode;
  actionDesc: string;
  title?: string;
  onOpenChange?: () => void;
  onConfirm: () => void;
};

export type WarningDescriptionProps = Extendable & {
  icon: React.ReactNode;
  title: string;
  description: string;
};

type FormData = {
  password: string;
};

const WarningDescription = (props: WarningDescriptionProps) => {
  return (
    <div className={styles["warning-description"]}>
      <div className="flex gap-2 items-center">
        <div className={styles["warning-description__icon"]}>{props.icon}</div>
        <div
          className={styles["warning-description__title"]}
          style={{ color: "#fff" }}
        >
          {props.title}
        </div>
      </div>
      <div className={styles["warning-description__desc"]}>
        {props.description}
      </div>
    </div>
  );
};

const PasswordConfirmModal = (props: PasswordConfirmModalProps) => {
  const { title = "Warning" } = props;
  const apiClient = useApiClient();

  const form = useForm({
    mode: "onSubmit",
    defaultValues: {
      password: "",
    },
  });
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
    props.onConfirm();
    form.reset();
  }

  return (
    <Modal
      title={"Warning"}
      trigger={props.trigger}
      onOpenChange={props.onOpenChange}
    >
      <div className="flex flex-col items-center gap-[8px]">
        <IconError />
        <Typo.Title className={styles["title"]} style={{ color: "#FF4500" }}>
          Warning
        </Typo.Title>
      </div>
      <div className="mt-[24px] mb-60px">
        <WarningDescription
          icon={<IconKey />}
          title={"Full control of your wallet"}
          description={
            "Anyone with the private key or recovery phrases can have full control of your wallet funds and assets."
          }
        />
        <WarningDescription
          icon={<IconShareError />}
          title={"Never share with anyone"}
          description={
            "You should not share your private key or  recovery phrases with anyone, or type in any applications."
          }
        />
        <WarningDescription
          icon={<IconQuestionError />}
          title={"Suiet will never ask for it"}
          description={
            "Suiet will never ask for your private key or recovery phrases."
          }
        />
      </div>

      <div
      // className={classnames(
      //   styles["password-confirm"],
      //   "fixed",
      //   "bottom-0",
      //   "left-0",
      //   "w-screen"
      // )}
      >
        <Form
          form={form}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <FormControl name={"password"}>
            <Input
              state={getInputStateByFormState(form.formState, "password")}
              type={"password"}
              placeholder={"Please enter password"}
              onKeyDownCapture={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit(form.getValues());
                  console.log("onKeyDown", e.key);
                }
              }}
            />
          </FormControl>

          <div className={"flex items-center mt-[16px] gap-2"}>
            <Button type={"button"} className="w-full">
              Cancel
            </Button>

            <Button type={"submit"} className="w-full" variant={"error"}>
              Confirm
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default PasswordConfirmModal;
