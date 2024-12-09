import Property from "@contracts/Property.json";
import { wagmiConfig } from "@services/web3/wagmiConfig";
import { constants } from "@utils/constants";
import { getParsedError, notification } from "@utils/scaffold-eth";
import { getPublicClient } from "@wagmi/core";
import { Account, Address, TransactionReceipt, createWalletClient, formatEther, getContract, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hardhat } from "viem/chains";

type HookFunc = (method: string, args?: unknown[] | undefined) => Promise<unknown | undefined>;

/**
 * Hook to get token data
 */
export const useReadData = (address: Address): HookFunc => {
  return async (method: string, args?: unknown[] | undefined) => {
    try {
      const publicClient = getPublicClient(wagmiConfig);
      const contract = getContract({
        abi: Property.abi,
        address: address || constants.contracts.property.sepolia,
        client: publicClient,
      });

      switch (method) {
        case "name":
          return await contract.read.name();
        case "symbol":
          return await contract.read.symbol();
        case "totalSupply":
          return await contract.read.totalSupply();
        case "owner":
          return await contract.read.owner();
        case "balanceOf":
          if (!args) {
            notification.error(`useTokenData -> read (${method}) -> Please provide account address.`);
            return null;
          }

          return await contract.read.balanceOf(args);
        case "MINTER_ROLE":
          return await contract.read.MINTER_ROLE();
        case "hasRole":
          if (!args) {
            notification.error(`useTokenData -> read (${method}) -> Please provide role and account addresses.`);
            return null;
          }

          return await contract.read.hasRole(args);
        default:
          notification.error(`useTokenData -> read (${method}) -> error -> invalid method`);
          return null;
      }
    } catch (error: any) {
      console.error(`useTokenData (${address}) -> read (${method}) -> error`, error);
      const message = getParsedError(error);
      notification.error(message);
      throw error;
    }
  };
};

/**
 * TODO: Migrate this to a server-component / API endpoint,
 * TODO: so that the deployer private key is not exposed in the client-side code.
 * Hook to write token data
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
        `useTokenData (${address}) -> write (${method}) -> error -> Cannot access account for ${walletAccount}`,
      );
      console.error(`useTokenData (${address}) -> write (${method}) -> error -> Cannot access account`);
      return null;
    } else {
      console.log(`useTokenData (${address}) -> write (${method}) -> walletClient ready for`, walletAccount);
    }

    try {
      const publicClient = getPublicClient(wagmiConfig);
      const contract = getContract({
        abi: Property.abi,
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
          notification.error(`useTokenData -> write (${method}) -> error -> invalid method`);
          return null;
      }

      if (tx) {
        const receipt = await publicClient.getTransactionReceipt({ hash: tx });
        gasPrices(receipt, `useTokenData -> write (${method})`);
        console.log(`useTokenData -> write (${method}) -> tx`, receipt.transactionHash);
        return receipt;
      }
    } catch (error: any) {
      console.error(`useTokenData (${address}) -> write (${method}) -> error`, error);
      const message = getParsedError(error);
      notification.error(message);
      throw error;
    }
  };
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
