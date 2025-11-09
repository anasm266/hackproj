import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import type { QuizResponsePayload, Topic } from "@studymap/types";
import QuizPlayer from "../components/quiz/QuizPlayer";
import WeakSpotPanel from "../components/study/WeakSpotPanel";
import ChatInterface from "../components/chat/ChatInterface";
import { studyApi } from "../lib/api";
import { useStudyPlanStore, type QuizResult } from "../store/useStudyPlanStore";

const QuizCenterPage = () => {
  const { courseId } = useParams();
  const course = useStudyPlanStore((state) =>
    courseId ? state.courses[courseId] : undefined
  );
  const upsertQuiz = useStudyPlanStore((state) => state.upsertQuiz);
  const saveQuizResult = useStudyPlanStore((state) => state.saveQuizResult);
  const deleteQuizResult = useStudyPlanStore((state) => state.deleteQuizResult);
  const deleteQuiz = useStudyPlanStore((state) => state.deleteQuiz);
  const addResource = useStudyPlanStore((state) => state.addResource);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<"auto" | "intro" | "exam">("auto");
  const [length, setLength] = useState(5);
  const [questionType] = useState<"mcq">("mcq"); // Only MCQ supported
  const [activeQuiz, setActiveQuiz] = useState<QuizResponsePayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteQuizConfirm, setDeleteQuizConfirm] = useState<string | null>(null);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [expandedQuizIds, setExpandedQuizIds] = useState<Set<string>>(new Set());
  const [showWeakSpotPanel, setShowWeakSpotPanel] = useState(false);
  const [selectedWeakTopic, setSelectedWeakTopic] = useState<Topic | null>(null);
  const [showWeakSpotsList, setShowWeakSpotsList] = useState(false);
  const [currentWeakTopicIds, setCurrentWeakTopicIds] = useState<string[]>([]);
  const [showChatOverlay, setShowChatOverlay] = useState(false);

  useEffect(() => {
    if (course?.quizHistory?.[0]) {
      setActiveQuiz(course.quizHistory[0]);
    }
  }, [course?.quizHistory]);

  // Full topic map for quiz generation (includes topics, subtopics, and microtopics as Topic objects)
  const fullTopicMap = useMemo(() => {
    const map = new Map<string, Topic>();
    course?.studyMap.topics.forEach((topic) => {
      // Add main topic
      map.set(topic.id, topic);
      
      // Add subtopics (convert to Topic format)
      topic.subTopics.forEach((subTopic) => {
        map.set(subTopic.id, {
          ...subTopic,
          subTopics: subTopic.microTopics.map(micro => ({
            ...micro,
            microTopics: []
          })),
          tags: []
        } as Topic);
        
        // Add microtopics (convert to Topic format)
        subTopic.microTopics.forEach((microTopic) => {
          map.set(microTopic.id, {
            ...microTopic,
            subTopics: [],
            tags: []
          } as Topic);
        });
      });
    });
    return map;
  }, [course]);

  // Builder topics for display (includes all topics, subtopics, and microtopics)
  const builderTopics = useMemo(() => {
    const map = new Map<string, { id: string; title: string; type: "topic" | "subtopic" | "microtopic" }>();
    
    course?.studyMap.topics.forEach((topic) => {
      // Add main topic
      map.set(topic.id, { id: topic.id, title: topic.title, type: "topic" });
      
      // Add all sub-topics
      topic.subTopics.forEach((subTopic) => {
        map.set(subTopic.id, { id: subTopic.id, title: `${topic.title} → ${subTopic.title}`, type: "subtopic" });
        
        // Add all micro-topics
        subTopic.microTopics.forEach((microTopic) => {
          map.set(microTopic.id, { 
            id: microTopic.id, 
            title: `${topic.title} → ${subTopic.title} → ${microTopic.title}`, 
            type: "microtopic" 
          });
        });
      });
    });
    
    return map;
  }, [course]);

  if (!course || !courseId) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-600">
        Select or create a course to launch the quiz builder.
      </div>
    );
  }

  const toggleTopic = (topicId: string) => {
    if (!course) return;
    
    setSelectedTopics((prev) => {
      const isCurrentlySelected = prev.includes(topicId);
      
      // Find what type of item this is
      let allIdsToToggle: string[] = [topicId];
      
      // Check if it's a main topic
      const mainTopic = course.studyMap.topics.find(t => t.id === topicId);
      if (mainTopic) {
        // Include all subtopics and microtopics
        mainTopic.subTopics.forEach(st => {
          allIdsToToggle.push(st.id);
          st.microTopics.forEach(mt => allIdsToToggle.push(mt.id));
        });
      } else {
        // Check if it's a subtopic
        for (const topic of course.studyMap.topics) {
          const subTopic = topic.subTopics.find(st => st.id === topicId);
          if (subTopic) {
            // Include all microtopics
            subTopic.microTopics.forEach(mt => allIdsToToggle.push(mt.id));
            break;
          }
        }
      }
      
      if (isCurrentlySelected) {
        // Deselect all
        return prev.filter((id) => !allIdsToToggle.includes(id));
      } else {
        // Select all
        const newSelections = [...prev, ...allIdsToToggle.filter(id => !prev.includes(id))];
        if (newSelections.length > 20) {
          toast.error("You can select up to 20 topics.");
          return prev;
        }
        return newSelections;
      }
    });
  };

  const toggleExpandTopic = (topicId: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  // Helper to check if all children are selected
  const areAllChildrenSelected = (parentId: string): boolean => {
    if (!course) return false;
    
    // Check for main topic
    const mainTopic = course.studyMap.topics.find(t => t.id === parentId);
    if (mainTopic) {
      const allChildIds = [
        ...mainTopic.subTopics.map(st => st.id),
        ...mainTopic.subTopics.flatMap(st => st.microTopics.map(mt => mt.id))
      ];
      return allChildIds.length > 0 && allChildIds.every(id => selectedTopics.includes(id));
    }
    
    // Check for subtopic
    for (const topic of course.studyMap.topics) {
      const subTopic = topic.subTopics.find(st => st.id === parentId);
      if (subTopic) {
        const allMicroIds = subTopic.microTopics.map(mt => mt.id);
        return allMicroIds.length > 0 && allMicroIds.every(id => selectedTopics.includes(id));
      }
    }
    
    return false;
  };

  const createQuiz = async () => {
    if (!selectedTopics.length) {
      toast.error("Select at least one topic.");
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        courseId,
        difficulty,
        length,
        questionType,
        topics: selectedTopics.map((topicId) => {
          // Get the actual selected topic (could be main topic, subtopic, or microtopic)
          const selectedTopic = fullTopicMap.get(topicId);
          
          if (!selectedTopic) {
            throw new Error(`Topic ${topicId} not found`);
          }
          
          // Determine if this is a main topic by checking if it exists in course.studyMap.topics
          const isMainTopic = course!.studyMap.topics.some(t => t.id === topicId);
          
          // Find the parent main topic for microtopics list
          let mainTopic = selectedTopic;
          if (!isMainTopic) {
            for (const topic of course!.studyMap.topics) {
              for (const subTopic of topic.subTopics) {
                if (subTopic.id === topicId || subTopic.microTopics.some(mt => mt.id === topicId)) {
                  mainTopic = topic;
                  break;
                }
              }
              if (mainTopic !== selectedTopic) break;
            }
          }
          
          return {
            id: selectedTopic.id, // Use the actual selected ID, not parent
            title: selectedTopic.title,
            description: selectedTopic.description,
            microTopics: mainTopic.subTopics.flatMap((subTopic) =>
              subTopic.microTopics.map((micro) => ({
                id: micro.id,
                title: micro.title,
                description: micro.description,
                examScopeIds: micro.examScopeIds
              }))
            )
          };
        })
      };
      const quiz = await studyApi.generateQuiz(payload);
      upsertQuiz(courseId, quiz);
      await studyApi.recordQuizHistory(courseId, quiz);
      setActiveQuiz(quiz);
      toast.success("Quiz ready!");
    } catch (error) {
      console.error("Unable to generate quiz", error);
      toast.error("Unable to generate quiz. Claude error or timeout - retry?");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewWeakSpots = (microTopicIds: string[]) => {
    console.log("=== Review Weak Spots Clicked ===");
    
    if (!microTopicIds.length && !activeQuiz) {
      toast("Great work — no weak spots detected!");
      return;
    }
    
    // Show the weak spots list modal
    setShowWeakSpotsList(true);
  };

  const handleOpenWeakSpot = (topicId: string) => {
    const topic = fullTopicMap.get(topicId);
    if (topic) {
      setSelectedWeakTopic(topic);
      setShowWeakSpotPanel(true);
      setShowWeakSpotsList(false);
    }
  };

  const handleCreateQuizForTopic = (topicId: string) => {
    setSelectedTopics([topicId]);
    setShowWeakSpotPanel(false);
    setShowWeakSpotsList(false);
    toast.success("Topic selected! Configure quiz settings and generate.");
  };

  const handleSaveQuizResult = async (score: number, totalQuestions: number, weakTopicIds: string[]) => {
    if (!courseId || !activeQuiz) return;
    
    console.log("=== Saving Quiz Result ===");
    console.log("Weak topic IDs received:", weakTopicIds);
    
    // Store weak topics for immediate display
    setCurrentWeakTopicIds(weakTopicIds);
    
    const result: QuizResult = {
      id: `result-${Date.now()}`,
      quizId: activeQuiz.quizId,
      completedAt: new Date().toISOString(),
      score,
      totalQuestions,
      difficulty,
      topicIds: selectedTopics,
      topicTitles: selectedTopics.map((id) => builderTopics.get(id)?.title || "Unknown"),
      weakTopicIds
    };
    
    console.log("Quiz result object:", result);
    
    try {
      // Save to backend
      await studyApi.saveQuizResult(courseId, result);
      // Update local store
      saveQuizResult(courseId, result);
      toast.success(`Quiz submitted! Score: ${score}/${totalQuestions}`);
    } catch (error) {
      console.error("Failed to save quiz result:", error);
      toast.error("Failed to save quiz result");
    }
  };

  const handleDeleteResult = async (resultId: string) => {
    if (!courseId) return;
    
    try {
      // Delete from backend
      await studyApi.deleteQuizResult(courseId, resultId);
      // Update local store
      deleteQuizResult(courseId, resultId);
      toast.success("Result deleted");
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete quiz result:", error);
      toast.error("Failed to delete result");
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!courseId) return;
    
    try {
      // Delete from backend
      await studyApi.deleteQuiz(courseId, quizId);
      // Update local store
      deleteQuiz(courseId, quizId);
      
      // If the deleted quiz was active, clear it
      if (activeQuiz?.quizId === quizId) {
        setActiveQuiz(null);
      }
      
      toast.success("Quiz deleted");
      setDeleteQuizConfirm(null);
    } catch (error) {
      console.error("Failed to delete quiz:", error);
      toast.error("Failed to delete quiz");
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wide text-blue-500">Quiz builder</p>
        <h1 className="text-3xl font-semibold text-slate-900">Exam-focused quiz prep</h1>
        <p className="text-sm text-slate-500">Select up to 20 topics, choose difficulty, and Claude returns a quiz.</p>
      </header>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                <span className="text-xl">⚠️</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Delete Quiz Result</h3>
                <p className="text-sm text-slate-600">This action cannot be undone</p>
              </div>
            </div>
            <p className="mb-6 text-sm text-slate-700">
              Are you sure you want to delete this quiz result? All data including your score and performance history will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteResult(deleteConfirm)}
                className="flex-1 rounded-full bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Quiz Confirmation Modal */}
      {deleteQuizConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                <span className="text-xl">⚠️</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Delete Quiz</h3>
                <p className="text-sm text-slate-600">This action cannot be undone</p>
              </div>
            </div>
            <p className="mb-6 text-sm text-slate-700">
              Are you sure you want to delete this quiz from history? All questions and data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteQuizConfirm(null)}
                className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteQuiz(deleteQuizConfirm)}
                className="flex-1 rounded-full bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Select topics</p>
            <div className="max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-slate-100 p-3">
              {course.studyMap.topics.map((topic) => {
                const isExpanded = expandedTopics.has(topic.id);
                const hasChildren = topic.subTopics.length > 0;
                const topicSelected = selectedTopics.includes(topic.id) || areAllChildrenSelected(topic.id);
                
                // Count selected subtopics and microtopics
                const selectedSubCount = topic.subTopics.filter(st => selectedTopics.includes(st.id)).length;
                const selectedMicroCount = topic.subTopics.flatMap(st => st.microTopics).filter(mt => selectedTopics.includes(mt.id)).length;
                const childrenSelected = selectedSubCount + selectedMicroCount;
                
                return (
                  <div key={topic.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                    {/* Main Topic */}
                    <div className="flex items-center gap-2 p-3 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={topicSelected}
                        onChange={() => toggleTopic(topic.id)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => hasChildren && toggleExpandTopic(topic.id)}
                        className="flex flex-1 items-center gap-2 text-left"
                      >
                        {hasChildren && (
                          <span className="text-slate-400 transition-transform" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                            ▶
                          </span>
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">{topic.title}</p>
                          {childrenSelected > 0 && (
                            <p className="text-xs text-blue-600">{childrenSelected} subtopic{childrenSelected > 1 ? 's' : ''} selected</p>
                          )}
                        </div>
                      </button>
                    </div>
                    
                    {/* Subtopics */}
                    {isExpanded && hasChildren && (
                      <div className="border-t border-slate-100 bg-slate-50/50">
                        {topic.subTopics.map((subTopic) => {
                          const hasMicroTopics = subTopic.microTopics.length > 0;
                          const isSubExpanded = expandedTopics.has(subTopic.id);
                          const subTopicSelected = selectedTopics.includes(subTopic.id) || areAllChildrenSelected(subTopic.id);
                          const selectedMicroInSub = subTopic.microTopics.filter(mt => selectedTopics.includes(mt.id)).length;
                          
                          return (
                            <div key={subTopic.id} className="border-t border-slate-100 first:border-t-0">
                              {/* Subtopic */}
                              <div className="flex items-center gap-2 py-2 pl-8 pr-3 hover:bg-slate-100/50">
                                <input
                                  type="checkbox"
                                  checked={subTopicSelected}
                                  onChange={() => toggleTopic(subTopic.id)}
                                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <button
                                  onClick={() => hasMicroTopics && toggleExpandTopic(subTopic.id)}
                                  className="flex flex-1 items-center gap-2 text-left"
                                >
                                  {hasMicroTopics && (
                                    <span className="text-xs text-slate-400 transition-transform" style={{ transform: isSubExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                                      ▶
                                    </span>
                                  )}
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-700">{subTopic.title}</p>
                                    {selectedMicroInSub > 0 && (
                                      <p className="text-xs text-blue-600">{selectedMicroInSub} microtopic{selectedMicroInSub > 1 ? 's' : ''} selected</p>
                                    )}
                                  </div>
                                </button>
                              </div>
                              
                              {/* Microtopics */}
                              {isSubExpanded && hasMicroTopics && (
                                <div className="bg-slate-100/30">
                                  {subTopic.microTopics.map((microTopic) => {
                                    const microTopicSelected = selectedTopics.includes(microTopic.id);
                                    
                                    return (
                                      <label
                                        key={microTopic.id}
                                        className="flex items-center gap-2 py-2 pl-16 pr-3 hover:bg-slate-100/50 cursor-pointer"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={microTopicSelected}
                                          onChange={() => toggleTopic(microTopic.id)}
                                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <p className="text-sm text-slate-600">{microTopic.title}</p>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-500">{selectedTopics.length}/20 selected</p>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
              Difficulty
              <select
                className="rounded-2xl border border-slate-200 px-3 py-2"
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value as typeof difficulty)}
              >
                <option value="auto">Auto</option>
                <option value="intro">Intro</option>
                <option value="exam">Exam-level</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
              Question count
              <input
                type="number"
                min={1}
                max={20}
                value={length}
                onChange={(event) => {
                  const value = event.target.value;
                  // Allow empty string for user to clear and type fresh
                  if (value === '' || value === '0') {
                    setLength(0);
                    return;
                  }
                  const numValue = Number(value);
                  if (numValue > 20) {
                    setLength(20);
                    toast.error("Maximum 20 questions per quiz");
                  } else if (numValue < 1) {
                    setLength(0);
                  } else {
                    setLength(numValue);
                  }
                }}
                onBlur={(event) => {
                  const value = Number(event.target.value);
                  if (value > 20) setLength(20);
                  else if (value < 1 || !value) setLength(5);
                }}
                className="rounded-2xl border border-slate-200 px-3 py-2"
              />
            </label>
            <button
              className="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
              onClick={createQuiz}
              disabled={isLoading}
            >
              {isLoading ? "Calling Claude…" : "Create Quiz"}
            </button>
          </div>
        </div>
      </div>

      {activeQuiz && (
        <QuizPlayer 
          quiz={activeQuiz} 
          courseId={courseId}
          difficulty={difficulty}
          topicIds={selectedTopics}
          topicTitles={selectedTopics.map((id) => builderTopics.get(id)?.title || "Unknown")}
          onReviewWeakSpots={handleReviewWeakSpots} 
          onSaveResult={handleSaveQuizResult}
        />
      )}

      {/* Quiz History Section */}
      {course.quizHistory.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <p className="mb-3 text-xs font-semibold uppercase text-slate-500">Quiz History</p>
          <div className="grid gap-2">
            {course.quizHistory.map((quiz, index) => {
              const isActive = activeQuiz?.quizId === quiz.quizId;
              const date = new Date(quiz.generatedAt);
              const formattedDate = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              });
              
              // Check if this quiz's topics are expanded
              const isExpanded = expandedQuizIds.has(quiz.quizId);
              
              return (
                <div
                  key={quiz.quizId}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition-colors ${
                    isActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <button
                    onClick={() => setActiveQuiz(quiz)}
                    className="flex-1 text-left"
                  >
                    <p className={`text-sm font-semibold ${isActive ? "text-blue-900" : "text-slate-800"}`}>
                      Quiz {course.quizHistory.length - index}
                    </p>
                    <p className={`text-xs ${isActive ? "text-blue-600" : "text-slate-500"}`}>
                      {quiz.questions.length} questions • {formattedDate}
                    </p>
                    {quiz.topics && quiz.topics.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {(isExpanded ? quiz.topics : quiz.topics.slice(0, 3)).map((topic) => (
                          <span
                            key={topic.id}
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              isActive 
                                ? "bg-blue-100 text-blue-700" 
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {topic.title}
                          </span>
                        ))}
                        {quiz.topics.length > 3 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedQuizIds(prev => {
                                const next = new Set(prev);
                                if (next.has(quiz.quizId)) {
                                  next.delete(quiz.quizId);
                                } else {
                                  next.add(quiz.quizId);
                                }
                                return next;
                              });
                            }}
                            className={`text-xs font-medium hover:underline ${isActive ? "text-blue-600" : "text-slate-500"}`}
                          >
                            {isExpanded ? 'Show less' : `+${quiz.topics.length - 3} more`}
                          </button>
                        )}
                      </div>
                    )}
                  </button>
                  <div className="flex items-center gap-2">
                    {isActive && (
                      <span className="rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white">
                        Active
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteQuizConfirm(quiz.quizId);
                      }}
                      className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Delete quiz"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quiz Results History Section */}
      {course.quizResults && course.quizResults.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <p className="mb-3 text-xs font-semibold uppercase text-slate-500">Quiz Results History</p>
          <div className="grid gap-2">
            {course.quizResults.map((result) => {
              const date = new Date(result.completedAt);
              const formattedDate = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              });
              const percentage = Math.round((result.score / result.totalQuestions) * 100);
              
              return (
                <div
                  key={result.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">
                        {result.score}/{result.totalQuestions} ({percentage}%)
                      </p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        percentage >= 80 
                          ? "bg-emerald-50 text-emerald-700" 
                          : percentage >= 60 
                            ? "bg-yellow-50 text-yellow-700" 
                            : "bg-rose-50 text-rose-700"
                      }`}>
                        {result.difficulty}
                      </span>
                      {result.weakTopicIds && result.weakTopicIds.length > 0 && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                          🎯 {result.weakTopicIds.length} weak spot{result.weakTopicIds.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {result.topicTitles.join(", ")} • {formattedDate}
                    </p>
                  </div>
                  <button
                    onClick={() => setDeleteConfirm(result.id)}
                    className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                    title="Delete result"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weak Spots List Modal */}
      {showWeakSpotsList && activeQuiz && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">📊 Weak Spots Analysis</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Topics where you answered questions incorrectly
                </p>
              </div>
              <button
                onClick={() => setShowWeakSpotsList(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {(() => {
                // Use currentWeakTopicIds which is set immediately after submission
                const weakTopicIds = currentWeakTopicIds;
                
                console.log("=== WEAK SPOTS MODAL OPENED ===");
                console.log("currentWeakTopicIds:", currentWeakTopicIds);
                console.log("weakTopicIds length:", weakTopicIds.length);
                console.log("weakTopicIds:", weakTopicIds);
                
                if (weakTopicIds.length === 0) {
                  console.log("Showing perfect score message (weakTopicIds is empty)");
                  return (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                      <p className="text-lg font-semibold text-emerald-600">🎉 Perfect Score!</p>
                      <p className="mt-2 text-sm text-slate-600">
                        You answered all questions correctly. No weak spots detected!
                      </p>
                    </div>
                  );
                }

                // Since we don't store detailed per-question results,
                // we just show all weak topics as "Needs Review"
                return weakTopicIds.map((topicId) => {
                  const topic = fullTopicMap.get(topicId);
                  if (!topic) return null;

                  return (
                    <button
                      key={topicId}
                      onClick={() => handleOpenWeakSpot(topicId)}
                      className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-rose-300 hover:bg-rose-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🎯</span>
                          <div>
                            <h3 className="font-semibold text-slate-900">{topic.title}</h3>
                            <p className="text-xs text-slate-600 line-clamp-1">{topic.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Status</p>
                          <p className="text-sm font-bold text-rose-600">
                            Needs Review
                          </p>
                        </div>
                        <span className="text-slate-400">→</span>
                      </div>
                    </button>
                  );
                });
              })()}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowWeakSpotsList(false)}
                className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Weak Spot Detail Panel */}
      {showWeakSpotPanel && selectedWeakTopic && (
        <WeakSpotPanel
          topic={selectedWeakTopic}
          resources={course.studyMap.resources[selectedWeakTopic.id] || []}
          quizHistory={course.quizHistory}
          courseTitle={course.studyMap.course.name}
          onClose={() => {
            setShowWeakSpotPanel(false);
            setSelectedWeakTopic(null);
          }}
          onCreateQuiz={handleCreateQuizForTopic}
          onAddResource={(resource) => {
            addResource(courseId, selectedWeakTopic.id, resource);
            toast.success("Resource added!");
          }}
        />
      )}

      {/* Floating Chat Button */}
      <button
        onClick={() => setShowChatOverlay(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl hover:bg-blue-700 hover:scale-110 transition-all duration-200"
        title="Study Assistant Chat"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {/* Chat Overlay */}
      {showChatOverlay && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowChatOverlay(false)}
        >
          <div 
            className="relative w-full max-w-4xl h-[85vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Chat Header */}
            <div className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Study Assistant</h2>
                  <p className="text-sm text-slate-600">{course.studyMap.course.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowChatOverlay(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                title="Close chat"
              >
                ✕
              </button>
            </div>

            {/* Chat Interface */}
            <div className="flex-1 overflow-hidden">
              <ChatInterface 
                courseId={courseId} 
                course={course}
                onClose={() => setShowChatOverlay(false)}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default QuizCenterPage;
