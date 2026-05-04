import { useEffect, useRef, useState } from "react";
import { useQueue } from "@/lib/package-queue";

/**
 * Returns true briefly whenever a new job is added to the queue.
 * Useful to trigger attention-grabbing animations on queue indicators.
 */
export const useQueueBump = (durationMs = 1200) => {
  const jobs = useQueue();
  const prevCount = useRef(jobs.length);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (jobs.length > prevCount.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), durationMs);
      prevCount.current = jobs.length;
      return () => clearTimeout(t);
    }
    prevCount.current = jobs.length;
  }, [jobs.length, durationMs]);

  return bump;
};
