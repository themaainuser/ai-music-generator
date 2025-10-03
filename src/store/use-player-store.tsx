import { create } from "zustand";

interface PlayerTrack {
  id: string;
  title: string | null;
  instrumental: boolean;
  url: string | null;
  artwork: string | null;
  prompt: string | null;
  createdByUserName: string | null;
}

interface PlayerStore {
  track: PlayerTrack | null;
  setTrack: (track: PlayerTrack | null) => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  track: null,
  setTrack: (track) => set({ track }),
}));
