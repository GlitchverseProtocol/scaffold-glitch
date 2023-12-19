import { NextRequest, NextResponse } from "next/server";
// import { list } from '@vercel/blob'
// import { createPublicClient, http, parseAbi } from 'viem'
// import { mainnet, goerli } from 'viem/chains'
import cors from "../../../lib/cors";
import RenderScripts from "../../../test-data/render-scripts.json";

export const runtime = "edge";

// Helper function to create a client
// function createClient(network: string | undefined, mainnetRpcUrl: string | undefined, goerliRpcUrl: string | undefined) {
//     return createPublicClient({
//         chain: network === '0x1' ? mainnet : goerli,
//         transport: network === '0x1' && mainnetRpcUrl ? http(mainnetRpcUrl) : goerliRpcUrl ? http(goerliRpcUrl) : http(),
//     })
// }

// Helper function to validate the filename
// function isValidFilename(filename: string | null): boolean {
//     if (filename === 'demo') return true
//     const fileNumber = filename ? parseInt(filename, 10) : NaN
//     return !isNaN(fileNumber) && fileNumber >= 455000000 && fileNumber <= 455000399
// }

export async function GET(req: NextRequest) {
  // const forceRender = process.env.FORCE_RENDER === 'true' ?? false
  // const network = process.env.NETWORK
  // const collectionAddress = process.env.HUMAN_UNREADABLE_V2_ADDRESS as `0x${string}` | undefined
  // const mainnetRpcUrl = process.env.MAINNET_RPC_URL
  // const goerliRpcUrl = process.env.GOERLI_RPC_URL

  // console.log({ forceRender, network, collectionAddress, mainnetRpcUrl, goerliRpcUrl })
  // if (!network) console.warn('Missing network')
  // if (!collectionAddress) console.warn('Missing collection address')
  // if (!mainnetRpcUrl) console.warn('Missing mainnet RPC URL')
  // if (!goerliRpcUrl) console.warn('Missing goerli RPC URL')

  // let filename = req.nextUrl.searchParams.get('filename')
  // if (filename && filename.endsWith('.svg')) {
  //     filename = filename.split('.svg')[0]
  // }

  // if (!isValidFilename(filename)) {
  //     return new NextResponse('Invalid filename', { status: 400 })
  // }

  // const client = createClient(network, mainnetRpcUrl, goerliRpcUrl)

  try {
    const fileContent = RenderScripts.three;
    return cors(
      req,
      new NextResponse(fileContent, {
        status: 200,
        headers: { "Content-Type": "application/javascript; charset=utf-8" },
      }),
    );
  } catch (error) {
    const err = error as Error;
    return new NextResponse(err.message, { status: 404 });
  }
}
