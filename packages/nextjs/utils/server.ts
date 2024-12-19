import deployedContracts from "@contracts/deployedContracts";
import { constants } from "@utils/constants";
import { chainIdToChain, publicClientFor, walletClientFor } from "@utils/index";
import { Chain, formatEther, getContract } from "viem";
import { PrivateKeyAccount, privateKeyToAccount } from "viem/accounts";
import { hardhat } from "viem/chains";

export const deployerAccount = privateKeyToAccount(`0x${constants.account.deployerPrivateKey}`);

export const bootstrap = async (
  msgPrefix = "scripts",
  chain_?: Chain | undefined,
  deployerAccount_: PrivateKeyAccount = deployerAccount,
) => {
  const publicClient = await publicClientFor(chain_);
  const deployerAddress = deployerAccount_.address;
  const walletClient = walletClientFor(deployerAccount_);
  const blockNo = await publicClient.getBlockNumber();
  const balance = await publicClient.getBalance({
    address: deployerAddress,
  });
  console.log(
    `${msgPrefix} -> blockNo`,
    blockNo,
    "deployer",
    deployerAddress,
    "balance",
    formatEther(balance),
    walletClient.chain.nativeCurrency.symbol,
  );
  return {
    publicClient,
    walletClient,
    blockNo,
    balance,
  };
};

export const getContractInstance = async (
  msgPrefix = "scripts",
  contractName: string,
  chainId_?: number | undefined,
  deployerAccount_: PrivateKeyAccount = deployerAccount,
) => {
  const chain: Chain = chainIdToChain(chainId_ || hardhat.id) || hardhat;
  // Initialise the public and wallet clients.
  const { publicClient, walletClient } = await bootstrap(msgPrefix, chain, deployerAccount_);
  // Get the deployed contract data.
  // @ts-expect-error ignore
  const contractData = deployedContracts[String(chain.id)]?.[contractName];

  if (!contractData) {
    throw Error(`${contractName} contract not deployed on the specified chain (${chain?.name}).`);
  }

  // Extract the deployed contract artifacts.
  const { address: contractAddress, abi } = contractData;

  // Get the contract instance.
  const contract = getContract({
    abi,
    address: contractAddress,
    client: {
      public: publicClient,
      wallet: walletClient,
    },
  });

  if (!contract) {
    throw Error(`Error getting an instance of the ${contractName} contract at ${contractAddress}.`);
  }

  return {
    chain,
    publicClient,
    walletClient,
    contract,
    contractAddress,
    contractData,
    abi,
  };
};
