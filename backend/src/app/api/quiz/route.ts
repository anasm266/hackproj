import { NextResponse } from "next/server";
import { z } from "zod";
import { claudeService } from "@/lib/claude";

const quizSchema = z.object({
  courseId: z.string().min(1),
  topics: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        microTopics: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            description: z.string(),
            examScopeIds: z.array(z.string())
          })
        )
      })
    )
    .min(1),
  difficulty: z.enum(["auto", "intro", "exam"]),
  length: z.number().min(1).max(20),
  questionType: z.enum(["mcq", "short", "mix"])
});

export async function POST(request: Request) {
  try {
    console.log("=== Quiz generation request received ===");
    const body = await request.json();
    console.log("Request body:", JSON.stringify(body, null, 2));
    
    const payload = quizSchema.parse(body);
    console.log("Payload validated, generating quiz with Claude...");
    
    const quiz = await claudeService.generateQuiz(payload);
    console.log("Quiz generated successfully:", {
      quizId: quiz.quizId,
      questionCount: quiz.questions.length
    });
    
    return NextResponse.json(quiz);
  } catch (error) {
    console.error("=== Quiz generation failed ===");
    console.error("Error:", error);
    return NextResponse.json(
      {
        message: "Unable to generate quiz right now.",
        error: error instanceof Error ? error.message : "Unexpected error."
      },
      { status: 400 }
    );
  }
}
