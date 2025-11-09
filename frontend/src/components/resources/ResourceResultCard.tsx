import type { ResourceSearchResult } from "@studymap/types";

type ResourceResultCardProps = {
  resource: ResourceSearchResult;
  onAdd: (resource: ResourceSearchResult) => void;
};

const getContentTypeIcon = (contentType: string): string => {
  const icons: Record<string, string> = {
    video: "🎥",
    article: "📄",
    tutorial: "📖",
    interactive: "🎮",
    documentation: "📚",
    exercise: "💪",
    simulation: "🔬"
  };
  return icons[contentType] || "🔗";
};

const getResourceTypeColor = (resourceType: string): string => {
  if (resourceType === "learn") return "bg-purple-50 text-purple-700 border-purple-200";
  if (resourceType === "practice") return "bg-orange-50 text-orange-700 border-orange-200";
  return "bg-blue-50 text-blue-700 border-blue-200";
};

const getQualityBadge = (quality: string) => {
  const configs = {
    high: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      icon: "⭐"
    },
    medium: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      icon: "👍"
    },
    low: {
      bg: "bg-slate-50",
      text: "text-slate-600",
      border: "border-slate-200",
      icon: "📌"
    }
  };
  
  return configs[quality as keyof typeof configs] || configs.medium;
};

const ResourceResultCard = ({ resource, onAdd }: ResourceResultCardProps) => {
  const qualityConfig = getQualityBadge(resource.quality);
  const contentIcon = getContentTypeIcon(resource.contentType);
  const resourceTypeColor = getResourceTypeColor(resource.resourceType);

  // Extract domain from URL for display
  const getDomain = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all">
      <div className="flex gap-4">
        {/* Content Type Icon */}
        <div className="flex-shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 text-2xl">
            {contentIcon}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-semibold text-slate-900 text-base mb-1.5 group-hover:text-blue-600 transition-colors">
            {resource.title}
          </h3>

          {/* Summary */}
          <p className="text-sm text-slate-600 leading-relaxed mb-3">
            {resource.summary}
          </p>

          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {/* Quality Badge */}
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${qualityConfig.bg} ${qualityConfig.text} ${qualityConfig.border}`}>
              <span>{qualityConfig.icon}</span>
              <span className="capitalize">{resource.quality}</span>
            </span>

            {/* Content Type Badge */}
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
              <span>{contentIcon}</span>
              <span className="capitalize">{resource.contentType}</span>
            </span>

            {/* Resource Type Badge */}
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${resourceTypeColor}`}>
              {resource.resourceType === "learn" && "📚 Learn"}
              {resource.resourceType === "practice" && "💪 Practice"}
              {resource.resourceType === "both" && "🎯 Both"}
            </span>
          </div>

          {/* Link & Actions */}
          <div className="flex items-center justify-between gap-3">
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 hover:underline truncate"
              title={resource.url}
            >
              <span className="truncate">{getDomain(resource.url)}</span>
              <svg className="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            <button
              onClick={() => onAdd(resource)}
              className="flex-shrink-0 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 active:scale-95 transition-all"
            >
              + Add to Course
            </button>
          </div>
        </div>
      </div>

      {/* Hover Effect Line */}
      <div className="mt-4 h-0.5 w-0 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 group-hover:w-full rounded-full"></div>
    </div>
  );
};

export default ResourceResultCard;
