import { useEffect, useState } from "react";
import Property from "@contracts/Property.json";
import deployedContracts from "@contracts/deployedContracts";
import { useScaffoldReadContract } from "@hooks/scaffold-eth";
import { wagmiConfig } from "@services/web3/wagmiConfig";
import { notification } from "@utils/scaffold-eth";
import { getPublicClient } from "@wagmi/core";
import { Hex } from "viem";
import { useAccount, useDeployContract } from "wagmi";

export const DeployProperty = () => {
  const { address, isConnected, chainId } = useAccount();
  const { deployContract } = useDeployContract();
  const [mounted, setMounted] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [loading, setLoading] = useState(false);
  console.log(
    "DeployProperty -> init -> isConnected",
    isConnected,
    "chainId",
    chainId,
    "mounted",
    mounted,
    "loading",
    loading,
  );

  useEffect(() => {
    if (isConnected) {
      setMounted(true);
    }
  }, [isConnected]);

  // @ts-expect-error ignore
  const deployedContract = deployedContracts[chainId]?.Property;
  const { data: minterRole } = useScaffoldReadContract({
    contractName: "Property",
    functionName: "MINTER_ROLE",
    args: [],
  });
  console.log("DeployProperty -> deployedContract", deployedContract?.address, "minterRole", minterRole);

  const deployProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("DeployProperty -> deployProperty");

    if (!window.ethereum || address === null) {
      notification.error("Please connect to a wallet to deploy the property contract.");
      return;
    }

    // if (tokenName.trim() === "" || tokenSymbol.trim() === "") {
    //   notification.error("Please fill in all required fields.");
    //   return;
    // }

    try {
      setLoading(true);

      deployContract(
        {
          abi: Property.abi,
          args: [],
          bytecode: Property.bytecode as Hex,
        },
        {
          onError: error => {
            console.error("DeployProperty -> deployProperty -> onError -> error", error);
            notification.error("Property deployment failed. Check console for details.");
          },
          onSuccess: tx => {
            console.log("DeployProperty -> deployProperty -> onSuccess -> tx", tx);
            // @ts-expect-error ignore
            const client = getPublicClient(wagmiConfig, { chainId: chainId });
            client.getTransactionReceipt({ hash: tx }).then(receipt => {
              const address = receipt.contractAddress || receipt.to;
              console.log("DeployProperty -> deployProperty -> onSuccess -> address", address, "receipt", receipt);
              notification.success(
                `Property contract deployed successfully at: ${address}` +
                  "\nYou should update the contract addresses in the `deployedContracts` object.",
              );
            });
          },
        },
      );
    } catch (error) {
      console.error("DeployProperty -> deployProperty -> error", error);
      notification.error("Property contract deployment failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !isConnected || !chainId) return null;

  if (deployedContract) {
    return (
      <>
        <h2 className="text-xl font-bold text-center">Deployed Contract Details</h2>

        <label className="form-control w-full">
          <div className="label">
            <span className="label-text">Property contract</span>
            <span className="label-text-alt">Address</span>
          </div>
          <code className="flex-1 block whitespace-pre overflow-none text-left bg-base-100 p-2 rounded-md">
            {deployedContract.address}
          </code>
        </label>

        <label className="form-control w-full">
          <div className="label">
            <span className="label-text">Minter Role</span>
            <span className="label-text-alt">Address</span>
          </div>
          <code className="flex-1 block whitespace-pre overflow-none text-left bg-base-100 p-2 rounded-md">
            {minterRole}
          </code>
        </label>
      </>
    );
  }

  return (
    <div className="flex flex-col items-center p-4">
      <form onSubmit={deployProperty} className="w-full max-w-md space-y-4">
        <label className="input input-bordered flex items-center gap-2">
          Name
          <input
            type="text"
            placeholder="Token Name"
            value={tokenName}
            onChange={e => setTokenName(e.target.value)}
            required
            className="grow"
          />
        </label>
        <label className="input input-bordered flex items-center gap-2">
          Symbol
          <input
            type="text"
            placeholder="Token Symbol"
            value={tokenSymbol}
            onChange={e => setTokenSymbol(e.target.value)}
            required
            className="grow"
          />
        </label>

        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? <span className="loading loading-spinner"></span> : "Deploy Property Contract"}
        </button>
      </form>
    </div>
  );
};
