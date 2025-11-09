import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import type { ResourceType, ResourceSearchResult, SearchQuality } from "@studymap/types";
import { studyApi } from "../../lib/api";
import ResourceResultCard from "./ResourceResultCard";

type ResourceSearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  topicId?: string;
  topicTitle?: string;
  topicDescription?: string;
  onResourceSelect: (resource: ResourceSearchResult) => void;
};

const ResourceSearchModal = ({
  isOpen,
  onClose,
  courseTitle,
  topicTitle: initialTopicTitle,
  topicDescription: initialTopicDescription,
  onResourceSelect
}: ResourceSearchModalProps) => {
  const [topicTitle, setTopicTitle] = useState(initialTopicTitle || "");
  const [topicDescription, setTopicDescription] = useState(initialTopicDescription || "");
  const [resourceType, setResourceType] = useState<ResourceType>("both");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<ResourceSearchResult[]>([]);
  const [searchQuality, setSearchQuality] = useState<SearchQuality | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);

  // Update fields when modal opens or topic changes
  useEffect(() => {
    if (isOpen) {
      setTopicTitle(initialTopicTitle || "");
      setTopicDescription(initialTopicDescription || "");
      setHasSearched(false);
      setResults([]);
      setSearchQuality(null);
      setMessage(null);
      setResourceType("both");
    }
  }, [isOpen, initialTopicTitle, initialTopicDescription]);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!topicTitle.trim()) {
      toast.error("Please enter a topic to search for");
      return;
    }

    setIsSearching(true);
    setHasSearched(false);
    setResults([]);
    setSearchQuality(null);
    setMessage(null);
    setSearchProgress(0);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setSearchProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 1000);

    try {
      console.log("Searching for resources...");
      const response = await studyApi.searchResources({
        courseTitle,
        topicTitle: topicTitle.trim(),
        topicDescription: topicDescription.trim() || undefined,
        resourceType,
        maxResults: 10
      });

      console.log("Search response:", response);
      clearInterval(progressInterval);
      setSearchProgress(100);

      if (response.success) {
        setResults(response.resources);
        setSearchQuality(response.searchQuality);
        setMessage(response.message || null);
        setHasSearched(true);

        if (response.resources.length === 0) {
          toast("No resources found. Try refining your search.", {
            icon: "🔍",
            duration: 4000
          });
        } else if (response.searchQuality === "poor") {
          toast("Found limited results. Consider refining your search.", {
            icon: "⚠️",
            duration: 4000
          });
        } else {
          toast.success(`Found ${response.resources.length} resource${response.resources.length !== 1 ? "s" : ""}!`);
        }
      } else {
        toast.error(response.error || "Failed to search for resources");
        setHasSearched(true);
      }
    } catch (error: any) {
      console.error("Search error:", error);
      clearInterval(progressInterval);
      
      // Provide helpful error messages
      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        toast.error("Search timed out. The topic might be too broad - try being more specific.", {
          duration: 5000
        });
      } else if (error.response?.status === 500) {
        toast.error("Server error. Please try again in a moment.", {
          duration: 4000
        });
      } else if (!navigator.onLine) {
        toast.error("No internet connection. Please check your network.", {
          duration: 4000
        });
      } else {
        toast.error("Failed to search for resources. Please try again.", {
          duration: 4000
        });
      }
      
      setHasSearched(true);
    } finally {
      clearInterval(progressInterval);
      setIsSearching(false);
      setTimeout(() => setSearchProgress(0), 500);
    }
  };

  const handleClose = () => {
    setResults([]);
    setSearchQuality(null);
    setMessage(null);
    setHasSearched(false);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Find Resources with AI</h2>
              <p className="text-sm text-slate-600">Discover learning materials and practice resources</p>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-8rem)] overflow-y-auto p-6">
          {/* Pre-filled Topic Info */}
          {initialTopicTitle && (
            <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📚</span>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase text-blue-700 mb-1">Selected Topic</p>
                  <p className="text-sm font-semibold text-slate-900">{initialTopicTitle}</p>
                  {initialTopicDescription && (
                    <p className="text-xs text-slate-600 mt-1">{initialTopicDescription}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Search Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Topic {!initialTopicTitle && <span className="text-rose-500">*</span>}
              </label>
              <input
                type="text"
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                placeholder="e.g., Binary Search Trees"
                disabled={isSearching}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
              {initialTopicTitle && (
                <p className="mt-1 text-xs text-slate-500">You can edit this if needed</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Description (optional)
              </label>
              <textarea
                value={topicDescription}
                onChange={(e) => setTopicDescription(e.target.value)}
                placeholder="Additional context to help find better resources..."
                rows={2}
                disabled={isSearching}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Resource Type
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setResourceType("learn")}
                  className={`flex-1 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    resourceType === "learn"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  📚 Learn
                </button>
                <button
                  onClick={() => setResourceType("practice")}
                  className={`flex-1 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    resourceType === "practice"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  💪 Practice
                </button>
                <button
                  onClick={() => setResourceType("both")}
                  className={`flex-1 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    resourceType === "both"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  🎯 Both
                </button>
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={isSearching || !topicTitle.trim()}
              className="w-full rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Searching with AI...
                </span>
              ) : (
                "🔍 Find Resources"
              )}
            </button>
          </div>

          {/* Loading Skeleton */}
          {isSearching && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">Searching the web with AI...</p>
                <p className="text-xs text-slate-500">{Math.round(searchProgress)}%</p>
              </div>
              
              {/* Progress Bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${searchProgress}%` }}
                />
              </div>
              
              <div className="space-y-3 mt-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex gap-3">
                      <div className="h-12 w-12 rounded-xl bg-slate-200"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-slate-200"></div>
                        <div className="h-3 w-full rounded bg-slate-200"></div>
                        <div className="h-3 w-2/3 rounded bg-slate-200"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="text-xs text-center text-slate-500 mt-4">
                This may take up to 90 seconds for complex searches...
              </p>
            </div>
          )}

          {/* Search Quality Badge & Messages */}
          {hasSearched && searchQuality && (
            <div className="mt-6">
              <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                searchQuality === "excellent"
                  ? "bg-emerald-50 text-emerald-700"
                  : searchQuality === "good"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-yellow-50 text-yellow-700"
              }`}>
                {searchQuality === "excellent" && "✨ Excellent results"}
                {searchQuality === "good" && "👍 Good results"}
                {searchQuality === "poor" && "⚠️ Limited results"}
              </div>
              {message && (
                <p className="mt-2 text-sm text-slate-600">{message}</p>
              )}
              
              {/* Poor Quality Warning */}
              {searchQuality === "poor" && (
                <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">💡</span>
                    <div>
                      <p className="text-sm font-semibold text-yellow-900 mb-2">
                        Tips for better results:
                      </p>
                      <ul className="text-xs text-yellow-800 space-y-1">
                        <li>• Add more context in the description field</li>
                        <li>• Try different keywords or phrasing</li>
                        <li>• Search for more specific or general terms</li>
                        <li>• Try switching between "Learn" and "Practice" modes</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty Results State */}
          {hasSearched && results.length === 0 && !isSearching && (
            <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <span className="text-5xl mb-4 block">🔍</span>
              <p className="text-lg font-semibold text-slate-700 mb-2">No resources found</p>
              <p className="text-sm text-slate-600 mb-4">
                Claude couldn't find relevant resources matching your search.
              </p>
              
              <div className="inline-block text-left bg-white rounded-2xl border border-slate-200 p-4 max-w-md">
                <p className="text-xs font-semibold text-slate-700 mb-2">💡 Suggestions:</p>
                <ul className="text-xs text-slate-600 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span><strong>Be more specific:</strong> Try "Binary Search Tree insertion" instead of just "BST"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span><strong>Add context:</strong> Include what you want to learn in the description</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span><strong>Try alternatives:</strong> Use synonyms or related terms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span><strong>Switch types:</strong> Try searching for "Learn" or "Practice" separately</span>
                  </li>
                </ul>
              </div>
              
              <button
                onClick={handleSearch}
                className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-semibold"
              >
                ← Edit search and try again
              </button>
            </div>
          )}

          {/* Results List */}
          {results.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  Found {results.length} resource{results.length !== 1 ? "s" : ""}
                </p>
                <button
                  onClick={() => {
                    results.forEach((resource) => {
                      onResourceSelect(resource);
                    });
                    toast.success(`Added all ${results.length} resources!`);
                  }}
                  className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  + Add All to Course
                </button>
              </div>
              
              {/* Partial Results Warning (for poor quality with some results) */}
              {searchQuality === "poor" && results.length > 0 && results.length < 3 && (
                <div className="rounded-2xl border border-orange-200 bg-orange-50 p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">⚠️</span>
                    <div>
                      <p className="text-xs font-semibold text-orange-900">Limited results found</p>
                      <p className="text-xs text-orange-700 mt-0.5">
                        Only a few resources matched your search. Try adding more context or adjusting your search terms for better results.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {results.map((resource, index) => (
                <ResourceResultCard
                  key={index}
                  resource={resource}
                  onAdd={onResourceSelect}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ResourceSearchModal;
