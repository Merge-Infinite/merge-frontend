import React from "react";
import { UseFormReturn } from "react-hook-form/dist/types";
import { isValidDomainOrAddress } from "../../utils/address";
import { getInputStateByFormState } from "../../utils/form";
import FormControl from "../form/FormControl";
import Textarea from "../Textarea";

interface AddressInputProps {
  form: UseFormReturn<any>;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

function AddressInput({ form, className, onChange }: AddressInputProps) {
  return (
    <FormControl
      name={"address"}
      registerOptions={{
        required: "address should not be empty",
        validate: (val) => {
          return isValidDomainOrAddress(val) || "this is not a valid address";
        },
      }}
      className={className}
    >
      <Textarea
        placeholder="Enter SUI address or domain"
        onInput={onChange}
        style={{
          marginTop: "16px",
        }}
        state={getInputStateByFormState(form.formState, "address")}
      />
    </FormControl>
  );
}

export default AddressInput;
