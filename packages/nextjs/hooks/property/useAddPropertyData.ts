import AddProperty from "@contracts/AddProperty.json";
import { wagmiConfig } from "@services/web3/wagmiConfig";
import { constants } from "@utils/constants";
import { getParsedError, notification } from "@utils/scaffold-eth";
import { getPublicClient } from "@wagmi/core";
import { Address, getContract } from "viem";

type HookFunc = (method: string, args?: unknown[] | undefined) => Promise<unknown | undefined>;

/**
 * Hook to get data
 */
export const useAddPropertyReadData = (address: Address): HookFunc => {
  return async (method: string, args?: unknown[] | undefined) => {
    try {
      const publicClient = getPublicClient(wagmiConfig);
      const contract = getContract({
        abi: AddProperty.abi,
        address: address || constants.contracts.addProperty.sepolia,
        client: publicClient,
      });

      switch (method) {
        case "property":
          // Returns the property proxy contract address
          return await contract.read.property();
        case "getPropertyOwners":
          return await contract.read.getPropertyOwners();
        case "getPropertyListings":
          return await contract.read.getPropertyListings();
        case "getUsers":
          return await contract.read.getUsers();
        case "propertyAddress":
          if (!args || args.length < 1) {
            notification.error(`useAddPropertyData -> read (${method}) -> Please provide the property ID.`);
            return null;
          }

          return await contract.read.propertyAddress(args);
        case "isPropertyAddressListed":
          if (!args || args.length < 1) {
            notification.error(`useAddPropertyData -> read (${method}) -> Please provide the property address.`);
            return null;
          }

          return await contract.read.isPropertyAddressListed(args);
        case "isUser":
          if (!args || args.length < 1) {
            notification.error(`useAddPropertyData -> read (${method}) -> Please provide the user address.`);
            return null;
          }

          return await contract.read.isUser(args);
        default:
          notification.error(`useAddPropertyData -> read (${method}) -> error -> invalid method`);
          return null;
      }
    } catch (error: any) {
      console.error(`useAddPropertyData (${address}) -> read (${method}) -> error`, error);
      const message = getParsedError(error);
      notification.error(message);
      throw error;
    }
  };
};
