import { useSyncExternalStore } from "react";
import type { Environment } from "@/lib/mock-data";

export type QueueStatus = "queued" | "running" | "success" | "failed" | "cancelled";

export const QUEUE_STAGES = [
  "Queued",
  "Downloading",
  "Extracting",
  "Comparing",
  "Generating packages",
  "Compressing",
] as const;

export interface QueueJob {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  repoId: string;
  repoName: string;
  environment: Environment;
  baseVersion: string;
  targetVersion: string;
  generateRollback: boolean;
  outputFormat: "ZIP" | "TAR.GZ" | "BOTH";
  status: QueueStatus;
  stageIdx: number;
  progress: number;
  createdAt: number;
  finishedAt?: number;
}

type Listener = () => void;

const listeners = new Set<Listener>();
let jobs: QueueJob[] = [];

const emit = () => {
  // create new array reference for change detection
  jobs = [...jobs];
  listeners.forEach((l) => l());
};

const updateJob = (id: string, patch: Partial<QueueJob>) => {
  jobs = jobs.map((j) => (j.id === id ? { ...j, ...patch } : j));
  listeners.forEach((l) => l());
};

// Background simulation — single interval, processes one running job at a time.
let intervalId: ReturnType<typeof setInterval> | null = null;

const tick = () => {
  // promote first queued to running if no running job
  const running = jobs.find((j) => j.status === "running");
  if (!running) {
    const next = jobs.find((j) => j.status === "queued");
    if (next) {
      updateJob(next.id, { status: "running", stageIdx: 1, progress: 2 });
    }
    return;
  }
  const next = Math.min(100, running.progress + 2 + Math.random() * 4);
  const stageIdx = Math.min(QUEUE_STAGES.length - 1, Math.floor((next / 100) * QUEUE_STAGES.length));
  if (next >= 100) {
    updateJob(running.id, {
      status: "success",
      progress: 100,
      stageIdx: QUEUE_STAGES.length - 1,
      finishedAt: Date.now(),
    });
  } else {
    updateJob(running.id, { progress: next, stageIdx });
  }
};

const ensureInterval = () => {
  if (intervalId) return;
  intervalId = setInterval(tick, 250);
};

export const enqueueJob = (
  spec: Omit<QueueJob, "id" | "status" | "stageIdx" | "progress" | "createdAt">,
): QueueJob => {
  const job: QueueJob = {
    ...spec,
    id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    status: "queued",
    stageIdx: 0,
    progress: 0,
    createdAt: Date.now(),
  };
  jobs = [job, ...jobs];
  listeners.forEach((l) => l());
  ensureInterval();
  return job;
};

export const cancelJob = (id: string) => {
  updateJob(id, { status: "cancelled", finishedAt: Date.now() });
};

export const removeJob = (id: string) => {
  jobs = jobs.filter((j) => j.id !== id);
  listeners.forEach((l) => l());
};

export const clearCompleted = () => {
  jobs = jobs.filter((j) => j.status === "queued" || j.status === "running");
  listeners.forEach((l) => l());
};

const subscribe = (l: Listener) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const getSnapshot = () => jobs;

export const useQueue = (): QueueJob[] =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

export const useActiveCount = () => {
  const q = useQueue();
  return q.filter((j) => j.status === "queued" || j.status === "running").length;
};
