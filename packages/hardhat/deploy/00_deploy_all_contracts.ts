import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploys all of the contracts using the deployer account
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployAllContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` which will fill DEPLOYER_PRIVATE_KEY
    with a random private key in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  // const { deploy } = hre.deployments;
  const { deployProxy } = hre.upgrades;

  if (!deployer) {
    throw new Error("Deployer address is undefined");
  }
  console.log("Deployer: ", deployer);

  //
  // Property contract
  //
  const Property = await hre.ethers.getContractFactory("Property");
  // Deploy the proxy contract
  const property = await deployProxy(Property, [deployer, deployer]);
  await property.waitForDeployment();

  const propertyAddress = await property.getAddress();
  if (!propertyAddress) {
    throw new Error("Deployment failed for Property, no contract address found.");
  }
  // console.log("Property Address: ", propertyAddress);

  const deployedProperty = await hre.ethers.getContractAt("Property", propertyAddress);
  if (!deployedProperty) {
    throw new Error("No Contract deployed with name: Property");
  }

  console.log(`👋 Property contract deployed at ${propertyAddress} by deployer ${deployer}`);

  //
  // Property Token contract
  //
  const PropertyToken = await hre.ethers.getContractFactory("PropertyToken");
  const propertyToken = await PropertyToken.deploy(deployer);
  await propertyToken.waitForDeployment();

  const propertyTokenAddress = await propertyToken.getAddress();
  if (!propertyTokenAddress) {
    throw new Error("Deployment failed for PropertyToken, no contract address found.");
  }
  // console.log("Property Token Address: ", propertyTokenAddress);

  const deployedPropertyToken = await hre.ethers.getContractAt("PropertyToken", propertyTokenAddress);
  if (!deployedPropertyToken) {
    throw new Error("No Contract deployed with name: PropertyToken");
  }

  console.log(`👋 PropertyToken contract deployed at ${propertyTokenAddress} by deployer ${deployer}`);

  //
  // Payment Token Mock contract
  //
  const PaymentTokenMock = await hre.ethers.getContractFactory("PaymentTokenMock");
  const paymentToken = await PaymentTokenMock.deploy("MockToken", "MTK");
  await paymentToken.waitForDeployment();

  const paymentTokenAddress = await propertyToken.getAddress();
  if (!paymentTokenAddress) {
    throw new Error("Deployment failed for PropertyToken, no contract address found.");
  }
  // console.log("Payment Token Mock Address: ", paymentTokenAddress);

  const deployedPaymentToken = await hre.ethers.getContractAt("PaymentTokenMock", paymentTokenAddress);
  if (!deployedPaymentToken) {
    throw new Error("No Contract deployed with name: PaymentTokenMock");
  }

  console.log(`👋 PaymentTokenMock contract deployed at ${paymentTokenAddress} by deployer ${deployer}`);

  //
  // Add Property contract
  //
  const AddProperty = await hre.ethers.getContractFactory("AddProperty");
  const addProperty = await AddProperty.deploy(propertyAddress);
  await addProperty.waitForDeployment();

  const addPropertyAddress = await addProperty.getAddress();
  if (!addPropertyAddress) {
    throw new Error("Deployment failed for AddProperty, no contract address found.");
  }
  // console.log("Add Property Address: ", addPropertyAddress);

  const deployedAddProperty = await hre.ethers.getContractAt("AddProperty", addPropertyAddress);
  if (!deployedAddProperty) {
    throw new Error("No Contract deployed with name: AddProperty");
  }

  console.log(`👋 AddProperty contract deployed at ${addPropertyAddress} by deployer ${deployer}`);

  //
  // Property Vault contract
  //
  const PropertyVault = await hre.ethers.getContractFactory("PropertyVault");
  const propertyVault = await PropertyVault.deploy(
    addPropertyAddress,
    propertyAddress,
    propertyTokenAddress,
    paymentTokenAddress,
  );
  await propertyVault.waitForDeployment();

  const propertyVaultAddress = await propertyVault.getAddress();
  if (!propertyVaultAddress) {
    throw new Error("Deployment failed for PropertyVault, no contract address found.");
  }
  console.log("Property Vault Address: ", addPropertyAddress);

  const deployedPropertyVault = await hre.ethers.getContractAt("PropertyVault", propertyVaultAddress);
  if (!deployedPropertyVault) {
    throw new Error("No Contract deployed with name: PropertyVault");
  }

  console.log(`👋 PropertyVault contract deployed at ${propertyVaultAddress} by deployer ${deployer}`);
};

export default deployAllContracts;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags PropertyRWA
deployAllContracts.tags = ["PropertyRWA"];
