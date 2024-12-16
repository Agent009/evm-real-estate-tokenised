import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the "Property" contract using the deployer account
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployProperty: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` which will fill DEPLOYER_PRIVATE_KEY
    with a random private key in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deployProxy } = hre.upgrades;

  const Property = await hre.ethers.getContractFactory("Property");
  const property = await deployProxy(Property, [deployer, deployer]);
  await property.waitForDeployment();
  console.log("👋 Property contract deployed at", await property.getAddress(), "with deployer", deployer);

  // Get the deployed contract to interact with it after deploying.
  await hre.ethers.getContract<Contract>("Property", deployer);
};

export default deployProperty;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags Property
deployProperty.tags = ["ERC1155", "RWA", "Property", "Real Estate"];
