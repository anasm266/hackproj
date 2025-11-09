import { NextRequest, NextResponse } from "next/server";
import { courseStore } from "../../../../../../lib/db";

export const maxDuration = 10;

/**
 * DELETE /api/courses/:courseId/quiz-results/:resultId
 * Delete a quiz result
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string; resultId: string } }
) {
  try {
    const { courseId, resultId } = params;

    console.log("Deleting quiz result:", resultId, "from course:", courseId);

    const updated = await courseStore.deleteQuizResult(courseId, resultId);

    return NextResponse.json({
      success: true,
      course: updated
    });
  } catch (error) {
    console.error("Error deleting quiz result:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete quiz result"
      },
      { status: 500 }
    );
  }
}
