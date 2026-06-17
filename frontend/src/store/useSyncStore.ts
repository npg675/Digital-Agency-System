import { create } from 'zustand';
import { useEffect, useCallback } from 'react';

interface SyncState {
  version: number;
  increment: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  version: 0,
  increment: () => set((state) => ({ version: state.version + 1 })),
}));

export const useCrossTabSync = () => {
  const increment = useSyncStore((s) => s.increment);

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    const channel = new BroadcastChannel('app-sync');
    
    channel.onmessage = (e) => {
      if (e.data === 'sync') {
        increment();
      }
    };

    return () => {
      channel.close();
    };
  }, [increment]);

  const broadcastSync = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const channel = new BroadcastChannel('app-sync');
    channel.postMessage('sync');
    channel.close();
    
    // Also increment locally so the current tab updates
    increment();
  }, [increment]);

  return { broadcastSync };
};
