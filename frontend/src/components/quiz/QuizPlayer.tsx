import { useMemo, useState } from "react";
import type { QuizQuestion, QuizResponsePayload } from "@studymap/types";

type QuizPlayerProps = {
  quiz: QuizResponsePayload;
  courseId?: string;
  difficulty?: "auto" | "intro" | "exam";
  topicIds?: string[];
  topicTitles?: string[];
  onReviewWeakSpots?: (microTopicIds: string[]) => void;
  onSaveResult?: (score: number, totalQuestions: number, weakTopicIds: string[]) => void;
};

const QuizPlayer = ({ quiz, courseId, difficulty, topicIds, topicTitles, onReviewWeakSpots, onSaveResult }: QuizPlayerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const currentQuestion = quiz.questions[currentIndex];

  const answeredCorrectly = useMemo(() => {
    return quiz.questions.filter((question) => {
      if (question.type === "mcq") {
        const answerId = responses[question.id];
        const correctChoice = question.choices?.find((choice) => choice.correct);
        return answerId && correctChoice && answerId === correctChoice.id;
      }
      return revealed[question.id];
    }).length;
  }, [quiz.questions, responses, revealed]);

  const handleChoiceSelection = (question: QuizQuestion, choiceId: string) => {
    if (revealed[question.id]) return;
    setResponses((prev) => ({ ...prev, [question.id]: choiceId }));
    setRevealed((prev) => ({ ...prev, [question.id]: true }));
  };

  const handleReveal = (questionId: string) => {
    setRevealed((prev) => ({ ...prev, [questionId]: true }));
  };

  const handleReview = () => {
    console.log("=== Quiz Review Button Clicked ===");
    console.log("onReviewWeakSpots function exists:", !!onReviewWeakSpots);
    
    if (!onReviewWeakSpots) {
      console.warn("No onReviewWeakSpots handler provided");
      return;
    }
    
    const weakMicroTopics = quiz.questions
      .filter((question) => {
        if (question.type === "mcq") {
          const choiceId = responses[question.id];
          const correct = question.choices?.find((choice) => choice.correct)?.id;
          const gotItWrong = !choiceId || choiceId !== correct;
          console.log(`Q: ${question.id}, answered: ${choiceId}, correct: ${correct}, wrong: ${gotItWrong}`);
          return gotItWrong;
        }
        return !revealed[question.id];
      })
      .flatMap((question) => question.relatedMicroTopicIds);
    
    const uniqueWeakTopics = Array.from(new Set(weakMicroTopics));
    console.log("Weak micro topics found:", uniqueWeakTopics);
    
    onReviewWeakSpots(uniqueWeakTopics);
  };

  const handleSubmitQuiz = () => {
    if (onSaveResult && !hasSubmitted) {
      console.log("=== Submit Quiz - Computing Weak Topics ===");
      console.log("Total questions:", quiz.questions.length);
      
      // First, let's check if questions even have topicId
      quiz.questions.forEach((q, idx) => {
        console.log(`Question ${idx + 1}:`, {
          id: q.id,
          hasTopicId: !!q.topicId,
          topicId: q.topicId,
          type: q.type
        });
      });
      
      // Compute weak topics from incorrectly answered questions
      const weakTopics = quiz.questions
        .filter((question) => {
          if (question.type === "mcq") {
            const selectedChoiceId = responses[question.id];
            const correctChoice = question.choices?.find((choice) => choice.correct);
            const isWrong = !selectedChoiceId || selectedChoiceId !== correctChoice?.id;
            
            console.log(`Q: ${question.id}`, {
              selectedChoiceId,
              correctChoiceId: correctChoice?.id,
              isWrong,
              topicId: question.topicId,
              hasTopicId: !!question.topicId
            });
            
            return isWrong;
          }
          return !revealed[question.id];
        })
        .map((question) => {
          console.log("Mapping question to topicId:", question.id, "->", question.topicId);
          return question.topicId;
        })
        .filter((topicId): topicId is string => {
          const isValid = !!topicId;
          console.log("Filtering topicId:", topicId, "isValid:", isValid);
          return isValid;
        });
      
      const uniqueWeakTopics = Array.from(new Set(weakTopics));
      
      console.log("=== FINAL RESULTS ===");
      console.log("All weak topicIds (with duplicates):", weakTopics);
      console.log("Unique weak topic IDs:", uniqueWeakTopics);
      console.log("Total correct:", answeredCorrectly, "out of", quiz.questions.length);
      
      onSaveResult(answeredCorrectly, quiz.questions.length, uniqueWeakTopics);
      setHasSubmitted(true);
    }
  };

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-blue-500">Quiz Player</p>
          <p className="text-sm text-slate-500">
            Question {currentIndex + 1} / {quiz.questions.length}
          </p>
        </div>
        <div className="text-sm font-semibold text-slate-700">
          Score: {answeredCorrectly}/{quiz.questions.length}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
        <p className="text-sm font-semibold text-slate-800">{currentQuestion.prompt}</p>
        {currentQuestion.type === "mcq" && (
          <>
            <div className="mt-4 space-y-2">
              {currentQuestion.choices?.map((choice) => {
                const isSelected = responses[currentQuestion.id] === choice.id;
                const isCorrect = choice.correct;
                const showState = revealed[currentQuestion.id];
                return (
                  <button
                    key={choice.id}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm ${
                      showState
                        ? isCorrect
                          ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                          : isSelected
                            ? "border-rose-300 bg-rose-50 text-rose-800"
                            : "border-slate-200 bg-white text-slate-600"
                        : isSelected
                          ? "border-blue-500 bg-blue-50 text-blue-900"
                          : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                    onClick={() => handleChoiceSelection(currentQuestion, choice.id)}
                    disabled={showState}
                  >
                    <span>{choice.label}</span>
                    {showState && isCorrect && <span className="text-xs font-semibold">✓ Correct</span>}
                    {showState && !isCorrect && isSelected && <span className="text-xs font-semibold">✗ Wrong</span>}
                  </button>
                );
              })}
            </div>
            {!revealed[currentQuestion.id] && (
              <button
                className="mt-3 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                onClick={() => handleReveal(currentQuestion.id)}
              >
                Reveal answer
              </button>
            )}
          </>
        )}

        {currentQuestion.type !== "mcq" && (
          <div className="mt-4 space-y-3">
            {!revealed[currentQuestion.id] ? (
              <button
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
                onClick={() => handleReveal(currentQuestion.id)}
              >
                Reveal answer
              </button>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <p className="font-semibold">Answer</p>
                <p>{currentQuestion.answer}</p>
              </div>
            )}
          </div>
        )}

        {revealed[currentQuestion.id] && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">Explanation</p>
            <p>{currentQuestion.explanation}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 disabled:opacity-40"
          onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
          disabled={currentIndex === 0}
        >
          Previous
        </button>
        <button
          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
          onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, quiz.questions.length - 1))}
          disabled={currentIndex === quiz.questions.length - 1}
        >
          Next
        </button>
        {onSaveResult && (
          <button
            className={`rounded-full px-4 py-2 text-xs font-semibold ${
              hasSubmitted
                ? "border border-emerald-500 bg-emerald-50 text-emerald-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
            onClick={handleSubmitQuiz}
            disabled={hasSubmitted}
          >
            {hasSubmitted ? "✓ Submitted" : "Submit Quiz"}
          </button>
        )}
        <button
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
          onClick={handleReview}
        >
          Review weak spots
        </button>
      </div>
    </div>
  );
};

export default QuizPlayer;
