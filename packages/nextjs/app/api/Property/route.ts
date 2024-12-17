import Property from "@contracts/Property.json";
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("YOUR_INFURA_OR_ALCHEMY_URL");
const contractAddress = "YOUR_CONTRACT_ADDRESS";
const abi: any[] = Property.abi;

export async function POST(req: Request) {
  if (req.method === "POST") {
    const body = await req.json();
    console.log("Received JSON data:", body);

    try {
      const contract = new ethers.Contract(contractAddress, abi, provider);
      const data = await contract.YOUR_CONTRACT_METHOD(...body.params); // Replace with your contract method and parameters

      return new Response(JSON.stringify(data), { status: 200 });
    } catch (error) {
      console.error("Error interacting with the contract:", error);
      return new Response("Error interacting with the contract", { status: 500 });
    }
  } else {
    return new Response("Invalid request method", { status: 405 });
  }
}
