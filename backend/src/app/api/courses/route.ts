import { NextResponse } from "next/server";
import { z } from "zod";
import { courseStore } from "@/lib/db";

const studyMapSchema = z.object({
  studyMap: z.object({
    course: z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      createdAt: z.string().min(1)
    }),
    topics: z.array(z.any()),
    assignments: z.array(z.any()),
    resources: z.record(z.string(), z.array(z.any())),
    exams: z.array(z.any())
  })
});

export async function GET() {
  const data = await courseStore.list();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const payload = studyMapSchema.parse(await request.json());
    const record = await courseStore.saveCourse(payload.studyMap);
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Failed to save course", error);
    return NextResponse.json(
      {
        message: "Unable to save course planner.",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 400 }
    );
  }
}
