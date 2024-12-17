import { constants } from "@utils/constants";
import { publicClientFor, walletClientFor } from "@utils/index";
import { Chain, formatEther } from "viem";
import { PrivateKeyAccount, privateKeyToAccount } from "viem/accounts";

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
