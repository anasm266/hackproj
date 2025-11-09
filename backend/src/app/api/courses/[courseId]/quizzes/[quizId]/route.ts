import { NextRequest, NextResponse } from "next/server";
import { courseStore } from "../../../../../../lib/db";

export const maxDuration = 10;

/**
 * DELETE /api/courses/:courseId/quizzes/:quizId
 * Delete a quiz from history
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string; quizId: string } }
) {
  try {
    const { courseId, quizId } = params;

    console.log("Deleting quiz:", quizId, "from course:", courseId);

    const updated = await courseStore.deleteQuiz(courseId, quizId);

    return NextResponse.json({
      success: true,
      course: updated
    });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete quiz"
      },
      { status: 500 }
    );
  }
}
