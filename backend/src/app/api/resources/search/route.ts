import { NextRequest, NextResponse } from "next/server";
import { claudeService } from "@/lib/claude";

export const maxDuration = 60; // 60 seconds timeout for web search

export async function POST(request: NextRequest) {
  console.log("=== Resource search request received ===");
  
  try {
    const body = await request.json();
    console.log("Request body:", JSON.stringify(body, null, 2));

    // Validate request
    const { courseTitle, topicTitle, topicDescription, resourceType, maxResults } = body;

    if (!courseTitle || typeof courseTitle !== "string") {
      return NextResponse.json(
        { error: "courseTitle is required and must be a string" },
        { status: 400 }
      );
    }

    if (!topicTitle || typeof topicTitle !== "string") {
      return NextResponse.json(
        { error: "topicTitle is required and must be a string" },
        { status: 400 }
      );
    }

    if (!resourceType || !["learn", "practice", "both"].includes(resourceType)) {
      return NextResponse.json(
        { error: "resourceType must be 'learn', 'practice', or 'both'" },
        { status: 400 }
      );
    }

    console.log("Payload validated, searching for resources with Claude...");

    // Call Claude service to find resources
    const result = await claudeService.findResources({
      courseTitle,
      topicTitle,
      topicDescription,
      resourceType,
      maxResults: maxResults || 10
    });

    console.log("Resources found:", result.resources.length);
    console.log("Search quality:", result.searchQuality);

    // Return success response
    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error("Error searching for resources:", error);
    
    return NextResponse.json(
      {
        error: "Failed to search for resources",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
