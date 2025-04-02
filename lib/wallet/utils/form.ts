import { zxcvbn, zxcvbnOptions } from "@zxcvbn-ts/core";
import zxcvbnCommonPackage from "@zxcvbn-ts/language-common";
import zxcvbnEnPackage from "@zxcvbn-ts/language-en";
import { FormState } from "react-hook-form";
import { RegisterOptions } from "react-hook-form/dist/types/validator";
import { InputState } from "../components/Input";

export function getPasswordValidation(
  params: {
    previousPassword?: string;
  } = {}
): RegisterOptions {
  return {
    required: "Password should not be empty",
    validate: (val: string) => {
      const options = {
        translations: zxcvbnEnPackage.translations,
        graphs: zxcvbnCommonPackage.adjacencyGraphs,
        dictionary: {
          ...zxcvbnCommonPackage.dictionary,
          ...zxcvbnEnPackage.dictionary,
        },
      };
      zxcvbnOptions.setOptions(options);

      const strethDetectResult = zxcvbn(val);
      if (strethDetectResult.score < 3) {
        return strethDetectResult.feedback.warning.length > 0
          ? strethDetectResult.feedback.warning
          : "Password is too weak";
      }

      if (val.length !== 6) return "Password should be 6 digits";
      if (params?.previousPassword && val !== params.previousPassword) {
        return "passwords are not the same, please retry";
      }
      return true;
    },
  };
}

export function getConfirmPasswordValidation() {
  return {
    required: "Password should not be empty",
    validate: (val: string) => {
      return val.length !== 6 ? "Password should be 6 digits" : true;
    },
  };
}

export function getInputStateByFormState(
  formState: FormState<any>,
  field: string
): InputState {
  return formState.errors[field] ? "error" : "default";
}

export function getButtonDisabledState(formState: FormState<any>): boolean {
  // if isValid, then set disabled to false
  return !formState.isValid;
}
