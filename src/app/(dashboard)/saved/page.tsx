import { Bookmark } from "lucide-react";
import SavedGrid from "@/components/SavedGrid";
import { SAVED_ARTICLES } from "@/lib/mock-data";

export default function SavedPage() {
  const count = SAVED_ARTICLES.length;

  return (
    <div className="space-y-6">
      {/* Title + badge */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold font-heading text-text-primary flex items-center gap-2">
          <Bookmark size={24} className="text-primary" />
          Saved Articles
        </h1>
        <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
          {count} saved
        </span>
      </div>

      {count === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-bg-surface flex items-center justify-center mb-4">
            <Bookmark size={28} className="text-text-tertiary" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            No saved articles yet
          </h3>
          <p className="text-sm text-text-secondary max-w-sm">
            Bookmark articles you want to read later by clicking the save icon
            on any news card.
          </p>
        </div>
      ) : (
        /* 3-column card grid with stagger animation */
        <SavedGrid articles={SAVED_ARTICLES} />
      )}
    </div>
  );
}
