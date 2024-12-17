import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

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
  const { deploy } = hre.deployments;
  const { deployProxy } = hre.upgrades;

  if (!deployer) {
    throw new Error("Deployer address is undefined");
  }
  console.log("Deployer: ", deployer);

  const deployContract = async (contractName: string, args: unknown[]) => {
    await deploy(contractName, {
      from: deployer,
      // Contract constructor arguments
      args: args,
      log: true,
      // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
      // automatically mining the contract deployment transaction. There is no effect on live networks.
      autoMine: true,
    });

    // Get the deployed contract to interact with it after deploying.
    const contract = await hre.ethers.getContract<Contract>(contractName, deployer);
    const contractAddress = await contract.getAddress();

    if (!contractAddress) {
      throw new Error(`Deployment failed for ${contractName}, no contract address found.`);
    }
    // console.log(`${contractName} Address:`, addPropertyAddress);

    console.log(`👋 ${contractName} contract deployed at ${contractAddress} by deployer ${deployer}`);
    return contractAddress;
  };

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
  // const PropertyToken = await hre.ethers.getContractFactory("PropertyToken");
  // const propertyToken = await PropertyToken.deploy(deployer);
  // await propertyToken.waitForDeployment();
  const propertyTokenAddress = await deployContract("PropertyToken", [deployer]);

  //
  // Payment Token Mock contract
  //
  // const PaymentTokenMock = await hre.ethers.getContractFactory("PaymentTokenMock");
  // const paymentToken = await PaymentTokenMock.deploy("MockToken", "MTK");
  // await paymentToken.waitForDeployment();
  const paymentTokenAddress = await deployContract("PaymentTokenMock", ["MockToken", "MTK"]);

  //
  // Add Property contract
  //
  // const AddProperty = await hre.ethers.getContractFactory("AddProperty");
  // const addProperty = await AddProperty.deploy(propertyAddress);
  // await addProperty.waitForDeployment();
  const addPropertyAddress = await deployContract("AddProperty", [propertyAddress]);

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
  await deployContract("PropertyVault", [
    addPropertyAddress,
    propertyAddress,
    propertyTokenAddress,
    paymentTokenAddress,
  ]);
};

export default deployAllContracts;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags PropertyRWA
deployAllContracts.tags = ["PropertyRWA"];
