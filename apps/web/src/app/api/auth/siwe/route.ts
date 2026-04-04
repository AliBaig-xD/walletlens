import { NextRequest, NextResponse } from "next/server";
import { ENDPOINTS } from "@/lib/api/endpoints";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address");
    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 },
      );
    }

    const response = await fetch(`${API_URL}${ENDPOINTS.auth.nonce(address)}`);
    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    const nonce = data?.data?.nonce;
    if (!nonce) {
      throw new Error("Nonce missing in backend response");
    }

    return new NextResponse(nonce, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("Error fetching nonce:", error);
    return NextResponse.json(
      { error: "Failed to fetch nonce" },
      { status: 500 },
    );
  }
}
