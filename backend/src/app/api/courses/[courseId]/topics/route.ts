import { NextResponse } from "next/server";
import { z } from "zod";
import { courseStore } from "@/lib/db";

const payloadSchema = z.object({
  topics: z.array(z.any())
});

export async function PATCH(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { topics } = payloadSchema.parse(await request.json());
    const record = await courseStore.replaceTopics(params.courseId, topics);
    return NextResponse.json(record);
  } catch (error) {
    console.error("Failed to update topics", error);
    return NextResponse.json(
      {
        message: "Unable to update topics.",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 400 }
    );
  }
}
