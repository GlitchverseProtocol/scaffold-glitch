import { NextRequest, NextResponse } from "next/server";
import deployedContracts from "../../../../contracts/deployedContracts";
import cors from "../../../../lib/cors";
import { createPublicClient, http } from "viem";
import { hardhat, sepolia } from "viem/chains";

export const runtime = "edge";

// Helper function to create a client
function createClient(network: string | undefined, sepoliaRpcUrl?: string) {
  return createPublicClient({
    chain: network === "0x7a69" ? hardhat : sepolia,
    cacheTime: 0,
    transport:
      network === "0x7a69" && hardhat ? http("http://127.0.0.1:8545") : sepoliaRpcUrl ? http(sepoliaRpcUrl) : http(),
  });
}

interface ITokenData {
  contract: string;
  dataType: string;
  data: string;
  isPrimary?: boolean;
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.pathname.split("/");
  console.log({ params });
  const primaryContract = params[3]; // token
  // Ethereum addresses start with 0x followed by 40 hexadecimal characters
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;

  if (primaryContract && !ethAddressRegex.test(primaryContract)) {
    throw new Error("Invalid primary contract address");
  }
  const network = process.env.NETWORK;
  const baseUrl = process.env.BASE_URL;
  const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL;
  let registryAddress = process.env.REGISTRY_ADDRESS;

  console.log({ network, baseUrl, sepoliaRpcUrl, registryAddress });
  if (!network) console.warn("Missing network");
  if (!baseUrl) console.warn("Missing base url");
  if (!sepoliaRpcUrl) console.warn("Missing sepolia rpc url");

  const client = createClient(network, sepoliaRpcUrl);
  const deployedFactory = deployedContracts["31337"]["GlitchProtocolFactory"];

  if (network === "0x7a69") {
    registryAddress = deployedFactory.address;
  }

  if (!registryAddress) throw new Error("Missing registry address");

  const abi = deployedFactory.abi;

  const blockNumber = await client.getBlockNumber();
  console.log(`Block number: ${blockNumber}`);

  const tokenCount = (await client.readContract({
    address: registryAddress as `0x${string}`,
    abi,
    functionName: "tokenCount",
  })) as bigint;
  console.log(`Token count: ${tokenCount}`);

  const tokenData: ITokenData[] = [];

  for (let i = 0; i < parseInt(tokenCount.toString()); i++) {
    const token = (await client.readContract({
      address: registryAddress as `0x${string}`,
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

  if (tokenData.length > 0) {
    for (let i = 0; i < tokenData.length; i++) {
      if (tokenData[i].contract.toLowerCase() === primaryContract?.toLowerCase()) {
        tokenData[i].isPrimary = true;
        break;
      }
    }
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
            <script type="module" src="${baseUrl}/api/scripts"></script>
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
