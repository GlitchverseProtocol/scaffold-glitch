import { NextRequest, NextResponse } from "next/server";
import cors from "../../../lib/cors";
import TokenData from "../../../test-data/token-data.json";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const tokenDataString = JSON.stringify(TokenData);

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
