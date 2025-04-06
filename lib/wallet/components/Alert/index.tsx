import classnames from "classnames";
import { Extendable } from "../../types";

export type AlertProps = Extendable & {
  type?: "default" | "warn" | "error";
  title?: string;
};

const Alert = (props: AlertProps) => {
  const { type = "default" } = props;
  const color = type === "warn" ? "orange" : type === "error" ? "red" : "blue";
  return (
    <div
      className={classnames(
        "rounded-lg p-[4px]",
        `bg-${color}-50`,
        props.className
      )}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          {type !== "default" && (
            <div
              className={classnames(
                `bg-${color}-600`,
                "px-[10px]",
                "py-[2px]",
                "text-white",
                "rounded-lg"
              )}
            >
              {type}
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <div
            className={classnames(`text-sm `, "break-all")}
            style={{
              color: "#e03232",
            }}
          >
            {props.children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alert;
