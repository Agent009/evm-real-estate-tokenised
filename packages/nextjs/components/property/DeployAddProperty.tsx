import { useEffect, useState } from "react";
import AddProperty from "@contracts/AddProperty.json";
import Property from "@contracts/Property.json";
import deployedContracts from "@contracts/deployedContracts";
import { useWriteData } from "@hooks/property";
import { useScaffoldReadContract } from "@hooks/scaffold-eth";
import { wagmiConfig } from "@services/web3/wagmiConfig";
import { notification } from "@utils/scaffold-eth";
import { getPublicClient } from "@wagmi/core";
import { TransactionReceipt } from "viem";
import { Hex } from "viem";
import { useAccount, useDeployContract } from "wagmi";

/**
 * FIXME: This is not in use. It should be removed.
 * @constructor
 */
export const DeployAddProperty = () => {
  const { address, isConnected, chainId } = useAccount();
  const { deployContract } = useDeployContract();
  const [mounted, setMounted] = useState(false);
  const [ownerAddress, setOwnerAddress] = useState("");
  const [loading, setLoading] = useState(false);
  console.log(
    "DeployAddProperty -> init -> isConnected",
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
  const deployedContract = deployedContracts[chainId]?.AddProperty;
  // @ts-expect-error ignore
  const propertyWrite = useWriteData(deployedContracts[chainId]?.Property.address);
  const { data: s_owner } = useScaffoldReadContract({
    contractName: "AddProperty",
    functionName: "s_owner",
    args: [],
  });
  console.log("DeployAddProperty -> deployedContract", deployedContract?.address, "s_owner", s_owner);

  const deployAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("DeployAddProperty -> deployAddProperty");

    if (!window.ethereum || !address) {
      notification.error("Please connect to a wallet to deploy the property contract.");
      return;
    }

    const ownerAddress_ = ownerAddress || address;

    if (ownerAddress_.trim() === "") {
      notification.error("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);

      // Step 1: Property contract implementation deployment. No function calls are made against this.
      deployContract(
        {
          abi: Property.abi,
          bytecode: Property.bytecode as Hex,
        },
        {
          onError: error => {
            console.error("DeployAddProperty -> deployProperty -> onError -> error", error);
            notification.error("Property deployment failed. Check console for details.");
          },
          onSuccess: tx => {
            console.log("DeployAddProperty -> deployProperty -> onSuccess -> tx", tx);
            // @ts-expect-error ignore
            const client = getPublicClient(wagmiConfig, { chainId: chainId });
            client.getTransactionReceipt({ hash: tx }).then(async receipt => {
              const implementationAddress = receipt.contractAddress || receipt.to;
              console.log(
                "DeployAddProperty -> deployProperty -> onSuccess -> implementation address",
                implementationAddress,
                "receipt",
                receipt,
              );
              notification.success(
                `Property contract implementation deployed successfully at: ${implementationAddress}`,
              );

              // TODO: Step 2: Property contract proxy deployment.
              // Delegates all logic calls to the deployed implementation.
              deployContract(
                {
                  abi: Property.abi,
                  bytecode: Property.bytecode as Hex,
                },
                {
                  onError: error => {
                    console.error("DeployAddProperty -> deployProperty -> onError -> error", error);
                    notification.error("Property deployment failed. Check console for details.");
                  },
                  onSuccess: tx => {
                    console.log("DeployAddProperty -> deployProperty -> onSuccess -> tx", tx);
                  },
                },
              );

              const receipt2 = (await propertyWrite("initialize", [
                ownerAddress_,
                ownerAddress_,
              ])) as unknown as TransactionReceipt;
              console.log(`DeployAddProperty -> deployProperty -> initialize -> receipt`, receipt2);

              // Step 3: Deploy the AddProperty contract.
              deployContract(
                {
                  abi: AddProperty.abi,
                  args: [ownerAddress, 0, implementationAddress],
                  bytecode: AddProperty.bytecode as Hex,
                },
                {
                  onError: error => {
                    console.error("DeployAddProperty -> deployAddProperty -> onError -> error", error);
                    notification.error("AddProperty deployment failed. Check console for details.");
                  },
                  onSuccess: tx => {
                    console.log("DeployAddProperty -> deployAddProperty -> onSuccess -> tx", tx);
                    // @ts-expect-error ignore
                    const client = getPublicClient(wagmiConfig, { chainId: chainId });
                    client.getTransactionReceipt({ hash: tx }).then(receipt => {
                      const address = receipt.contractAddress || receipt.to;
                      console.log(
                        "DeployAddProperty -> deployAddProperty -> onSuccess -> address",
                        address,
                        "receipt",
                        receipt,
                      );
                      notification.success(
                        `AddProperty contract deployed successfully at: ${address}` +
                          "\nYou should update the contract addresses in the `deployedContracts` object.",
                      );
                    });
                  },
                },
              );
            });
          },
        },
      );
    } catch (error) {
      console.error("DeployAddProperty -> deployAddProperty -> error", error);
      notification.error("AddProperty contract deployment failed. Check console for details.");
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
            <span className="label-text">Add Property contract</span>
            <span className="label-text-alt">Address</span>
          </div>
          <code className="flex-1 block whitespace-pre overflow-none text-left bg-base-100 p-2 rounded-md">
            {deployedContract.address}
          </code>
        </label>

        <label className="form-control w-full">
          <div className="label">
            <span className="label-text">Owner</span>
            <span className="label-text-alt">Address</span>
          </div>
          <code className="flex-1 block whitespace-pre overflow-none text-left bg-base-100 p-2 rounded-md">
            {s_owner}
          </code>
        </label>
      </>
    );
  }

  return (
    <div className="flex flex-col items-center p-4">
      <form onSubmit={deployAddProperty} className="w-full max-w-md space-y-4">
        <label className="input input-bordered flex items-center gap-2">
          Owner
          <input
            type="text"
            placeholder="Owner Address"
            value={ownerAddress || address}
            onChange={e => setOwnerAddress(e.target.value)}
            required
            className="grow"
          />
        </label>

        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? <span className="loading loading-spinner"></span> : "Deploy Add Property Contract"}
        </button>
      </form>
    </div>
  );
};
