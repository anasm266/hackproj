import { NextRequest, NextResponse } from "next/server";
import { courseStore, type QuizResult } from "../../../../../lib/db";

export const maxDuration = 10;

/**
 * POST /api/courses/:courseId/quiz-results
 * Save a quiz result
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;
    const result = (await request.json()) as QuizResult;

    console.log("Saving quiz result for course:", courseId);

    const updated = await courseStore.saveQuizResult(courseId, result);

    return NextResponse.json({
      success: true,
      course: updated
    });
  } catch (error) {
    console.error("Error saving quiz result:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save quiz result"
      },
      { status: 500 }
    );
  }
}
