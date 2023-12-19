import { NextRequest, NextResponse } from "next/server";
import cors from "../../../lib/cors";
import RenderScripts from "../../../test-data/render-scripts.json";

export const runtime = "edge";

export async function GET(req: NextRequest) {
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
