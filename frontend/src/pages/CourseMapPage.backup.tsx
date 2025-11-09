import { useParams } from "react-router-dom";
import { useState, useMemo } from "react";
import { useStudyPlanStore } from "../store/useStudyPlanStore";
import { courseProgress } from "../lib/progress";
import type { MicroTopic, SubTopic, Topic } from "@studymap/types";

const CourseMapPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const course = useStudyPlanStore((state) =>
    courseId ? state.courses[courseId] : undefined
  );
  const toggleMicroTopic = useStudyPlanStore((state) => state.toggleMicroTopic);

  const [selectedMicroTopicId, setSelectedMicroTopicId] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string>("all");

  if (!course) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
        <p className="text-lg font-semibold text-gray-900">Course not found.</p>
        <p className="mt-2 text-sm text-gray-500">Please select or create a course from the dashboard.</p>
      </div>
    );
  }

  const progress = courseProgress(course.studyMap.topics);

  // Get all unique exam scope tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    course.studyMap.topics.forEach((topic) => {
      topic.subTopics.forEach((sub) => {
        sub.microTopics.forEach((micro) => {
          micro.examScopeIds?.forEach((id) => tags.add(id));
        });
      });
    });
    return Array.from(tags);
  }, [course.studyMap.topics]);

  // Find selected microtopic details
  const selectedMicroTopic = useMemo(() => {
    if (!selectedMicroTopicId) return null;
    for (const topic of course.studyMap.topics) {
      for (const sub of topic.subTopics) {
        const micro = sub.microTopics.find((m) => m.id === selectedMicroTopicId);
        if (micro) {
          return { topic, sub, micro };
        }
      }
    }
    return null;
  }, [selectedMicroTopicId, course.studyMap.topics]);

  const handleToggle = (microTopicId: string) => {
    toggleMicroTopic(courseId!, microTopicId);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between gap-4 items-start">
        <div className="flex min-w-72 flex-col gap-2">
          <p className="text-gray-900 text-4xl font-black leading-tight tracking-tight">
            {course.studyMap.course.name}
          </p>
          <p className="text-gray-500 text-base font-normal leading-normal">
            An interactive study map of your course syllabus.
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex flex-col gap-4 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex gap-6 justify-between items-center">
            <p className="text-gray-900 text-base font-medium leading-normal">Overall Progress</p>
            <p className="text-gray-900 text-sm font-normal leading-normal">{progress.percent}%</p>
          </div>
          <div className="rounded-full bg-gray-200 h-2.5">
            <div className="h-2.5 rounded-full bg-blue-600" style={{ width: `${progress.percent}%` }} />
          </div>
        </div>
      </div>

      {/* Filter Tags */}
      <div className="flex gap-3 p-3 flex-wrap items-center">
        <span className="text-sm font-medium text-gray-600">Filter by:</span>
        <button
          onClick={() => setFilterTag("all")}
          className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg pl-4 pr-4 cursor-pointer transition-colors ${
            filterTag === "all"
              ? "bg-blue-600 text-white"
              : "bg-white border border-gray-200 hover:bg-gray-100 text-gray-900"
          }`}
        >
          <p className="text-sm font-medium leading-normal">All</p>
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setFilterTag(tag)}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg pl-4 pr-4 cursor-pointer transition-colors ${
              filterTag === tag
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 hover:bg-gray-100 text-gray-900"
            }`}
          >
            <p className="text-sm font-medium leading-normal">{tag}</p>
          </button>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Sidebar - Tree Navigation */}
        <div className="lg:col-span-1 bg-white p-4 rounded-xl border border-gray-200 shadow-sm max-h-[800px] overflow-y-auto">
          <ul className="space-y-1">
            {course.studyMap.topics.map((topic) => (
              <TopicNode
                key={topic.id}
                topic={topic}
                selectedMicroTopicId={selectedMicroTopicId}
                onSelectMicroTopic={setSelectedMicroTopicId}
                onToggleMicroTopic={handleToggle}
                filterTag={filterTag}
              />
            ))}
          </ul>
        </div>

        {/* Right Panel - Details */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm min-h-[400px]">
          {selectedMicroTopic ? (
            <MicroTopicDetails
              micro={selectedMicroTopic.micro}
              topicTitle={selectedMicroTopic.topic.title}
              subTopicTitle={selectedMicroTopic.sub.title}
              courseId={courseId!}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium">Select a topic to view details</p>
              <p className="text-sm mt-2">Click on any microtopic in the tree to see more information</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Topic Node Component
const TopicNode = ({
  topic,
  selectedMicroTopicId,
  onSelectMicroTopic,
  onToggleMicroTopic,
  filterTag
}: {
  topic: Topic;
  selectedMicroTopicId: string | null;
  onSelectMicroTopic: (id: string) => void;
  onToggleMicroTopic: (id: string) => void;
  filterTag: string;
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <li>
      <details className="group" open={isOpen}>
        <summary
          className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 list-none"
          onClick={(e) => {
            e.preventDefault();
            setIsOpen(!isOpen);
          }}
        >
          <svg 
            className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-bold text-base text-gray-900">{topic.title}</span>
        </summary>
        {isOpen && (
          <ul className="pl-6 space-y-1 border-l ml-4 border-gray-200 mt-1">
            {topic.subTopics.map((sub) => (
              <SubTopicNode
                key={sub.id}
                subTopic={sub}
                selectedMicroTopicId={selectedMicroTopicId}
                onSelectMicroTopic={onSelectMicroTopic}
                onToggleMicroTopic={onToggleMicroTopic}
                filterTag={filterTag}
              />
            ))}
          </ul>
        )}
      </details>
    </li>
  );
};

// SubTopic Node Component
const SubTopicNode = ({
  subTopic,
  selectedMicroTopicId,
  onSelectMicroTopic,
  onToggleMicroTopic,
  filterTag
}: {
  subTopic: SubTopic;
  selectedMicroTopicId: string | null;
  onSelectMicroTopic: (id: string) => void;
  onToggleMicroTopic: (id: string) => void;
  filterTag: string;
}) => {
  const [isOpen, setIsOpen] = useState(true);

  // Filter microtopics based on selected tag
  const filteredMicroTopics =
    filterTag === "all"
      ? subTopic.microTopics
      : subTopic.microTopics.filter((m) => m.examScopeIds?.includes(filterTag));

  if (filteredMicroTopics.length === 0) return null;

  return (
    <li>
      <details className="group" open={isOpen}>
        <summary
          className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 list-none"
          onClick={(e) => {
            e.preventDefault();
            setIsOpen(!isOpen);
          }}
        >
          <svg 
            className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-semibold text-sm text-gray-900">{subTopic.title}</span>
        </summary>
        {isOpen && (
          <ul className="pl-6 space-y-1 border-l ml-4 border-gray-200 mt-1">
            {filteredMicroTopics.map((micro) => (
              <li
                key={micro.id}
                className={`p-2 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${
                  selectedMicroTopicId === micro.id
                    ? "bg-blue-600/20 ring-2 ring-blue-600"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => onSelectMicroTopic(micro.id)}
              >
                <input
                  checked={micro.completed}
                  onChange={() => onToggleMicroTopic(micro.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                  type="checkbox"
                />
                <label
                  className={`text-sm cursor-pointer flex-1 ${
                    selectedMicroTopicId === micro.id
                      ? "font-medium text-blue-600"
                      : micro.completed
                      ? "text-gray-400 line-through"
                      : "text-gray-600"
                  }`}
                >
                  {micro.title}
                </label>
              </li>
            ))}
          </ul>
        )}
      </details>
    </li>
  );
};

// MicroTopic Details Component
const MicroTopicDetails = ({
  micro,
  topicTitle,
  subTopicTitle,
  courseId
}: {
  micro: MicroTopic;
  topicTitle: string;
  subTopicTitle: string;
  courseId: string;
}) => {
  const course = useStudyPlanStore((state) => state.courses[courseId]);
  const resources = course?.studyMap.resources || {};

  // Find resources for this topic's parent
  const topicResources = Object.entries(resources).find(([topicId]) => {
    return course?.studyMap.topics.some((t) => t.id === topicId && t.title === topicTitle);
  })?.[1] || [];

  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-2xl font-bold text-gray-900">{micro.title}</h3>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {micro.examScopeIds && micro.examScopeIds.length > 0 && micro.examScopeIds.map((examId) => (
          <span
            key={examId}
            className="text-xs font-medium inline-flex items-center px-2.5 py-1 rounded-full bg-blue-100 text-blue-800"
          >
            {examId}
          </span>
        ))}
        {micro.completed && (
          <span className="text-xs font-medium inline-flex items-center px-2.5 py-1 rounded-full bg-green-100 text-green-800">
            ✓ Completed
          </span>
        )}
        {micro.tags && micro.tags.length > 0 && micro.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs font-medium inline-flex items-center px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Description */}
      <p className="text-gray-600 text-base leading-relaxed">{micro.description}</p>

      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 flex items-center gap-2">
        <span className="font-medium">{topicTitle}</span> 
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-medium">{subTopicTitle}</span> 
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span>{micro.title}</span>
      </div>

      {/* Resources Section */}
      {topicResources.length > 0 && (
        <div className="border-t border-gray-200 pt-5">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Resources Quick Peek</h4>
          <div className="space-y-3">
            {topicResources.slice(0, 3).map((resource) => (
              <a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors group"
              >
                <div className={`text-2xl ${
                  resource.type === "video" ? "text-red-500" : 
                  resource.type === "interactive" ? "text-blue-500" : 
                  "text-gray-500"
                }`}>
                  {resource.type === "video" ? "🎥" : 
                   resource.type === "interactive" ? "🎮" : 
                   "📄"}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
                    {resource.title}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{resource.type}</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseMapPage;
