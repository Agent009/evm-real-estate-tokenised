import { NextResponse } from "next/server";
import { checkAddress, checkParameters, gasPrices } from "~~/utils";
import { getContractInstance } from "~~/utils/server";

type RequestPayload = {
  chainId: number;
  userAddress: string;
};
const MSG_PREFIX = `api -> POST add-property/user`;

// Add user to property listing
export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = (await req.json()) as RequestPayload;
    const { chainId, userAddress } = body;
    console.log(MSG_PREFIX, "-> chain", chainId, "userAddress", userAddress);

    try {
      checkParameters([userAddress], 1, "You must provide the user address.");
      checkAddress("user", userAddress);
    } catch (error) {
      console.error(MSG_PREFIX, "-> error", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "An unknown error occurred" },
        { status: 400 },
      );
    }

    // Get contract instance
    const { contract: addPropertyContract, publicClient } = await getContractInstance(
      MSG_PREFIX + "-> AddProperty",
      "AddProperty",
      chainId,
    );

    // ===STEP=== Add user
    const isUser = await addPropertyContract.read.isUser([userAddress]);

    if (isUser) {
      return NextResponse.json({ message: "The user is already present." }, { status: 200 });
    }

    const addUserTx = await addPropertyContract.write.addUser([userAddress]);
    const addUserReceipt = await publicClient.waitForTransactionReceipt({ hash: addUserTx });
    gasPrices(addUserReceipt, MSG_PREFIX);
    console.log(`${MSG_PREFIX} -> addUserTx`, addUserReceipt.transactionHash);

    // Return success response
    return NextResponse.json(
      { message: "User added successfully.", data: { tx: addUserReceipt.transactionHash } },
      { status: 200 },
    );
  } catch (error) {
    console.error(MSG_PREFIX, "Error adding user -> error", error);
    return NextResponse.json(
      { error: "Failed to add user.", details: error instanceof Error ? error.message : "" },
      { status: 500 },
    );
  }
}
