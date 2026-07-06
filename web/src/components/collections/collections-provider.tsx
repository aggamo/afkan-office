"use client";

import { FavoritesProvider } from "./favorites-context";
import { CompareProvider } from "./compare-context";
import { CompareBar } from "./compare-bar";

export function CollectionsProvider({ children }: { children: React.ReactNode }) {
  return (
    <FavoritesProvider>
      <CompareProvider>
        {children}
        <CompareBar />
      </CompareProvider>
    </FavoritesProvider>
  );
}
