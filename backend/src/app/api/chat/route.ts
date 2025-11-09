import { NextResponse } from "next/server";
import { z } from "zod";
import { claudeService } from "@/lib/claude";
import type { ChatMessage } from "@studymap/types";

const chatRequestSchema = z.object({
  courseId: z.string().min(1),
  conversationId: z.string().optional(),
  message: z.string().min(1),
  conversationHistory: z.array(
    z.object({
      id: z.string(),
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
      timestamp: z.string(),
      topicContext: z
        .object({
          topicId: z.string(),
          topicTitle: z.string(),
          level: z.enum(["topic", "subtopic", "microtopic"])
        })
        .optional(),
      metadata: z.any().optional()
    })
  ),
  context: z.object({
    courseId: z.string(),
    courseName: z.string(),
    topics: z.array(z.any()),
    completedMicroTopicIds: z.array(z.string()),
    upcomingDeadlines: z.array(z.any()),
    quizHistory: z
      .object({
        weakTopicIds: z.array(z.string()),
        recentScores: z.array(z.number())
      })
      .optional(),
    syllabusText: z.string().optional()
  }),
  topicContext: z
    .object({
      topicId: z.string(),
      topicTitle: z.string(),
      level: z.enum(["topic", "subtopic", "microtopic"])
    })
    .optional(),
  stream: z.boolean().optional()
});

export async function POST(request: Request) {
  try {
    console.log("=== Chat request received ===");
    const body = await request.json();
    console.log("Message:", body.message?.substring(0, 100));
    console.log("Stream requested:", body.stream);

    const payload = chatRequestSchema.parse(body);

    // Add the user's message to the conversation history
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: payload.message,
      timestamp: new Date().toISOString(),
      topicContext: payload.topicContext
    };

    const conversationHistory = [...payload.conversationHistory, userMessage];

    console.log("Conversation history length:", conversationHistory.length);

    // Check if streaming is requested
    if (payload.stream) {
      console.log("Using streaming response");

      // Create a ReadableStream for streaming responses
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const chatStream = claudeService.chatStream({
              conversationHistory,
              context: payload.context,
              topicContext: payload.topicContext
            });

            for await (const chunk of chatStream) {
              const data = JSON.stringify({ chunk }) + "\n";
              controller.enqueue(encoder.encode(data));
            }

            // Send a final message with conversation ID
            const finalData = JSON.stringify({
              done: true,
              conversationId: payload.conversationId || `conv-${Date.now()}`
            }) + "\n";
            controller.enqueue(encoder.encode(finalData));

            controller.close();
          } catch (error) {
            console.error("Stream error:", error);
            const errorData = JSON.stringify({
              error: error instanceof Error ? error.message : "Stream failed"
            }) + "\n";
            controller.enqueue(encoder.encode(errorData));
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        }
      });
    }

    // Non-streaming response
    console.log("Using regular response");
    const response = await claudeService.chat({
      conversationHistory,
      context: payload.context,
      topicContext: payload.topicContext
    });

    const assistantMessage: ChatMessage = {
      id: `msg-${Date.now()}-assistant`,
      role: "assistant",
      content: response.content,
      timestamp: new Date().toISOString(),
      metadata: {
        suggestedActions: response.suggestedActions
      }
    };

    console.log("Chat response generated successfully");
    console.log("Response length:", response.content.length);
    console.log("Suggested actions:", response.suggestedActions?.length || 0);

    return NextResponse.json({
      conversationId: payload.conversationId || `conv-${Date.now()}`,
      message: assistantMessage,
      suggestedActions: response.suggestedActions
    });
  } catch (error) {
    console.error("=== Chat request failed ===");
    console.error("Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Invalid request format",
          error: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: "Unable to process chat request",
        error: error instanceof Error ? error.message : "Unexpected error"
      },
      { status: 500 }
    );
  }
}
