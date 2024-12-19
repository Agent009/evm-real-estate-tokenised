import { NextResponse } from "next/server";
import deployedContracts from "@contracts/deployedContracts";
import { Chain, getContract } from "viem";
import { hardhat } from "viem/chains";
import { chainIdToChain, checkAddress, checkNumber, checkParameters, gasPrices } from "~~/utils";
import { getContractInstance } from "~~/utils/server";

export type PropertyTokenRequest = {
  chainId: number;
  ownerAddress: string;
  mintToAddress: string;
  mintAmount: number;
};

const MSG_PREFIX = `api -> POST property-token`;

// Define the route handler for POST requests
export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = (await req.json()) as PropertyTokenRequest;
    const { chainId, ownerAddress, mintToAddress, mintAmount } = body;
    console.log(
      MSG_PREFIX,
      "-> chain",
      chainId,
      "ownerAddress",
      ownerAddress,
      "mintToAddress",
      mintToAddress,
      "mintAmount",
      mintAmount,
    );

    try {
      checkParameters(
        [mintToAddress, String(mintAmount)],
        2,
        "You must provide the mint to address and the amount to be minted.",
      );
      checkAddress("owner address", ownerAddress);
      checkAddress("mint to address", mintToAddress);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "An unknown error occurred" },
        { status: 400 },
      );
    }

    // Get contract details for PropertyToken
    const chain: Chain = chainIdToChain(chainId || hardhat.id) || hardhat;
    const { contract: propertyTokenContract, publicClient } = await getContractInstance(
      MSG_PREFIX + "-> PropertyToken",
      "PropertyToken",
      chain,
    );

    // Step 1: Mint tokens
    const propertySymbol = await propertyTokenContract.read.symbol();
    const propertyName = await propertyTokenContract.read.name();
    console.log(`${MSG_PREFIX} -> propertyName`, propertyName);

    const mintPropertyTokenTx = await propertyTokenContract.write.mint([mintToAddress, mintAmount]);

    const mintPropertyTokenReceipt = await publicClient.waitForTransactionReceipt({ hash: mintPropertyTokenTx });
    gasPrices(mintPropertyTokenReceipt, MSG_PREFIX);
    console.log(`${MSG_PREFIX} -> mintPropertyTokenTx`, mintPropertyTokenReceipt.transactionHash);

    return NextResponse.json({
      message: `Minted ${mintAmount} ${propertySymbol} tokens successfully to ${mintToAddress}`,
    });
  } catch (error) {
    console.error(`${MSG_PREFIX} -> error`, error);
    return NextResponse.json({ error: "Failed to mint tokens." }, { status: 500 });
  }
}
