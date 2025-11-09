import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import type { StudyMapPayload } from "@studymap/types";
import { studyApi } from "../../lib/api";

const steps = ["Extracting dates", "Building topics", "Tagging exams/projects"];

type CreatePlannerFormProps = {
  onDraftReady: (payload: StudyMapPayload, warnings?: string[]) => void;
};

const CreatePlannerForm = ({ onDraftReady }: CreatePlannerFormProps) => {
  const [courseName, setCourseName] = useState("");
  const [courseNumber, setCourseNumber] = useState("");
  const [term, setTerm] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isParsing) return;
    setCurrentStep(0);
    let step = 0;
    const timer = window.setInterval(() => {
      step = Math.min(step + 1, steps.length - 1);
      setCurrentStep(step);
    }, 1200);
    return () => window.clearInterval(timer);
  }, [isParsing]);

  const onDrop = useCallback((accepted: File[]) => {
    setFiles((prev) => [...prev, ...accepted]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"]
    }
  });

  const removeFile = (fileName: string) => {
    setFiles((prev) => prev.filter((file) => file.name !== fileName));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!courseName.trim()) {
      toast.error("Course name is required.");
      return;
    }
    if (files.length === 0) {
      toast.error("Upload at least one syllabus PDF.");
      return;
    }

    setIsParsing(true);
    try {
      const response = await studyApi.parseSyllabus({
        courseName,
        courseNumber,
        term,
        files
      });
      toast.success("Study map draft ready!");
      onDraftReady(response.studyMap, response.warnings);
    } catch (error) {
      console.error("Parse syllabus error:", error);
      let message = "Claude error/timeout — please retry";
      if (error instanceof Error) {
        message = error.message;
      }
      // Check for network/timeout errors
      if ((error as any)?.code === "ECONNABORTED") {
        message = "Request timed out. Claude may be taking too long - please try again.";
      } else if ((error as any)?.response?.data?.message) {
        message = (error as any).response.data.message;
      }
      toast.error(message);
    } finally {
      setIsParsing(false);
      setCurrentStep(steps.length - 1);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-card"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-sm font-semibold text-slate-600">
          Course Name *
          <input
            disabled={isParsing}
            value={courseName}
            onChange={(event) => setCourseName(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base"
            placeholder="Algorithms & Data Structures"
          />
        </label>
        <label className="text-sm font-semibold text-slate-600">
          Course Number
          <input
            disabled={isParsing}
            value={courseNumber}
            onChange={(event) => setCourseNumber(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base"
            placeholder="CS 201"
          />
        </label>
        <label className="text-sm font-semibold text-slate-600">
          Term
          <input
            disabled={isParsing}
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base"
            placeholder="Fall 2025"
          />
        </label>
      </div>
      <div
        {...getRootProps()}
        className={`rounded-3xl border-2 border-dashed px-6 py-10 text-center ${
          isDragActive ? "border-blue-500 bg-blue-50/50" : "border-slate-300 bg-slate-50/70"
        }`}
      >
        <input {...getInputProps()} disabled={isParsing} />
        <p className="text-lg font-semibold text-slate-800">
          {isDragActive ? "Drop the PDF(s) here" : "Upload syllabus PDF(s)"}
        </p>
        <p className="text-sm text-slate-500">Drag & drop or click to browse. Multiple files welcome.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm text-slate-600">
          {files.map((file) => (
            <span
              key={file.name}
              className="flex items-center gap-2 rounded-full bg-white px-4 py-1 shadow-sm"
            >
              {file.name}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  removeFile(file.name);
                }}
                className="text-xs text-rose-500"
              >
                Remove
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={isParsing}
          className="rounded-full bg-slate-900 px-8 py-3 text-sm font-semibold text-white disabled:opacity-70"
        >
          Create Course Planner
        </button>
        {isParsing && (
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <span className="h-3 w-3 animate-pulse rounded-full bg-blue-500" />
            <div>
              <p className="text-sm font-semibold text-slate-700">{steps[currentStep]}</p>
              <p className="text-xs text-slate-500">Claude is thinking…</p>
            </div>
          </div>
        )}
      </div>
    </form>
  );
};

export default CreatePlannerForm;
