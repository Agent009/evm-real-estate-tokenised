import { ethers } from "hardhat";
import { isAddress, TransactionReceipt, formatEther } from "ethers";
import { constants } from "../lib/constants";

export const propertyContractAddress = constants.contracts.property.sepolia;
export const deployerAccount = new ethers.Wallet(constants.account.deployerPrivateKey);

export const formatBigInt = (val: number | bigint) => {
  return new Intl.NumberFormat("en-GB", { useGrouping: true }).format(Number(val));
};

export const checkParameters = (parameters: string[], count: number, tip?: string): void => {
  if (!parameters || parameters.length < count - 1) throw new Error(`Parameters not provided. ${tip}`);
};

export const checkAddress = (type: string, address?: string): void => {
  if (!address) {
    throw new Error(`${type} address not provided.`);
  }

  if (!isAddress(address)) {
    throw new Error(`Invalid ${type} address provided.`);
  }
};

export const checkNumber = (type: string, val?: string): void => {
  if (!val) {
    throw new Error(`${type} not provided.`);
  }

  if (isNaN(Number(val))) {
    throw new Error(`Invalid ${type} provided.`);
  }
};

export const getSignerFor = (account: string) => {
  return new ethers.Wallet(account);
};

export const gasPrices = (receipt: TransactionReceipt, msgPrefix?: string) => {
  const gasPrice = formatEther(receipt.gasPrice);
  const gasUsed = receipt.gasUsed.toString();
  const totalCost = formatEther(receipt.gasPrice * receipt.gasUsed);
  console.log(
    `${msgPrefix || "gasPrices"} -> gas -> price`,
    gasPrice,
    "used",
    gasUsed,
    "totalCost",
    totalCost,
    // receipt,
  );
  return {
    display: {
      gasPrice,
      gasUsed,
      totalCost,
    },
    totalCost: receipt.gasPrice * receipt.gasUsed,
  };
};
