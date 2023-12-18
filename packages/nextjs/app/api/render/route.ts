import { NextRequest, NextResponse } from "next/server";
import cors from "../../../lib/cors";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    // Define your HTML content
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/0.6.0/p5.js"></script>
            <script src="http://127.0.0.1:3000/api/scripts"></script>
        </head>
            <body>
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
