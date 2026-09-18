'use client';

import { useEffect } from 'react';
import type { IncidentResponse } from '@responder/lib/schema';

interface KeyboardNavigationOptions {
  incidents: IncidentResponse[] | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClear: () => void;
  onRefresh: () => void;
}

export function useKeyboardNavigation({
  incidents,
  selectedId,
  onSelect,
  onClear,
  onRefresh,
}: KeyboardNavigationOptions) {
  useEffect(() => {
    const list = incidents || [];
    if (list.length === 0) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const activeList = incidents || [];
      if (activeList.length === 0) return;

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = activeList.findIndex((i) => i.id === selectedId);
        const nextIndex = currentIndex < activeList.length - 1 ? currentIndex + 1 : 0;
        onSelect(activeList[nextIndex].id);
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = activeList.findIndex((i) => i.id === selectedId);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : activeList.length - 1;
        onSelect(activeList[prevIndex].id);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClear();
      } else if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onRefresh();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [incidents, selectedId, onSelect, onClear, onRefresh]);
}
