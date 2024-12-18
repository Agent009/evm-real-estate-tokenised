import Property from "@contracts/Property.json";
import { wagmiConfig } from "@services/web3/wagmiConfig";
import { constants } from "@utils/constants";
import { getParsedError, notification } from "@utils/scaffold-eth";
import { getPublicClient } from "@wagmi/core";
import { Address, getContract } from "viem";

type HookFunc = (method: string, args?: unknown[] | undefined) => Promise<unknown | undefined>;

/**
 * Hook to get data
 */
export const usePropertyReadData = (address: Address): HookFunc => {
  return async (method: string, args?: unknown[] | undefined) => {
    try {
      const publicClient = getPublicClient(wagmiConfig);
      const contract = getContract({
        abi: Property.abi,
        address: address || constants.contracts.property.sepolia,
        client: publicClient,
      });

      switch (method) {
        case "URI_SETTER_ROLE":
          return await contract.read.URI_SETTER_ROLE();
        case "MINTER_ROLE":
          return await contract.read.MINTER_ROLE();
        case "hasRole":
          if (!args || args.length < 2) {
            notification.error(`usePropertyData -> read (${method}) -> Please provide role and account addresses.`);
            return null;
          }

          return await contract.read.hasRole(args);
        case "balanceOf":
          if (!args || args.length < 2) {
            notification.error(`usePropertyData -> read (${method}) -> Please provide account address and token ID.`);
            return null;
          }

          return await contract.read.balanceOf(args);
        case "uri":
          if (!args || args.length < 1) {
            notification.error(`usePropertyData -> read (${method}) -> Please provide the property token ID.`);
            return null;
          }

          return await contract.read.uri(args);
        default:
          notification.error(`usePropertyData -> read (${method}) -> error -> invalid method`);
          return null;
      }
    } catch (error: any) {
      console.error(`usePropertyData (${address}) -> read (${method}) -> error`, error);
      const message = getParsedError(error);
      notification.error(message);
      throw error;
    }
  };
};
