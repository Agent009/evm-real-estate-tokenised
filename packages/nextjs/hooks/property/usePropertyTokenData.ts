import PropertyToken from "@contracts/PropertyToken.json";
import { wagmiConfig } from "@services/web3/wagmiConfig";
import { constants } from "@utils/constants";
import { getParsedError, notification } from "@utils/scaffold-eth";
import { getPublicClient } from "@wagmi/core";
import { Address, getContract } from "viem";

type HookFunc = (method: string, args?: unknown[] | undefined) => Promise<unknown | undefined>;

/**
 * Hook to get data
 */
export const usePropertyTokenTokenReadData = (address: Address): HookFunc => {
  return async (method: string, args?: unknown[] | undefined) => {
    try {
      const publicClient = getPublicClient(wagmiConfig);
      const contract = getContract({
        abi: PropertyToken.abi,
        address: address || constants.contracts.propertyToken.sepolia,
        client: publicClient,
      });

      switch (method) {
        case "DEFAULT_ADMIN_ROLE":
          return await contract.read.DEFAULT_ADMIN_ROLE();
        case "MINTER_ROLE":
          return await contract.read.MINTER_ROLE();
        case "name":
          return await contract.read.name();
        case "symbol":
          return await contract.read.symbol();
        case "decimals":
          return await contract.read.decimals();
        case "totalSupply":
          return await contract.read.totalSupply();
        case "hasRole":
          if (!args || args.length < 2) {
            notification.error(
              `usePropertyTokenData -> read (${method}) -> Please provide the role and account address.`,
            );
            return null;
          }

          return await contract.read.hasRole(args);
        case "balanceOf":
          if (!args || args.length < 1) {
            notification.error(`usePropertyTokenData -> read (${method}) -> Please provide the account address.`);
            return null;
          }

          return await contract.read.balanceOf(args);
        case "nonces":
          if (!args || args.length < 1) {
            notification.error(`usePropertyTokenData -> read (${method}) -> Please provide the account address.`);
            return null;
          }

          return await contract.read.nonces(args);
        case "allowance":
          if (!args || args.length < 2) {
            notification.error(
              `usePropertyTokenData -> read (${method}) -> Please provide the owner and spender address.`,
            );
            return null;
          }

          return await contract.read.allowance(args);
        default:
          notification.error(`usePropertyTokenData -> read (${method}) -> error -> invalid method`);
          return null;
      }
    } catch (error: any) {
      console.error(`usePropertyTokenData (${address}) -> read (${method}) -> error`, error);
      const message = getParsedError(error);
      notification.error(message);
      throw error;
    }
  };
};
