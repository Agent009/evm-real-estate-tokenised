import PropertyVault from "@contracts/PropertyVault.json";
import { wagmiConfig } from "@services/web3/wagmiConfig";
import { constants } from "@utils/constants";
import { getParsedError, notification } from "@utils/scaffold-eth";
import { getPublicClient } from "@wagmi/core";
import { Address, getContract } from "viem";

type HookFunc = (method: string, args?: unknown[] | undefined) => Promise<unknown | undefined>;

/**
 * Hook to get data
 */
export const usePropertyVaultVaultReadData = (address: Address): HookFunc => {
  return async (method: string, args?: unknown[] | undefined) => {
    try {
      const publicClient = getPublicClient(wagmiConfig);
      const contract = getContract({
        abi: PropertyVault.abi,
        address: address || constants.contracts.propertyVault.sepolia,
        client: publicClient,
      });

      switch (method) {
        case "property":
          return await contract.read.i_property();
        case "addProperty":
          return await contract.read.i_addProperty();
        case "propertyToken":
          return await contract.read.propertyToken();
        case "paymentToken":
          return await contract.read.paymentToken();
        case "isPropertyInVault":
          if (!args || args.length < 1) {
            notification.error(`usePropertyVaultData -> read (${method}) -> Please provide the property addresses.`);
            return null;
          }

          return await contract.read.isPropertyInVault(args);
        case "propertyValue":
          if (!args || args.length < 1) {
            notification.error(`usePropertyVaultData -> read (${method}) -> Please provide the token ID.`);
            return null;
          }

          return await contract.read.propertyValue(args);
        case "sharePrice":
          if (!args || args.length < 1) {
            notification.error(`usePropertyVaultData -> read (${method}) -> Please provide the token ID.`);
            return null;
          }

          return await contract.read.sharePrice(args);
        case "investors":
          if (!args || args.length < 2) {
            notification.error(
              `usePropertyVaultData -> read (${method}) -> Please provide the token ID and user address.`,
            );
            return null;
          }

          return await contract.read.investors(args);
        case "lastPurchaseTime":
          if (!args || args.length < 2) {
            notification.error(
              `usePropertyVaultData -> read (${method}) -> Please provide the token ID and user address.`,
            );
            return null;
          }

          return await contract.read.lastPurchaseTime(args);
        case "getInvestorShares":
          if (!args || args.length < 2) {
            notification.error(
              `usePropertyVaultData -> read (${method}) -> Please provide the token ID and user address.`,
            );
            return null;
          }

          return await contract.read.getInvestorShares(args);
        case "getAvailableShares":
          if (!args || args.length < 1) {
            notification.error(`usePropertyVaultData -> read (${method}) -> Please provide the token ID.`);
            return null;
          }

          return await contract.read.getAvailableShares(args);
        case "supportsInterface":
          if (!args || args.length < 1) {
            notification.error(`usePropertyVaultData -> read (${method}) -> Please provide the interface ID.`);
            return null;
          }

          return await contract.read.supportsInterface(args);
        default:
          notification.error(`usePropertyVaultData -> read (${method}) -> error -> invalid method`);
          return null;
      }
    } catch (error: any) {
      console.error(`usePropertyVaultData (${address}) -> read (${method}) -> error`, error);
      const message = getParsedError(error);
      notification.error(message);
      throw error;
    }
  };
};
