import { NextResponse } from "next/server";
import { parseSyllabusPayload } from "@/lib/syllabus";

export const runtime = "nodejs";
export const maxDuration = 60; // Allow up to 60 seconds for Claude API

export async function POST(request: Request) {
  try {
    const payload = await parseSyllabusPayload(request);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Failed to parse syllabus", error);
    return NextResponse.json(
      {
        message: "Unable to parse syllabus. Please try again.",
        error:
          error instanceof Error
            ? error.message
            : "Unknown error while parsing the upload."
      },
      { status: 400 }
    );
  }
}
