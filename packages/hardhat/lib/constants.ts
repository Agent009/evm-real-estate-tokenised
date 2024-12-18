import * as dotenv from "dotenv";
dotenv.config();

const alchemyAPIKey = process.env.ALCHEMY_API_KEY || "";
export const constants = Object.freeze({
  account: {
    deployerAddress: process.env.DEPLOYER_ADDRESS || "",
    deployerPrivateKey: process.env.DEPLOYER_PRIVATE_KEY || "",
  },
  contracts: {
    property: {
      sepolia: process.env.PROPERTY_SEPOLIA || "",
    },
  },
  integrations: {
    alchemy: {
      apiKey: alchemyAPIKey,
      sepolia: `https://eth-sepolia.g.alchemy.com/v2/${alchemyAPIKey}`,
    },
    etherscan: {
      apiKey: process.env.ETHERSCAN_API_KEY || "",
    },
  },
});
