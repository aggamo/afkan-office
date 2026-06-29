"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { addFavorite, removeFavorite, fetchFavorites, ApiError } from "@/lib/api";
import { getAuthRole, getAuthToken } from "@/lib/auth-client";

type FavoritesContextValue = {
  favoriteIds: Set<string>;
  isFavorite: (workerId: string) => boolean;
  toggleFavorite: (workerId: string) => Promise<{ requiresAuth?: boolean; error?: string }>;
  ready: boolean;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  const hydrate = useCallback(async () => {
    const token = getAuthToken();
    const role = getAuthRole();
    if (!token || role !== "customer") {
      setFavoriteIds(new Set());
      setReady(true);
      return;
    }
    try {
      const items = await fetchFavorites(token);
      setFavoriteIds(new Set(items.map((w) => String(w.id))));
    } catch {
      setFavoriteIds(new Set());
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => hydrate());
    window.addEventListener("afkan-auth-changed", hydrate);
    return () => window.removeEventListener("afkan-auth-changed", hydrate);
  }, [hydrate]);

  const toggleFavorite = useCallback(
    async (workerId: string) => {
      const token = getAuthToken();
      const role = getAuthRole();
      if (!token || role !== "customer") {
        return { requiresAuth: true };
      }

      const isCurrentlyFavorite = favoriteIds.has(workerId);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyFavorite) next.delete(workerId);
        else next.add(workerId);
        return next;
      });

      try {
        if (isCurrentlyFavorite) {
          await removeFavorite(workerId, token);
        } else {
          await addFavorite(workerId, token);
        }
        return {};
      } catch (err) {
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (isCurrentlyFavorite) next.add(workerId);
          else next.delete(workerId);
          return next;
        });
        return { error: err instanceof ApiError ? err.message : "error" };
      }
    },
    [favoriteIds],
  );

  return (
    <FavoritesContext.Provider
      value={{ favoriteIds, isFavorite: (id) => favoriteIds.has(id), toggleFavorite, ready }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
