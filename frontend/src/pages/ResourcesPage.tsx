import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import type { ResourceItem, ResourceSearchResult } from "@studymap/types";
import { useStudyPlanStore } from "../store/useStudyPlanStore";
import ResourceSearchModal from "../components/resources/ResourceSearchModal";
import { studyApi } from "../lib/api";

const defaultPlaceholder = (topicTitle: string): ResourceItem => ({
  id: `placeholder-${Date.now()}`,
  title: `${topicTitle} deep dive`,
  summary: "Auto-suggested resource based on Claude's broader search.",
  url: "https://www.youtube.com/results",
  type: "video",
  duration: "12m"
});

const ResourcesPage = () => {
  const { courseId } = useParams();
  const course = useStudyPlanStore((state) =>
    courseId ? state.courses[courseId] : undefined
  );
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [extraResources, setExtraResources] = useState<Record<string, ResourceItem[]>>({});
  const [deletedResourceIds, setDeletedResourceIds] = useState<Set<string>>(new Set());
  const [manualTitle, setManualTitle] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [isAISearchOpen, setIsAISearchOpen] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ isOpen: boolean; resourceId: string; resourceTitle: string }>({
    isOpen: false,
    resourceId: "",
    resourceTitle: ""
  });

  const resolvedTopicId = course
    ? activeTopicId ?? course.studyMap.topics[0]?.id ?? null
    : null;
  const topicResources = useMemo(() => {
    if (!course || !resolvedTopicId) return [];
    const primary = course.studyMap.resources[resolvedTopicId] ?? [];
    const extra = extraResources[resolvedTopicId] ?? [];
    // Filter out deleted resources
    return [...primary, ...extra].filter(r => !deletedResourceIds.has(r.id));
  }, [course, resolvedTopicId, extraResources, deletedResourceIds]);

  if (!course || !courseId) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-600">
        Select a course to view curated resources.
      </div>
    );
  }

  const topics = course.studyMap.topics;
  const currentTopicId = resolvedTopicId;
  const currentTopic = topics.find((topic) => topic.id === currentTopicId);

  const handleFindMore = () => {
    if (!currentTopicId || !currentTopic) return;
    setExtraResources((prev) => ({
      ...prev,
      [currentTopicId]: [...(prev[currentTopicId] ?? []), defaultPlaceholder(currentTopic.title)]
    }));
  };

  const handleManualAdd = (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentTopicId || !manualTitle || !manualUrl) return;
    const resource: ResourceItem = {
      id: `manual-${Date.now()}`,
      title: manualTitle,
      summary: "Manually added resource",
      url: manualUrl,
      type: "article"
    };
    setExtraResources((prev) => ({
      ...prev,
      [currentTopicId]: [...(prev[currentTopicId] ?? []), resource]
    }));
    setManualTitle("");
    setManualUrl("");
  };

  const handleAIResourceSelect = async (aiResource: ResourceSearchResult) => {
    if (!currentTopicId || !courseId || !currentTopic) return;
    
    // Convert AI resource to ResourceItem format with metadata
    const resource: Omit<ResourceItem, "id"> = {
      title: aiResource.title,
      summary: aiResource.summary,
      url: aiResource.url,
      type: aiResource.contentType as ResourceItem["type"],
      aiGenerated: true,
      aiSearchQuery: currentTopic.title,
      aiQuality: aiResource.quality,
      addedAt: new Date().toISOString()
    };
    
    try {
      // Save to backend
      const response = await studyApi.addResourceToCourse(courseId, currentTopicId, resource);
      
      if (response.success && response.resource) {
        // Also add to local state for immediate UI update
        setExtraResources((prev) => ({
          ...prev,
          [currentTopicId]: [...(prev[currentTopicId] ?? []), response.resource!]
        }));
        
        toast.success(`Added "${aiResource.title}" to resources!`);
      } else {
        toast.error(response.error || "Failed to add resource");
      }
    } catch (error) {
      console.error("Error adding resource:", error);
      toast.error("Failed to add resource. Please try again.");
    }
  };

  const handleDeleteResource = (resourceId: string) => {
    if (!currentTopicId) return;
    
    // Add to deleted set
    setDeletedResourceIds((prev) => new Set(prev).add(resourceId));
    
    // Also remove from extraResources if it's there
    setExtraResources((prev) => ({
      ...prev,
      [currentTopicId]: (prev[currentTopicId] ?? []).filter(r => r.id !== resourceId)
    }));
    
    setDeleteConfirmModal({ isOpen: false, resourceId: "", resourceTitle: "" });
    toast.success("Resource removed");
  };

  const openDeleteConfirm = (resourceId: string, resourceTitle: string) => {
    setDeleteConfirmModal({ isOpen: true, resourceId, resourceTitle });
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirmModal({ isOpen: false, resourceId: "", resourceTitle: "" });
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wide text-blue-500">Resources</p>
        <h1 className="text-3xl font-semibold text-slate-900">Trusted study resources</h1>
        <p className="text-sm text-slate-500">Curated links and materials for each topic.</p>
      </header>

      <div className="flex flex-wrap gap-3">{topics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => setActiveTopicId(topic.id)}
            className={`rounded-full px-4 py-2 text-sm ${
              currentTopicId === topic.id ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600"
            }`}
          >
            {topic.title}
          </button>
        ))}
      </div>

      {currentTopic ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Topic</p>
              <h2 className="text-2xl font-semibold text-slate-900">{currentTopic.title}</h2>
              <p className="text-sm text-slate-500">{currentTopic.description}</p>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              onClick={() => setIsAISearchOpen(true)}
            >
              <span className="text-base">✨</span>
              <span>Find with Claude</span>
            </button>
          </div>

          {topicResources.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center">
              <p className="text-sm font-semibold text-slate-700">
                No trusted resources found. Try "Find More".
              </p>
              <p className="text-xs text-slate-500">
                We will run a broader search and you can manually add below.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {topicResources.map((resource) => (
                <div
                  key={resource.id}
                  className="group relative rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-card transition hover:shadow-lg"
                >
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteConfirm(resource.id, resource.title);
                    }}
                    className="absolute top-3 right-3 rounded-full bg-white p-1.5 text-slate-400 opacity-0 shadow-sm hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 transition-all"
                    title="Delete resource"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>

                  {resource.thumbnail && (
                    <img
                      src={resource.thumbnail}
                      alt={resource.title}
                      className="mb-3 h-36 w-full rounded-2xl object-cover"
                    />
                  )}
                  
                  {/* AI Badge */}
                  {resource.aiGenerated && (
                    <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 px-2 py-0.5 text-xs font-semibold text-blue-700">
                      <span>✨</span>
                      <span>AI Found</span>
                      {resource.aiQuality && (
                        <span className="text-slate-500">• {resource.aiQuality}</span>
                      )}
                    </div>
                  )}
                  
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                  >
                    <p className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors">{resource.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{resource.summary}</p>
                  </a>
                  
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <span className="rounded-full border border-slate-200 px-2 py-0.5">{resource.type}</span>
                    {resource.duration && <span>{resource.duration}</span>}
                    {resource.addedAt && (
                      <span className="text-slate-400">
                        • {new Date(resource.addedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  
                  {/* Open Link Button */}
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <span>Open Resource</span>
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={handleManualAdd}
            className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600"
          >
            <p className="font-semibold text-slate-800">Manual add</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input
                value={manualTitle}
                onChange={(event) => setManualTitle(event.target.value)}
                placeholder="Title"
                className="rounded-2xl border border-slate-200 px-4 py-2"
              />
              <input
                value={manualUrl}
                onChange={(event) => setManualUrl(event.target.value)}
                placeholder="URL"
                className="rounded-2xl border border-slate-200 px-4 py-2"
              />
            </div>
            <button className="mt-3 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
              Add resource
            </button>
          </form>
        </div>
      ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
          Select a topic to see resources.
        </div>
      )}

      {/* AI Search Modal */}
      <ResourceSearchModal
        isOpen={isAISearchOpen}
        onClose={() => setIsAISearchOpen(false)}
        courseTitle={course.studyMap.course.name}
        topicId={currentTopicId || undefined}
        topicTitle={currentTopic?.title}
        topicDescription={currentTopic?.description}
        onResourceSelect={handleAIResourceSelect}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-50">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">Delete Resource?</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Are you sure you want to delete "<strong>{deleteConfirmModal.resourceTitle}</strong>"? This action cannot be undone.
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={closeDeleteConfirm}
                    className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteResource(deleteConfirmModal.resourceId)}
                    className="flex-1 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourcesPage;