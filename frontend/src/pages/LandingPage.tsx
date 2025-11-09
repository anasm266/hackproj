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
    title: "Topics -> microtopics",
    body: "Claude decomposes every syllabus into a navigable tree with rationale and scope tags."
  },
  {
    title: "Auto-tracked progress",
    body: "Check off microtopics to update per-topic pills, overall progress, and exam readiness."
  },
  {
    title: "Upcoming & quizzes",
    body: "Deadlines auto-populate the Upcoming timeline, and quizzes arrive on demand."
  }
];

const heroGradient =
  "bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_60%)] bg-slate-900";

const LandingPage = () => {
  const [draft, setDraft] = useState<StudyMapPayload | null>(null);
  const [warnings, setWarnings] = useState<string[] | undefined>(undefined);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white">
      <section className={`px-6 pb-16 pt-12 ${heroGradient}`}>
        <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-center">
          <div className="flex-1">
            <p className="text-sm uppercase tracking-[0.3em] text-blue-300">
              Syllabus {"->"} StudyMap
            </p>
            <h1 className="mt-4 text-5xl font-semibold leading-tight">
              Turn messy syllabi into a clean, interactive study map.
            </h1>
            <p className="mt-4 text-lg text-slate-200">
              Upload PDF(s) and let Claude build topics {"->"} subtopics {"->"} microtopics, tag each exam, sync
              deadlines, surface trusted resources, and spin up quizzes on demand.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-300">
              <span className="rounded-full border border-white/20 px-4 py-2">PDF {"->"} Claude JSON</span>
              <span className="rounded-full border border-white/20 px-4 py-2">Progress analytics</span>
              <span className="rounded-full border border-white/20 px-4 py-2">Upcoming timeline</span>
              <span className="rounded-full border border-white/20 px-4 py-2">Quiz builder</span>
            </div>
          </div>
          <div className="flex-1">
            <CreatePlannerForm onDraftReady={handleDraftReady} />
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-16 text-slate-900">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {featureCards.map((card) => (
            <div key={card.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
              <p className="text-xs uppercase tracking-wide text-blue-500">Feature</p>
              <h3 className="mt-2 text-xl font-semibold">{card.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

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
