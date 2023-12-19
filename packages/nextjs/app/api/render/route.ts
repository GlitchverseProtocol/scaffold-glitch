import { NextRequest, NextResponse } from "next/server";
import deployedContracts from "../../../contracts/deployedContracts";
import cors from "../../../lib/cors";
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

interface ITokenData {
  contract: string;
  dataType: string;
  data: string;
}

export async function GET(req: NextRequest) {
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

  const tokenData: ITokenData[] = [];

  for (let i = 0; i < parseInt(tokenCount.toString()); i++) {
    const token = (await client.readContract({
      address: deployedFactory.address,
      abi,
      functionName: "registeredTokens",
      args: [BigInt(i)],
    })) as `0x${string}`;
    console.log(`Token ${i}: ${token}`);
    const tokenDataType = (await client.readContract({
      address: token,
      abi: deployedContracts["31337"]["GlitchProtocolToken"].abi,
      functionName: "dataType",
    })) as string;
    const stream = (await client.readContract({
      address: token,
      abi: deployedContracts["31337"]["GlitchProtocolToken"].abi,
      functionName: "stream",
    })) as string;
    tokenData.push({
      contract: token,
      dataType: tokenDataType,
      data: stream,
    });
  }

  const tokenDataString = JSON.stringify(tokenData);

  try {
    // Define your HTML content
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/0.6.0/p5.js"></script>
        <script>
            let tokenData = ${tokenDataString};

        </script>
        </head>
            <body>
            <div id="container"></div>
            <script type="importmap">
            {
                "imports": {
                "three": "https://unpkg.com/three@0.159.0/build/three.module.js",
                "three/addons/": "https://unpkg.com/three@0.159.0/examples/jsm/"
                }
            }
            </script>
            <script type="module" src="http://127.0.0.1:3000/api/scripts"></script>
            </body>
        </html>
      `;

    return cors(
      req,
      new NextResponse(htmlContent, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }),
    );
  } catch (error) {
    const err = error as Error;
    return new NextResponse(err.message, { status: 404 });
  }
}
