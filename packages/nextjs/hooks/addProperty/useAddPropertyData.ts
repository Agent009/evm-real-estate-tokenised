import AddProperty from "@contracts/AddProperty.json";
// import { gasPrices } from "@hooks/property/usePropertyData";
import { wagmiConfig } from "@services/web3/wagmiConfig";
import { constants } from "@utils/constants";
import { getParsedError, notification } from "@utils/scaffold-eth";
import { getPublicClient } from "@wagmi/core";
import { Account, Address, createWalletClient, getContract, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hardhat } from "viem/chains";

type HookFunc = (method: string, args?: unknown[] | undefined) => Promise<unknown | undefined>;

/**
 * Hook to get data
 */
export const useReadData = (address: Address): HookFunc => {
  return async (method: string, args?: unknown[] | undefined) => {
    try {
      const publicClient = getPublicClient(wagmiConfig);
      const contract = getContract({
        abi: AddProperty.abi,
        address: address || constants.contracts.property.sepolia,
        client: publicClient,
      });

      switch (method) {
        case "s_owner":
          return await contract.read.s_owner();
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

/**
 * TODO: Migrate this to a server-component / API endpoint,
 * TODO: so that the deployer private key is not exposed in the client-side code.
 * Hook to write data
 */
export const useWriteData = (address: Address, account?: Account | Address): HookFunc => {
  const walletAccount = account || privateKeyToAccount(`0x${constants.account.deployerPrivateKey}`);
  const walletClient = createWalletClient({
    account: walletAccount,
    chain: hardhat,
    transport: http(),
  });

  return async (method: string, args?: unknown[] | undefined) => {
    if (!walletClient) {
      notification.error(
        `useAddPropertyData (${address}) -> write (${method}) -> error -> Cannot access account for ${walletAccount}`,
      );
      console.error(`useAddPropertyData (${address}) -> write (${method}) -> error -> Cannot access account`);
      return null;
    } else {
      console.log(`useAddPropertyData (${address}) -> write (${method}) -> walletClient ready for`, walletAccount);
    }

    try {
      const publicClient = getPublicClient(wagmiConfig);
      const contract = getContract({
        abi: AddProperty.abi,
        address: address || constants.contracts.property.sepolia,
        client: { public: publicClient, wallet: walletClient },
      });
      let tx;

      switch (method) {
        case "approve":
          // @ts-expect-error ignore
          tx = await contract.write.approve(args);
          break;
        default:
          notification.error(`useAddPropertyData -> write (${method}) -> error -> invalid method`);
          return null;
      }

      if (tx) {
        const receipt = await publicClient.getTransactionReceipt({ hash: tx });
        // gasPrices(receipt, `useAddPropertyData -> write (${method})`);
        console.log(`useAddPropertyData -> write (${method}) -> tx`, receipt.transactionHash);
        return receipt;
      }
    } catch (error: any) {
      console.error(`useAddPropertyData (${address}) -> write (${method}) -> error`, error);
      const message = getParsedError(error);
      notification.error(message);
      throw error;
    }
  };
};
