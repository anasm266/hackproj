import { NextResponse } from "next/server";
import { courseStore } from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;
    
    if (!courseId) {
      return NextResponse.json(
        { message: "Course ID is required" },
        { status: 400 }
      );
    }

    const success = await courseStore.deleteCourse(courseId);
    
    if (!success) {
      return NextResponse.json(
        { message: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete course", error);
    return NextResponse.json(
      {
        message: "Unable to delete course",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
