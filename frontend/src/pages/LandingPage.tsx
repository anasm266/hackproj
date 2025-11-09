import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import type { StudyMapPayload, Topic } from "@studymap/types";
import CreatePlannerForm from "../components/planner/CreatePlannerForm";
import StudyMapReview from "../components/planner/StudyMapReview";
import { useStudyPlanStore } from "../store/useStudyPlanStore";
import { studyApi } from "../lib/api";

const featureCards = [
  {
    icon: "account_tree",
    title: "Interactive Study Map",
    body: "Visualize the entire course structure, see how topics connect, and plan your study path effectively."
  },
  {
    icon: "checklist",
    title: "Auto-tracked Progress",
    body: "As you complete modules and assignments, your progress is automatically updated on your map."
  },
  {
    icon: "quiz",
    title: "On-demand Quizzes",
    body: "Generate practice quizzes on any topic, anytime, to test your knowledge and prepare for exams."
  }
];

const LandingPage = () => {
  const [draft, setDraft] = useState<StudyMapPayload | null>(null);
  const [warnings, setWarnings] = useState<string[] | undefined>(undefined);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const ingestStudyMap = useStudyPlanStore((state) => state.ingestStudyMap);
  const navigate = useNavigate();

  const handleDraftReady = (payload: StudyMapPayload, warningMessages?: string[]) => {
    setDraft(payload);
    setWarnings(warningMessages);
  };

  const updateDraftNode = (nodeId: string, title: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const updateTopic = (topic: Topic): Topic => {
        if (topic.id === nodeId) {
          return { ...topic, title };
        }
        const updatedSubTopics = topic.subTopics.map((subTopic) => {
          if (subTopic.id === nodeId) {
            return { ...subTopic, title };
          }
          const updatedMicro = subTopic.microTopics.map((micro) =>
            micro.id === nodeId ? { ...micro, title } : micro
          );
          return { ...subTopic, microTopics: updatedMicro };
        });
        return { ...topic, subTopics: updatedSubTopics };
      };
      return {
        ...prev,
        topics: prev.topics.map(updateTopic)
      };
    });
  };

  const acceptDraft = async () => {
    if (!draft) return;
    setIsSavingDraft(true);
    try {
      console.log("Saving course:", draft.course.id, draft.course.name);
      await studyApi.saveCourse(draft);
      console.log("Course saved, ingesting into store...");
      ingestStudyMap(draft);
      console.log("Store updated, navigating to:", `/courses/${draft.course.id}/map`);
      toast.success("Course planner saved.");
      // Give a small delay to ensure the course is persisted
      await new Promise(resolve => setTimeout(resolve, 100));
      navigate(`/courses/${draft.course.id}/map`);
      setDraft(null);
    } catch (error) {
      console.error("Failed to save course", error);
      toast.error("Unable to save course planner. Please try again.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-slate-50">
      {/* Fixed TopNavBar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm flex items-center justify-between whitespace-nowrap px-4 sm:px-10 py-4 border-b border-solid border-slate-200">
        <div className="flex items-center gap-3 mx-auto w-full max-w-5xl justify-between">
          <div className="flex items-center gap-3">
            <div className="text-blue-600 size-7">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z" fill="currentColor"></path>
              </svg>
            </div>
            <h2 className="text-slate-900 text-xl font-bold leading-tight tracking-tight">StudyMap</h2>
          </div>
          <button 
            onClick={() => navigate("/dashboard")}
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-blue-600 text-white text-sm font-bold leading-normal tracking-[0.015em] transition-opacity hover:opacity-80"
          >
            <span className="truncate">Dashboard</span>
          </button>
        </div>
      </header>

      {/* Add padding-top to account for fixed header */}
      <div className="layout-container flex h-full grow flex-col pt-[73px]">
        <div className="flex flex-1 justify-center">
          <div className="layout-content-container flex flex-col w-full max-w-5xl flex-1">
            
            <main className="flex-grow">
              {/* HeroSection */}
              <section className="py-20 px-4 text-center">
                <div className="flex flex-col items-center gap-6 mx-auto max-w-2xl">
                  <h1 className="text-slate-900 text-4xl font-black leading-tight tracking-tighter sm:text-5xl md:text-6xl">
                    From Messy Syllabus to Master Plan.
                  </h1>
                  <h2 className="text-slate-600 text-lg font-normal leading-normal md:text-xl">
                    Your personal AI-powered study map for any course.
                  </h2>
                  <button 
                    onClick={() => setShowForm(true)}
                    className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-blue-600 text-white text-base font-bold leading-normal tracking-[0.015em] transition-opacity hover:opacity-80 mt-4"
                  >
                    <span className="truncate">Create Course Planner</span>
                  </button>
                </div>
              </section>
              
              {/* FeatureSection */}
              <section className="py-20 px-4 bg-slate-50">
                <div className="flex flex-col gap-12">
                  <div className="flex flex-col gap-4 text-center max-w-3xl mx-auto">
                    <h1 className="text-slate-900 tracking-tight text-3xl font-bold leading-tight sm:text-4xl">
                      Everything you need to succeed in one place
                    </h1>
                    <p className="text-slate-600 text-base font-normal leading-normal md:text-lg">
                      Our AI takes your syllabus and transforms it into a powerful, interactive tool to help you learn smarter, not harder.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-0">
                    {featureCards.map((card) => (
                      <div key={card.title} className="flex flex-1 gap-4 rounded-xl border border-slate-200 bg-white p-6 flex-col transition-shadow hover:shadow-lg">
                        <div className="text-blue-600">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            {card.icon === "account_tree" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />}
                            {card.icon === "checklist" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />}
                            {card.icon === "quiz" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                          </svg>
                        </div>
                        <div className="flex flex-col gap-2">
                          <h2 className="text-slate-900 text-lg font-bold leading-tight">{card.title}</h2>
                          <p className="text-slate-600 text-sm font-normal leading-normal">{card.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </main>
            
            {/* Footer */}
            <footer className="flex flex-col gap-8 px-5 py-10 text-center">
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
                <a className="text-slate-600 text-base font-normal leading-normal min-w-24 transition-colors hover:text-blue-600" href="#">About</a>
                <a className="text-slate-600 text-base font-normal leading-normal min-w-24 transition-colors hover:text-blue-600" href="#">Contact</a>
                <a className="text-slate-600 text-base font-normal leading-normal min-w-24 transition-colors hover:text-blue-600" href="#">Privacy Policy</a>
              </div>
              <p className="text-slate-500 text-sm font-normal leading-normal">© 2024 StudyMap. All rights reserved.</p>
            </footer>
          </div>
        </div>
      </div>

      {/* Modal for Create Planner Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Create Course Planner</h2>
              <button 
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <CreatePlannerForm onDraftReady={handleDraftReady} />
          </div>
        </div>
      )}

      {draft && (
        <StudyMapReview
          draft={draft}
          warnings={warnings}
          onClose={() => setDraft(null)}
          onAccept={acceptDraft}
          onTitleChange={updateDraftNode}
          isSaving={isSavingDraft}
        />
      )}
    </div>
  );
};

export default LandingPage;
