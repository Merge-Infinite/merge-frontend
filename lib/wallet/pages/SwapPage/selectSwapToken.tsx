import React from "react";
import * as SelectCompoment from "@radix-ui/react-select";
import classnames from "classnames";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@radix-ui/react-icons";
import { Extendable } from "../../types";
import CloseIcon from "../../assets/icons/close.svg";
type SelectProps = Extendable & {
  value: string;
  defaultValue: string;
  onChange?: (value: string) => void;
  trigger?: React.ReactNode;
};

export function Select(props: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <SelectCompoment.Root
      defaultValue={props.defaultValue}
      value={props.value}
      onValueChange={props.onChange}
      onOpenChange={setIsOpen}
      open={isOpen}
    >
      <SelectCompoment.Trigger className="flex items-center" aria-label="Food">
        {/* <SelectCompoment.Value placeholder="Select a coin" /> */}
        <SelectCompoment.Icon className="flex gap-2 items-center outline-none">
          {props.trigger}
          <ChevronDownIcon />
        </SelectCompoment.Icon>
      </SelectCompoment.Trigger>
      <SelectCompoment.Portal
        className="fixed bottom-0 left-0 right-0   w-full py-0 backdrop-blur-md  bg-black bg-opacity-20  shadow-lg inset-0"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.8)",
        }}
      >
        <SelectCompoment.Content className="">
          <SelectCompoment.ScrollUpButton className="SelectScrollButton">
            <ChevronUpIcon />
          </SelectCompoment.ScrollUpButton>
          <SelectCompoment.Viewport
            style={{
              marginTop: "100px",
              backgroundColor: "rgba(0, 0, 0, 1)",
              padding: "16px",
            }}
          >
            <div className="w-full flex flex-col" style={{}}>
              <div className="flex justify-between">
                <h2
                  className="text-xl font-medium mx-auto my-[14px] text-white "
                  style={{}}
                >
                  Choose a coin to swap
                </h2>
                <div
                  className="bg-white rounded-full p-1"
                  style={{
                    borderRadius: "50%",
                  }}
                  onClick={() => {
                    setIsOpen(false);
                  }}
                >
                  <CloseIcon width={14} height={14} />
                </div>
              </div>
              <div className="w-full flex flex-col gap-4 px-4  mt-4">
                {props.children}
              </div>
            </div>
          </SelectCompoment.Viewport>
          <SelectCompoment.ScrollDownButton className="SelectScrollButton">
            <ChevronDownIcon />
          </SelectCompoment.ScrollDownButton>
        </SelectCompoment.Content>
      </SelectCompoment.Portal>
    </SelectCompoment.Root>
  );
}

type SelectItemProps = Extendable & {
  value: string;
};
export function SelectItem(props: SelectItemProps) {
  return (
    <SelectCompoment.Item
      className={classnames("SelectItem", props.className)}
      {...props}
    >
      <SelectCompoment.ItemText>{props.children}</SelectCompoment.ItemText>
    </SelectCompoment.Item>
  );
}
