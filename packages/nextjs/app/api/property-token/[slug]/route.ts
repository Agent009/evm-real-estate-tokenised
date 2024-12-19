import { NextResponse } from "next/server";
import { checkAddress, checkNumber, checkParameters, gasPrices } from "~~/utils";
import {deployerAccount, getContractInstance} from "~~/utils/server";

const GLOBAL_MSG_PREFIX = `api -> POST property-token`;

// Catch-all handler
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  switch (slug) {
    case "mint":
      return await mint(req);
    case "burn":
      return await burn(req);
    case "transfer":
      return await transfer(req);
    case "approve":
      return await approve(req);
    // case "setApprovalForAll":
    //   return await setApprovalForAll(req);
    // case "safeTransferFrom":
    //   return await safeTransferFrom(req);
    default:
      return NextResponse.json({ message: `Invalid request (${slug}).` }, { status: 400 });
  }
}

type MintRequestPayload = {
  chainId: number;
  userAddress: string;
  mintAmount: number;
};
/**
 * Mint tokens
 * @param req
 */
const mint = async (req: Request) => {
  const MSG_PREFIX = `${GLOBAL_MSG_PREFIX} -> mint`;
  try {
    // Parse the request body
    const body = (await req.json()) as MintRequestPayload;
    const { chainId, userAddress, mintAmount } = body;
    const mintAmountStr = String(mintAmount);
    console.log(MSG_PREFIX, "-> chain", chainId, "userAddress", userAddress, "mintAmount", mintAmount);

    try {
      checkParameters([userAddress, mintAmountStr], 2, "You must provide the user address and the mint amount.");
      checkAddress("user", userAddress);
      checkNumber("mint amount", mintAmountStr);
    } catch (error) {
      console.error(MSG_PREFIX, "-> error", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "An unknown error occurred" },
        { status: 400 },
      );
    }

    // Get contract instance
    const { contract, publicClient } = await getContractInstance(
      MSG_PREFIX + "-> PropertyToken",
      "PropertyToken",
      chainId,
      deployerAccount,
    );

    // ===STEP=== Check minter role
    const minterRole = await contract.read.MINTER_ROLE();
    const isMinter = await contract.read.hasRole([minterRole, deployerAccount]);

    if (!isMinter) {
      return NextResponse.json({ error: "The caller does not have mint privileges." }, { status: 403 });
    }

    const mintTx = await contract.write.mint([userAddress, mintAmount]);
    const mintReceipt = await publicClient.waitForTransactionReceipt({ hash: mintTx });
    gasPrices(mintReceipt, MSG_PREFIX);
    console.log(`${MSG_PREFIX} -> mintTx`, mintReceipt.transactionHash);

    // Return success response
    return NextResponse.json(
      { message: `Minted ${mintAmount} tokens for ${userAddress}.`, data: { tx: mintReceipt.transactionHash } },
      { status: 200 },
    );
  } catch (error) {
    console.error(MSG_PREFIX, "Error minting tokens -> error", error);
    return NextResponse.json(
      { error: "Failed to mint tokens.", details: error instanceof Error ? error.message : "" },
      { status: 500 },
    );
  }
};

type BurnRequestPayload = {
  chainId: number;
  userAddress: string;
  burnAmount: number;
};

const burn = async (req: Request) => {
  const MSG_PREFIX = `${GLOBAL_MSG_PREFIX} -> burn`;
  try {
    const body = (await req.json()) as BurnRequestPayload;
    const { chainId, userAddress, burnAmount } = body;
    const burnAmountStr = String(burnAmount);
    console.log(MSG_PREFIX, "-> chain", chainId, "userAddress", userAddress, "burnAmount", burnAmount);

    try {
      checkParameters([userAddress, burnAmountStr], 2, "You must provide the user address and the burn amount.");
      checkAddress("user", userAddress);
      checkNumber("burn amount", burnAmountStr);
    } catch (error) {
      console.error(MSG_PREFIX, "-> error", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "An unknown error occurred" },
        { status: 400 },
      );
    }

    const { contract, publicClient } = await getContractInstance(
      MSG_PREFIX + "-> PropertyToken",
      "PropertyToken",
      chainId,
    );

    const burnTx = await contract.write.burnFrom([userAddress, burnAmount]);
    const burnReceipt = await publicClient.waitForTransactionReceipt({ hash: burnTx });
    gasPrices(burnReceipt, MSG_PREFIX);
    console.log(`${MSG_PREFIX} -> burnTx`, burnReceipt.transactionHash);

    return NextResponse.json(
      { message: `Burnt ${burnAmount} tokens from ${userAddress}.`, data: { tx: burnReceipt.transactionHash } },
      { status: 200 },
    );
  } catch (error) {
    console.error(MSG_PREFIX, "Error burning tokens -> error", error);
    return NextResponse.json(
      { error: "Failed to burn tokens.", details: error instanceof Error ? error.message : "" },
      { status: 500 },
    );
  }
};

type TransferRequestPayload = {
  chainId: number;
  fromAddress: string;
  toAddress: string;
  amount: number;
};

const transfer = async (req: Request) => {
  const MSG_PREFIX = `${GLOBAL_MSG_PREFIX} -> transfer`;
  try {
    const body = (await req.json()) as TransferRequestPayload;
    const { chainId, fromAddress, toAddress, amount } = body;
    const amountStr = String(amount);
    console.log(MSG_PREFIX, "-> chain", chainId, "fromAddress", fromAddress, "toAddress", toAddress, "amount", amount);

    try {
      checkParameters(
        [fromAddress, toAddress, amountStr],
        3,
        "You must provide the from address, to address, and the amount.",
      );
      checkAddress("from", fromAddress);
      checkAddress("to", toAddress);
      checkNumber("amount", amountStr);
    } catch (error) {
      console.error(MSG_PREFIX, "-> error", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "An unknown error occurred" },
        { status: 400 },
      );
    }

    const { contract, publicClient } = await getContractInstance(
      MSG_PREFIX + "-> PropertyToken",
      "PropertyToken",
      chainId,
    );

    const transferTx = await contract.write.transfer([toAddress, amount]);
    const transferReceipt = await publicClient.waitForTransactionReceipt({ hash: transferTx });
    gasPrices(transferReceipt, MSG_PREFIX);
    console.log(`${MSG_PREFIX} -> transferTx`, transferReceipt.transactionHash);

    return NextResponse.json(
      {
        message: `Transferred ${amount} tokens from ${fromAddress} to ${toAddress}.`,
        data: { tx: transferReceipt.transactionHash },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(MSG_PREFIX, "Error transferring tokens -> error", error);
    return NextResponse.json(
      { error: "Failed to transfer tokens.", details: error instanceof Error ? error.message : "" },
      { status: 500 },
    );
  }
};

// type SetApprovalForAllRequestPayload = {
//   chainId: number;
//   ownerAddress: string;
//   operatorAddress: string;
//   approved: boolean;
// };
//
// const setApprovalForAll = async (req: Request) => {
//   const MSG_PREFIX = `${GLOBAL_MSG_PREFIX} -> setApprovalForAll`;
//   try {
//     const body = (await req.json()) as SetApprovalForAllRequestPayload;
//     const { chainId, ownerAddress, operatorAddress, approved } = body;
//     console.log(
//       MSG_PREFIX,
//       "-> chain",
//       chainId,
//       "ownerAddress",
//       ownerAddress,
//       "operatorAddress",
//       operatorAddress,
//       "approved",
//       approved,
//     );
//
//     try {
//       checkParameters(
//         [ownerAddress, operatorAddress],
//         2,
//         "You must provide the owner address and the operator address.",
//       );
//       checkAddress("owner", ownerAddress);
//       checkAddress("operator", operatorAddress);
//     } catch (error) {
//       console.error(MSG_PREFIX, "-> error", error);
//       return NextResponse.json(
//         { error: error instanceof Error ? error.message : "An unknown error occurred" },
//         { status: 400 },
//       );
//     }
//
//     const { contract, publicClient } = await getContractInstance(
//       MSG_PREFIX + "-> PropertyToken",
//       "PropertyToken",
//       chainId,
//     );
//
//     const setApprovalForAllTx = await contract.write.setApprovalForAll([operatorAddress, approved]);
//     const setApprovalForAllReceipt = await publicClient.waitForTransactionReceipt({ hash: setApprovalForAllTx });
//     gasPrices(setApprovalForAllReceipt, MSG_PREFIX);
//     console.log(`${MSG_PREFIX} -> setApprovalForAllTx`, setApprovalForAllReceipt.transactionHash);
//
//     return NextResponse.json(
//       {
//         message: `Set approval for all: ${ownerAddress} ${approved ? "approved" : "revoked"} ${operatorAddress}.`,
//         data: { tx: setApprovalForAllReceipt.transactionHash },
//       },
//       { status: 200 },
//     );
//   } catch (error) {
//     console.error(MSG_PREFIX, "Error setting approval for all -> error", error);
//     return NextResponse.json(
//       { error: "Failed to set approval for all.", details: error instanceof Error ? error.message : "" },
//       { status: 500 },
//     );
//   }
// };

type ApproveRequestPayload = {
  chainId: number;
  ownerAddress: string;
  spenderAddress: string;
  amount: number;
};

const approve = async (req: Request) => {
  const MSG_PREFIX = `${GLOBAL_MSG_PREFIX} -> approve`;
  try {
    const body = (await req.json()) as ApproveRequestPayload;
    const { chainId, ownerAddress, spenderAddress, amount } = body;
    const amountStr = String(amount);
    console.log(
      MSG_PREFIX,
      "-> chain",
      chainId,
      "ownerAddress",
      ownerAddress,
      "spenderAddress",
      spenderAddress,
      "amount",
      amount,
    );

    try {
      checkParameters(
        [ownerAddress, spenderAddress, amountStr],
        3,
        "You must provide the owner address, spender address, and the amount.",
      );
      checkAddress("owner", ownerAddress);
      checkAddress("spender", spenderAddress);
      checkNumber("amount", amountStr);
    } catch (error) {
      console.error(MSG_PREFIX, "-> error", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "An unknown error occurred" },
        { status: 400 },
      );
    }

    const { contract, publicClient } = await getContractInstance(
      MSG_PREFIX + "-> PropertyToken",
      "PropertyToken",
      chainId,
    );

    const approveTx = await contract.write.approve([spenderAddress, amount]);
    const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveTx });
    gasPrices(approveReceipt, MSG_PREFIX);
    console.log(`${MSG_PREFIX} -> approveTx`, approveReceipt.transactionHash);

    return NextResponse.json(
      {
        message: `Approved ${spenderAddress} to spend ${amount} tokens from ${ownerAddress}.`,
        data: { tx: approveReceipt.transactionHash },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(MSG_PREFIX, "Error approving tokens -> error", error);
    return NextResponse.json(
      { error: "Failed to approve tokens.", details: error instanceof Error ? error.message : "" },
      { status: 500 },
    );
  }
};

// type SafeTransferFromRequestPayload = {
//   chainId: number;
//   fromAddress: string;
//   toAddress: string;
//   amount: number;
//   data?: string;
// };
//
// const safeTransferFrom = async (req: Request) => {
//   const MSG_PREFIX = `${GLOBAL_MSG_PREFIX} -> safeTransferFrom`;
//   try {
//     const body = (await req.json()) as SafeTransferFromRequestPayload;
//     const { chainId, fromAddress, toAddress, amount, data } = body;
//     const amountStr = String(amount);
//     console.log(
//       MSG_PREFIX,
//       "-> chain",
//       chainId,
//       "fromAddress",
//       fromAddress,
//       "toAddress",
//       toAddress,
//       "amount",
//       amount,
//       "data",
//       data,
//     );
//
//     try {
//       checkParameters(
//         [fromAddress, toAddress, amountStr],
//         3,
//         "You must provide the from address, to address, and the amount.",
//       );
//       checkAddress("from", fromAddress);
//       checkAddress("to", toAddress);
//       checkNumber("amount", amountStr);
//     } catch (error) {
//       console.error(MSG_PREFIX, "-> error", error);
//       return NextResponse.json(
//         { error: error instanceof Error ? error.message : "An unknown error occurred" },
//         { status: 400 },
//       );
//     }
//
//     const { contract, publicClient } = await getContractInstance(
//       MSG_PREFIX + "-> PropertyToken",
//       "PropertyToken",
//       chainId,
//     );
//
//     const safeTransferFromTx = await contract.write.safeTransferFrom([fromAddress, toAddress, amount, data || "0x"]);
//     const safeTransferFromReceipt = await publicClient.waitForTransactionReceipt({ hash: safeTransferFromTx });
//     gasPrices(safeTransferFromReceipt, MSG_PREFIX);
//     console.log(`${MSG_PREFIX} -> safeTransferFromTx`, safeTransferFromReceipt.transactionHash);
//
//     return NextResponse.json(
//       {
//         message: `Safely transferred ${amount} tokens from ${fromAddress} to ${toAddress}.`,
//         data: { tx: safeTransferFromReceipt.transactionHash },
//       },
//       { status: 200 },
//     );
//   } catch (error) {
//     console.error(MSG_PREFIX, "Error safely transferring tokens -> error", error);
//     return NextResponse.json(
//       { error: "Failed to safely transfer tokens.", details: error instanceof Error ? error.message : "" },
//       { status: 500 },
//     );
//   }
// };
