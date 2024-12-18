import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";
import { constants } from "../lib/constants";

/**
 * Deploys all the contracts using the deployer account
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployAllContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // We have changed the default signer logic to allow a defined account to deploy the contracts.
  // The DEPLOYER_PRIVATE_KEY environment variable should be set before running the script.
  // In the absence of the DEPLOYER_PRIVATE_KEY, the default signer will be used.
  // If you get the following error, make sure to get some funds to the deployer account and try again.
  // ProviderError: Sender doesn't have enough funds to send tx. The max upfront cost is: ___ and the sender's balance is: 0.
  // const { deployer } = await hre.getNamedAccounts();
  const [defaultSigner] = await hre.ethers.getSigners();
  const { deploy } = hre.deployments;
  const { deployProxy } = hre.upgrades;

  if (!defaultSigner) {
    throw new Error("The default signer is undefined.");
  }

  const adminSigner = constants.account.deployerPrivateKey
    ? new hre.ethers.Wallet(`0x${constants.account.deployerPrivateKey}`, hre.ethers.provider)
    : defaultSigner!;
  const adminAddress: string = adminSigner.address;
  console.log("Deployer", adminAddress);

  const deployContract = async (contractName: string, args: unknown[]) => {
    await deploy(contractName, {
      from: `0x${constants.account.deployerPrivateKey}`,
      // Contract constructor arguments
      args: args,
      log: true,
      // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
      // automatically mining the contract deployment transaction. There is no effect on live networks.
      autoMine: true,
    });

    // Get the deployed contract to interact with it after deploying.
    const contract = await hre.ethers.getContract<Contract>(contractName, adminSigner);
    const contractAddress = await contract.getAddress();

    if (!contractAddress) {
      throw new Error(`Deployment failed for ${contractName}, no contract address found.`);
    }
    // console.log(`${contractName} Address:`, addPropertyAddress);

    console.log(`👋 ${contractName} contract deployed at ${contractAddress} by deployer ${adminAddress}`);
    return {
      contract,
      contractAddress,
    };
  };

  //
  // Property contract
  //
  const Property = await hre.ethers.getContractFactory("Property");
  // Deploy the proxy contract
  const property = await deployProxy(Property, [adminAddress, adminAddress]);
  await property.waitForDeployment();

  const propertyAddress = await property.getAddress();
  if (!propertyAddress) {
    throw new Error("Deployment failed for Property, no contract address found.");
  }
  // console.log("Property Address: ", propertyAddress);

  const deployedProperty = await hre.ethers.getContractAt("Property", propertyAddress, adminSigner);
  if (!deployedProperty) {
    throw new Error("No Contract deployed with name: Property");
  }

  console.log(`👋 Property contract deployed at ${propertyAddress} by deployer ${adminAddress}`);
  const propertyMinterRole = await deployedProperty.MINTER_ROLE();
  const propertyUriSetterRole = await deployedProperty.URI_SETTER_ROLE();

  //
  // Property Token contract
  //
  // const PropertyToken = await hre.ethers.getContractFactory("PropertyToken");
  // const propertyToken = await PropertyToken.deploy(deployer);
  // await propertyToken.waitForDeployment();
  const { contract: deployedPropertyToken, contractAddress: propertyTokenAddress } = await deployContract(
    "PropertyToken",
    [adminAddress],
  );
  // const deployedPropertyToken = await hre.ethers.getContractAt("PropertyToken", propertyTokenAddress);
  if (!deployedPropertyToken) {
    throw new Error("No Contract deployed with name: PropertyToken");
  }

  // @ts-expect-error ignore
  const propertyTokenMinterRole = await deployedPropertyToken.MINTER_ROLE();

  //
  // Payment Token Mock contract
  //
  // const PaymentTokenMock = await hre.ethers.getContractFactory("PaymentTokenMock");
  // const paymentToken = await PaymentTokenMock.deploy("MockToken", "MTK");
  // await paymentToken.waitForDeployment();
  const { contractAddress: paymentTokenAddress } = await deployContract("PaymentTokenMock", ["MockToken", "MTK"]);

  //
  // Add Property contract
  //
  // const AddProperty = await hre.ethers.getContractFactory("AddProperty");
  // const addProperty = await AddProperty.deploy(propertyAddress);
  // await addProperty.waitForDeployment();
  const { contractAddress: addPropertyAddress } = await deployContract("AddProperty", [propertyAddress]);

  //
  // Property Vault contract
  //
  // const PropertyVault = await hre.ethers.getContractFactory("PropertyVault");
  // const propertyVault = await PropertyVault.deploy(
  //   addPropertyAddress,
  //   propertyAddress,
  //   propertyTokenAddress,
  //   paymentTokenAddress,
  // );
  // await propertyVault.waitForDeployment();
  // const deployedPropertyVault = await hre.ethers.getContractAt("PropertyVault", propertyVaultAddress);
  // if (!deployedPropertyVault) {
  //   throw new Error("No Contract deployed with name: PropertyVault");
  // }
  const { contractAddress: propertyVaultAddress } = await deployContract("PropertyVault", [
    addPropertyAddress,
    propertyAddress,
    propertyTokenAddress,
    paymentTokenAddress,
  ]);

  // Grant the necessary roles and approvals
  console.log("Granting roles and approvals...");
  await deployedProperty.grantRole(propertyMinterRole, adminAddress);
  console.log("--->>> deployedProperty.grantRole(propertyMinterRole, adminAddress)");
  await deployedProperty.grantRole(propertyMinterRole, addPropertyAddress);
  console.log("--->>> deployedProperty.grantRole(propertyMinterRole, addPropertyAddress)");
  await deployedProperty.grantRole(propertyUriSetterRole, addPropertyAddress);
  console.log("--->>> deployedProperty.grantRole(propertyUriSetterRole, addPropertyAddress)");
  await deployedProperty.setApprovalForAll(propertyVaultAddress, true);
  console.log("--->>> deployedProperty.setApprovalForAll(propertyVaultAddress, true)");
  // @ts-expect-error ignore
  await deployedPropertyToken.grantRole(propertyTokenMinterRole, propertyVaultAddress);
  console.log("--->>> deployedPropertyToken.grantRole(propertyTokenMinterRole, propertyVaultAddress)");
};

// noinspection JSUnusedGlobalSymbols
export default deployAllContracts;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags PropertyRWA
deployAllContracts.tags = ["PropertyRWA"];
