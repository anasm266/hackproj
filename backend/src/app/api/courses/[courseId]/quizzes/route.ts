import { NextResponse } from "next/server";
import { z } from "zod";
import { courseStore } from "@/lib/db";

const quizSchema = z.object({
  quiz: z.object({
    quizId: z.string().min(1),
    generatedAt: z.string().min(1),
    questions: z.array(z.any())
  })
});

export async function POST(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { quiz } = quizSchema.parse(await request.json());
    const record = await courseStore.recordQuiz(params.courseId, quiz);
    return NextResponse.json(record);
  } catch (error) {
    console.error("Failed to store quiz", error);
    return NextResponse.json(
      {
        message: "Unable to store quiz history.",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 400 }
    );
  }
}
