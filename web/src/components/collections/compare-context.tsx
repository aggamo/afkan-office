"use client";

import { createContext, useCallback, useContext, useState } from "react";

const STORAGE_KEY = "afkan_compare";
const MAX_COMPARE = 3;

type CompareContextValue = {
  compareIds: string[];
  isInCompare: (workerId: string) => boolean;
  toggleCompare: (workerId: string) => { limitReached?: boolean };
  clearCompare: () => void;
  removeFromCompare: (workerId: string) => void;
};

const CompareContext = createContext<CompareContextValue | null>(null);

function readStoredCompareIds(): string[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareIds, setCompareIds] = useState<string[]>(readStoredCompareIds);

  const persist = useCallback((ids: string[]) => {
    setCompareIds(ids);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, []);

  const toggleCompare = useCallback(
    (workerId: string) => {
      if (compareIds.includes(workerId)) {
        persist(compareIds.filter((id) => id !== workerId));
        return {};
      }
      if (compareIds.length >= MAX_COMPARE) {
        return { limitReached: true };
      }
      persist([...compareIds, workerId]);
      return {};
    },
    [compareIds, persist],
  );

  const removeFromCompare = useCallback(
    (workerId: string) => persist(compareIds.filter((id) => id !== workerId)),
    [compareIds, persist],
  );

  return (
    <CompareContext.Provider
      value={{
        compareIds,
        isInCompare: (id) => compareIds.includes(id),
        toggleCompare,
        clearCompare: () => persist([]),
        removeFromCompare,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
