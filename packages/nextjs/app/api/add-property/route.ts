import { NextResponse } from "next/server";
import deployedContracts from "@contracts/deployedContracts";
import { Chain, getContract } from "viem";
import { hardhat } from "viem/chains";
import { chainIdToChain, checkAddress, checkParameters, gasPrices } from "~~/utils";
import { getContractInstance } from "~~/utils/server";

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
      checkAddress("user", userAddress);
      checkAddress("property", propertyAddress);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "An unknown error occurred" },
        { status: 400 },
      );
    }

    // Get contract details for AddProperty
    const chain: Chain = chainIdToChain(chainId || hardhat.id) || hardhat;
    const { contract: addPropertyContract, publicClient } = await getContractInstance(
      MSG_PREFIX + "-> AddProperty",
      "AddProperty",
      chain,
    );
    // const { contract: propertyContract } = await getContractInstance(MSG_PREFIX + "-> Property", "Property", chain);
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

    // Step 1: Add user
    const isUser = await addPropertyContract.read.isUser([userAddress]);

    if (!isUser) {
      const addUserTx = await addPropertyContract.write.addUser([userAddress]);
      const addUserReceipt = await publicClient.waitForTransactionReceipt({ hash: addUserTx });
      console.log(`${MSG_PREFIX} -> addUserTx`, addUserReceipt.transactionHash);
    }

    // Step n: Add property listing
    const isPropertyAddressListed = await addPropertyContract.read.isPropertyAddressListed([propertyAddress]);

    if (isPropertyAddressListed) {
      return NextResponse.json({ message: "The property is already listed." }, { status: 200 });
    }

    const addPropertyTx = await addPropertyContract.write.addPropertyToListing([
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
    return NextResponse.json(
      { message: "Property added successfully.", data: { tx: addPropertyReceipt.transactionHash } },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error adding property -> error", error);
    return NextResponse.json(
      { error: "Failed to add property.", details: error instanceof Error ? error.message : "" },
      { status: 500 },
    );
  }
}
