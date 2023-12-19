import { NextRequest, NextResponse } from "next/server";
import deployedContracts from "../../../../../contracts/deployedContracts";
import cors from "../../../../../lib/cors";
import { createPublicClient, http } from "viem";
import { hardhat } from "viem/chains";

export const runtime = "edge";

// Helper function to create a client
function createClient(network: string | undefined) {
  if (network !== "0x7a69") throw new Error("Must be on hardhat");
  return createPublicClient({
    chain: hardhat,
    cacheTime: 0,
    transport: http("http://127.0.0.1:8545"),
  });
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.pathname.split("/");
  console.log({ params });
  const primaryContract = params[3]; // token
  const tokenId = params[4]; // token
  // Ethereum addresses start with 0x followed by 40 hexadecimal characters
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;

  if (!primaryContract || !ethAddressRegex.test(primaryContract)) {
    throw new Error("Invalid primary contract address");
  }
  const network = process.env.NETWORK;
  //   const factoryAddress = process.env[`GLITCH_FACTORY_${network}`] as `0x${string}` | undefined;

  console.log({ network });
  if (!network) console.warn("Missing network");
  //   if (!factoryAddress) console.warn("Missing collection address");

  const client = createClient(network);
  const deployedFactory = deployedContracts["31337"]["GlitchProtocolFactory"];

  const abi = deployedFactory.abi;

  const blockNumber = await client.getBlockNumber();
  console.log(`Block number: ${blockNumber}`);

  const tokenCount = (await client.readContract({
    address: deployedFactory.address,
    abi,
    functionName: "tokenCount",
  })) as bigint;
  console.log(`Token count: ${tokenCount}`);

  try {
    // Define your HTML content
    const tokenJson = {
      description: "Glitch Protocol Token",
      image: "https://logos.mypinata.cloud/ipfs/QmPPjqJErig5X1uXVSTtiZcb81Hw1qn19T46yGEzdin5yE",
      animation_url: `http://127.0.0.1:3000/api/render/${primaryContract}`,
      name: `Glitch Token ${tokenId}`,
      attributes: [
        {
          display_type: "number",
          trait_type: "Connected Tokens",
          value: parseInt(tokenCount.toString()),
        },
      ],
    };

    return cors(
      req,
      new NextResponse(JSON.stringify(tokenJson), {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }),
    );
  } catch (error) {
    const err = error as Error;
    return new NextResponse(err.message, { status: 404 });
  }
}
