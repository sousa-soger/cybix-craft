// Lightweight client-side profile store for OAuth + PAT credentials.
// Stored in localStorage for the prototype. Never put real secrets here in production.
import { useEffect, useState } from "react";

export type Provider = "github" | "gitlab";

export interface ProviderConnection {
  connected: boolean;
  username?: string;
  oauthConnectedAt?: string; // ISO
  pat?: string; // masked for display only
  patLabel?: string;
  patUpdatedAt?: string; // ISO
}

export interface ProfileState {
  name: string;
  email: string;
  github: ProviderConnection;
  gitlab: ProviderConnection;
}

const STORAGE_KEY = "deployassist.profile.v1";

const defaultState: ProfileState = {
  name: "Dana Avery",
  email: "dana@deployassist.io",
  github: { connected: false },
  gitlab: { connected: false },
};

const listeners = new Set<() => void>();
let state: ProfileState = load();

function load(): ProfileState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
}

export const profileStore = {
  get: () => state,
  set: (updater: (s: ProfileState) => ProfileState) => {
    state = updater(state);
    persist();
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useProfile() {
  const [snapshot, setSnapshot] = useState(profileStore.get());
  useEffect(() => {
    const unsub = profileStore.subscribe(() => setSnapshot({ ...profileStore.get() }));
    return () => {
      unsub;
    };
  }, []);
  return snapshot;
}

export function connectOAuth(provider: Provider, username?: string) {
  profileStore.set((s) => ({
    ...s,
    [provider]: {
      ...s[provider],
      connected: true,
      username: username ?? (provider === "github" ? "octocat" : "tanuki"),
      oauthConnectedAt: new Date().toISOString(),
    },
  }));
}

export function disconnectOAuth(provider: Provider) {
  profileStore.set((s) => ({
    ...s,
    [provider]: { ...s[provider], connected: false, username: undefined, oauthConnectedAt: undefined },
  }));
}

export function setPAT(provider: Provider, pat: string, label?: string) {
  const masked = pat ? `${pat.slice(0, 4)}••••${pat.slice(-4)}` : "";
  profileStore.set((s) => ({
    ...s,
    [provider]: {
      ...s[provider],
      pat: masked,
      patLabel: label,
      patUpdatedAt: new Date().toISOString(),
    },
  }));
}

export function removePAT(provider: Provider) {
  profileStore.set((s) => ({
    ...s,
    [provider]: { ...s[provider], pat: undefined, patLabel: undefined, patUpdatedAt: undefined },
  }));
}
