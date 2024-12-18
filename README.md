# 🏗 EVM Real Estate Tokenisation DApp

Built with [Scaffold-ETH 2](https://scaffoldeth.io/).

## MVP Contract Functionality

* Mint Property NFT and mint fractional shares.
* Buy/Sell property.
* Buy/Sell property shares.
* Receive income (rent) for a Property.
* Transfer income to investors, based on their fractional share ownership.
* List properties
* List property income (inc history)
* List share ownership of properties.
* List Investors share ownership by property (an investor may hold shares in multiple properties).
* List income paid to investors.

## Setup

Before you begin, you need to install the following tools:

- [Node (>= v18.18)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

1. Install dependencies if it was skipped in CLI:

```
cd evm-real-estate-tokenisation
yarn install
```

2. Run a local network in the first terminal:

```
yarn chain
```

This command starts a local Ethereum network using Hardhat. The network runs on your local machine and can be used for testing and development. You can customize the network configuration in `packages/hardhat/hardhat.config.ts`.

3. On a second terminal, deploy the test contract:

```bash
yarn deploy # deploy locally
yarn deploy --network sepolia # deploy to testnet
yarn verify --network sepolia # verify on testnet
```

This command deploys a test smart contract to the local network. The contract is located in `packages/hardhat/contracts` and can be modified to suit your needs. The `yarn deploy` command uses the deploy script located in `packages/hardhat/deploy` to deploy the contract to the network. You can also customize the deploy script.

**CAUTION:** The `deploy` command deploys the `Property` contract as a proxy, and doesn't directly update the definitions in `deployedContracts.ts` for this proxy. The definition and contract address has to be added in manually after each deployment. The abi definition can be fetched from the `artifacts` folder, and then the `address` property should be updated as necessary. You should then end up with something like the following:

```typescript
const deployedContracts = {
  CHAIN_ID: {
    // This is added in manually because the deployProxy method of hardhat doesn't seem to auto-generate the deployment
    // for this. The ""address"" will need to be updated manually each time a new instance of this contract is deployed.
    Property: {
      address: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
      abi: [],
    }
  }
}
```

4. On a third terminal, start your NextJS app:

```
yarn start
```

Visit your app on: `http://localhost:3000`. You can interact with your smart contract using the `Debug Contracts` page. You can tweak the app config in `packages/nextjs/scaffold.config.ts`.

Run smart contract test with `yarn hardhat:test`

- Edit your smart contracts in `packages/hardhat/contracts`
- Edit your frontend homepage at `packages/nextjs/app/page.tsx`. For guidance on [routing](https://nextjs.org/docs/app/building-your-application/routing/defining-routes) and configuring [pages/layouts](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts) checkout the Next.js documentation.
- Edit your deployment scripts in `packages/hardhat/deploy`

### Testing Locally

* This should be done via the **NextJS** app deployed at `packages/nextjs`.
* Choose **Sepolia** or **HardHat** as the network after connecting with a wallet.
* If `deployedContracts.ts` already contains deployment details for your selected chain, the interface will show you actions to manage that lottery.
* Alternatively, to quickly test locally, change the **contract name** for your desired chain within `deployedContracts.ts` to an arbitrary string temporarily.
* This should result in the contract deployment interface being displayed on the homepage.
* From here, you can deploy the contract via the UI, setting the ratio and prices as needed.
* Once deployed, copy and paste the deployed contract address back into `deployedContracts.ts` and revert the changes made earlier to the contract name.
* This should now allow you to interact with the locally deployed contract via the interface.
