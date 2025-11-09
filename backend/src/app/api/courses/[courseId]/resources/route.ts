import { NextRequest, NextResponse } from "next/server";
import { courseStore } from "../../../../../lib/db";
import type { ResourceItem, Topic, SubTopic } from "@studymap/types";

export const maxDuration = 10; // 10 seconds timeout

/**
 * POST /api/courses/:courseId/resources
 * Add a resource to a specific topic in a course
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;
    const body = await request.json();
    const { topicId, resource } = body as {
      topicId: string;
      resource: Omit<ResourceItem, "id"> & { id?: string };
    };

    // Validate input
    if (!courseId || typeof courseId !== "string") {
      return NextResponse.json(
        { success: false, error: "Course ID is required" },
        { status: 400 }
      );
    }

    if (!topicId || typeof topicId !== "string") {
      return NextResponse.json(
        { success: false, error: "Topic ID is required" },
        { status: 400 }
      );
    }

    if (!resource || typeof resource !== "object") {
      return NextResponse.json(
        { success: false, error: "Resource data is required" },
        { status: 400 }
      );
    }

    // Validate required resource fields
    if (!resource.title || !resource.url || !resource.summary || !resource.type) {
      return NextResponse.json(
        {
          success: false,
          error: "Resource must have title, url, summary, and type"
        },
        { status: 400 }
      );
    }

    // Get the course database
    const db = await courseStore.list();
    const course = db.courses[courseId];
    
    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    // Verify topic exists
    const topicExists = course.studyMap.topics.some(
      (t: Topic) => t.id === topicId || 
            t.subTopics.some((st: SubTopic) => st.id === topicId) ||
            t.subTopics.some((st: SubTopic) => st.microTopics.some((mt) => mt.id === topicId))
    );

    if (!topicExists) {
      return NextResponse.json(
        { success: false, error: "Topic not found in course" },
        { status: 404 }
      );
    }

    // Create the resource with ID and timestamp
    const newResource: ResourceItem = {
      id: resource.id || `resource-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: resource.title,
      url: resource.url,
      summary: resource.summary,
      type: resource.type,
      duration: resource.duration,
      thumbnail: resource.thumbnail,
      aiGenerated: resource.aiGenerated,
      aiSearchQuery: resource.aiSearchQuery,
      aiQuality: resource.aiQuality,
      addedAt: resource.addedAt || new Date().toISOString()
    };

    // Add resource to topic's resources array
    if (!course.studyMap.resources[topicId]) {
      course.studyMap.resources[topicId] = [];
    }
    
    course.studyMap.resources[topicId].push(newResource);

    // Update the course in the database
    course.lastUpdated = new Date().toISOString();
    db.courses[courseId] = course;
    
    // Write updated database
    const fs = await import("fs/promises");
    const path = await import("path");
    const dbPath = path.join(process.cwd(), "storage", "studymap.json");
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      resource: newResource,
      message: "Resource added successfully"
    });
  } catch (error) {
    console.error("Error adding resource:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to add resource",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
