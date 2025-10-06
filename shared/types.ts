export type Difficulty = "easy" | "moderate" | "advanced";
export type Profile = "sprint-heavy" | "climb-heavy" | "mixed-intervals" | "rhythm-ride";
export type SegmentType = "warmup" | "sprint" | "climb" | "recovery" | "arm" | "steady" | "cooldown";

export interface Track {
  id: string;
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  energy: number;
  durationSec: number;
  isRemix?: boolean;
  explicit?: boolean;
  decade?: string;
}

export interface SegmentPlan {
  id: string;
  type: SegmentType;
  durationSec: number;
  targetBpmMin: number;
  targetBpmMax: number;
  targetEnergyMin: number;
  targetEnergyMax: number;
}

export interface Prefs {
  genres: string[];
  includeArtists: string[];
  excludeArtists: string[];
  theme: string;
  familiarity: number;
  explicitOk: boolean;
  preferRemixes: boolean;
}

export interface PlaylistPick {
  seg: SegmentPlan;
  track: Track | null;
  score?: number;
}

export interface GenerationInput extends Prefs {
  durationMin: number;
  difficulty: Difficulty;
  profile: Profile;
  armSongs: number;
}

export interface GenerationResponse {
  plan: SegmentPlan[];
  picks: PlaylistPick[];
  totalDurationSec: number;
  source: "heuristic" | "chatgpt" | "fallback";
  notes?: string;
}
