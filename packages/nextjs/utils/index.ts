import { TransactionReceipt, formatEther } from "viem";

export { formatUrl, getApiUrl, getUrl } from "./api";
export { constants } from "./constants";

/**
 * Convert displayed token amount to stored amount in WEI.
 * @param amount
 * @param tokenRatio
 * @param tokenValue
 */
export const tokenAmountInWEI = (amount: string | number | bigint, tokenRatio: bigint, tokenValue: bigint) => {
  return (BigInt(amount || 1n) * tokenValue) / tokenRatio;
};

/**
 * Convert stored amount in WEI to displayed token amount.
 * @param amount
 * @param tokenRatio
 * @param tokenValue
 */
export const weiToTokenAmount = (amount: bigint, tokenRatio: bigint, tokenValue: bigint) => {
  return (BigInt(amount || 1n) * tokenRatio) / tokenValue;
};

/**
 * Convert stored amount in WEI to displayed token amount.
 * @param amount
 * @param tokenRatio
 * @param tokenValue
 */
export const weiToFractionalTokenAmount = (amount: bigint, tokenRatio: bigint, tokenValue: bigint) => {
  return (Number(amount || 1) * Number(tokenRatio)) / Number(tokenValue);
};

/**
 * Use underscore as thousands separator. 1000 -> 1_000, 1000000 -> 1_000_000
 * @param amount
 */
export const formatNumber = (amount: string | number | bigint) => {
  return String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, "_");
};

export const gasPrices = (receipt: TransactionReceipt, msgPrefix?: string) => {
  const gasPrice = receipt.effectiveGasPrice ? formatEther(receipt.effectiveGasPrice) : "N/A";
  const gasUsed = receipt.gasUsed ? receipt.gasUsed.toString() : "N/A";
  const totalCost = receipt.effectiveGasPrice ? formatEther(receipt.effectiveGasPrice * receipt.gasUsed) : "N/A";
  console.log(`${msgPrefix} -> gas -> price`, gasPrice, "used", gasUsed, "totalCost", totalCost);
  return {
    display: {
      gasPrice,
      gasUsed,
      totalCost,
    },
    totalCost: receipt.effectiveGasPrice ? receipt.effectiveGasPrice * receipt.gasUsed : 0n,
  };
};
