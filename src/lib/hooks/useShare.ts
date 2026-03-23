"use client";

import { useCallback } from "react";

interface UseShareOptions {
  onSuccess?: (message: string) => void;
}

interface UseShareReturn {
  share: (title: string, url: string) => Promise<void>;
}

export function useShare(options?: UseShareOptions): UseShareReturn {
  const share = useCallback(
    async (title: string, url: string): Promise<void> => {
      // Try native Web Share API first
      if (typeof navigator !== "undefined" && "share" in navigator) {
        try {
          await navigator.share({ title, url });
          return;
        } catch (err) {
          // User cancelled or share failed — fall through to clipboard
          if (err instanceof Error && err.name === "AbortError") {
            return; // User intentionally cancelled, do nothing
          }
        }
      }

      // Fallback: copy URL to clipboard
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(url);
          options?.onSuccess?.("Link copied!");
          return;
        } catch {
          // Clipboard API failed, try legacy approach
        }
      }

      // Legacy fallback for clipboard
      if (typeof document !== "undefined") {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        options?.onSuccess?.("Link copied!");
      }
    },
    [options]
  );

  return { share };
}
