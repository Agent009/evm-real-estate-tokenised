import { formatEther } from "viem";

type Props<T> = {
  label: string;
  value: T;
  label2?: string;
  size?: string;
  asETH?: boolean;
};

export const renderLabelAndValue = <T extends string | bigint | boolean>({
  label,
  label2,
  value,
  size = "1/3",
  asETH = true,
}: Props<T>) => {
  return (
    <label className={`form-control w-${size} p-2`}>
      <div className="label">
        <span className="label-text">{label}</span>
        <span className="label-text-alt">{label2}</span>
      </div>
      <code className="flex-1 block whitespace-pre overflow-none text-left bg-base-200 p-2 rounded-md">
        {typeof value === "bigint"
          ? asETH
            ? formatEther(value)
            : value.toString()
          : typeof value === "boolean"
            ? value
              ? "Yes"
              : "No"
            : value}
      </code>
    </label>
  );
};
