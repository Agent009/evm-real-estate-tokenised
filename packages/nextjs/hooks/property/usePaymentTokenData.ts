import PaymentTokenMock from "@contracts/PaymentTokenMock.json";
import { wagmiConfig } from "@services/web3/wagmiConfig";
import { getParsedError, notification } from "@utils/scaffold-eth";
import { getPublicClient } from "@wagmi/core";
import { Address, getContract } from "viem";

type HookFunc = (method: string, args?: unknown[] | undefined) => Promise<unknown | undefined>;

/**
 * Hook to get data
 */
export const usePaymentTokenMockTokenReadData = (address: Address): HookFunc => {
  return async (method: string, args?: unknown[] | undefined) => {
    try {
      const publicClient = getPublicClient(wagmiConfig);
      const contract = getContract({
        abi: PaymentTokenMock.abi,
        address: address,
        client: publicClient,
      });

      switch (method) {
        case "name":
          return await contract.read.name();
        case "symbol":
          return await contract.read.symbol();
        case "decimals":
          return await contract.read.decimals();
        case "totalSupply":
          return await contract.read.totalSupply();
        case "balanceOf":
          if (!args || args.length < 1) {
            notification.error(`usePaymentTokenMockData -> read (${method}) -> Please provide the account address.`);
            return null;
          }

          return await contract.read.balanceOf(args);
        case "allowance":
          if (!args || args.length < 2) {
            notification.error(
              `usePaymentTokenMockData -> read (${method}) -> Please provide the owner and spender address.`,
            );
            return null;
          }

          return await contract.read.allowance(args);
        default:
          notification.error(`usePaymentTokenMockData -> read (${method}) -> error -> invalid method`);
          return null;
      }
    } catch (error: any) {
      console.error(`usePaymentTokenMockData (${address}) -> read (${method}) -> error`, error);
      const message = getParsedError(error);
      notification.error(message);
      throw error;
    }
  };
};
