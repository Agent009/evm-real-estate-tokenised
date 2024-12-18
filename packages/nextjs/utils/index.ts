import { constants } from "./constants";
import { Chain, TransactionReceipt, createPublicClient, createWalletClient, formatEther, http } from "viem";
import { PrivateKeyAccount } from "viem/accounts";
import { hardhat, mainnet, sepolia } from "viem/chains";

export { formatUrl, getApiUrl, getUrl } from "./api";
export { constants } from "./constants";

export const propertyContractAddress = constants.contracts.property.sepolia as `0x${string}`;
export const propertyTokenContractAddress = constants.contracts.propertyToken.sepolia as `0x${string}`;
export const addPropertyContractAddress = constants.contracts.addProperty.sepolia as `0x${string}`;
export const propertyVaultContractAddress = constants.contracts.propertyVault.sepolia as `0x${string}`;

// noinspection JSUnusedGlobalSymbols
export const formatBigInt = (val: number | bigint) => {
  return new Intl.NumberFormat("en-GB", { useGrouping: true }).format(val);
};

// noinspection JSUnusedGlobalSymbols
export const checkParameters = (parameters: string[], count: number, tip?: string): void => {
  if (!parameters || parameters.length < count - 1) throw new Error(`Parameters not provided. ${tip}`);
};

// noinspection JSUnusedGlobalSymbols
export const checkAddress = (type: string, address?: string): void => {
  if (!address) {
    throw new Error(`${type} address not provided.`);
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error(`Invalid ${type} address provided.`);
  }
};

// noinspection JSUnusedGlobalSymbols
export const checkNumber = (type: string, val?: string): void => {
  if (!val) {
    throw new Error(`${type} not provided.`);
  }

  if (isNaN(Number(val))) {
    throw new Error(`Invalid ${type} provided.`);
  }
};

export const chainIdToChain = (chainId: number): Chain | null => {
  switch (chainId) {
    case 1:
      return mainnet;
    case 31_337:
      return hardhat;
    case 11_155_111:
      return sepolia;
    default:
      return null;
  }
};

export const getTransport = (chain?: Chain | undefined) => {
  return chain === sepolia ? http(constants.integrations.alchemy.sepolia) : http("http://127.0.0.1:8545/");
};

export const publicClientFor = async (chain?: Chain | undefined) =>
  createPublicClient({
    chain: chain === sepolia ? sepolia : hardhat,
    transport: getTransport(chain),
  });

export const walletClientFor = (account: PrivateKeyAccount, chain?: Chain | undefined) =>
  createWalletClient({
    account: account,
    chain: chain === undefined ? hardhat : chain,
    transport: getTransport(chain),
  });

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
