import { NextResponse } from "next/server";
import deployedContracts from "@contracts/deployedContracts";
import { Chain, getContract } from "viem";
import { hardhat } from "viem/chains";
import { chainIdToChain, checkAddress, checkParameters, gasPrices } from "~~/utils";
import { bootstrap } from "~~/utils/server";

export type PropertyRequest = {
  chainId: number;
  propertyAddress: string;
  propertyAmount: string;
  nftAmount: string;
  rooms: number;
  squareFoot: number;
  listPrice: number;
  userAddress: string;
};
const MSG_PREFIX = `api -> POST add-property`;

// Define the route handler for POST requests
export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = (await req.json()) as PropertyRequest;
    const { chainId, userAddress, propertyAddress, propertyAmount, nftAmount, rooms, squareFoot, listPrice } = body;
    console.log(
      MSG_PREFIX,
      "-> chain",
      chainId,
      "userAddress",
      userAddress,
      "propertyAddress",
      propertyAddress,
      "propertyAmount",
      propertyAmount,
      "nftAmount",
      nftAmount,
      "rooms",
      rooms,
      "squareFoot",
      squareFoot,
      "listPrice",
      listPrice,
    );

    try {
      checkParameters(
        [userAddress, propertyAddress, String(rooms), String(squareFoot), String(listPrice)],
        2,
        "You must provide the user and property addresses, as well as the number of rooms, square feet and list price.",
      );
      checkAddress("user address", userAddress);
      checkAddress("property address", propertyAddress);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "An unknown error occurred" },
        { status: 400 },
      );
    }

    // Get contract details for AddProperty
    const chain: Chain = chainIdToChain(chainId || hardhat.id) || hardhat;
    const { publicClient, walletClient } = await bootstrap(MSG_PREFIX, chain);
    // @ts-expect-error ignore
    const contractData = deployedContracts[String(chain.id)]?.AddProperty;

    if (!contractData) {
      return NextResponse.json({ error: "Contract not deployed on the specified chain." }, { status: 400 });
    }

    const { address: contractAddress, abi } = contractData;
    // Encode the `addPropertyToListing` method using viem
    // const addPropertyCallData = {
    //   abi,
    //   address: contractAddress,
    //   functionName: "addPropertyToListing",
    //   args: [
    //     propertyAddress,
    //     propertyAmount,
    //     nftAmount,
    //     {
    //       rooms,
    //       squareFoot,
    //       listPrice,
    //     },
    //   ],
    // };
    // // Execute the transaction using viem
    // const receipt = await walletClient.writeContract(addPropertyCallData);
    // console.log("Property added. Transaction receipt:", receipt);

    const contract = getContract({
      abi,
      address: contractAddress,
      client: {
        public: publicClient,
        wallet: walletClient,
      },
    });

    if (!contract) {
      return NextResponse.json({ error: "Error getting an instance of the contract." }, { status: 400 });
    }

    const addPropertyTx = await contract.write.addPropertyToListing([
      propertyAddress,
      propertyAmount,
      nftAmount,
      {
        rooms,
        squareFoot,
        listPrice,
      },
    ]);
    const addPropertyReceipt = await publicClient.waitForTransactionReceipt({ hash: addPropertyTx });
    gasPrices(addPropertyReceipt, MSG_PREFIX);
    console.log(`${MSG_PREFIX} -> addPropertyTx`, addPropertyReceipt.transactionHash);

    // Return success response
    return NextResponse.json({ message: "Property added successfully.", receipt: addPropertyReceipt }, { status: 200 });
  } catch (error) {
    console.error("Error adding property -> error", error);
    return NextResponse.json({ error: "Failed to add property." }, { status: 500 });
  }
}
