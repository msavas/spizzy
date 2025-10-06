import { MOCK_TRACKS } from "./library";
import type { PlaylistPick, Prefs, SegmentPlan, Track } from "./types";

export function scoreTrack(track: Track, seg: SegmentPlan, prefs: Prefs): number {
  const bpmFit = track.bpm >= seg.targetBpmMin && track.bpm <= seg.targetBpmMax
    ? 1
    : 1 - (Math.min(Math.abs(track.bpm - (track.bpm < seg.targetBpmMin ? seg.targetBpmMin : seg.targetBpmMax)), 50) / 50);

  const energyFit = track.energy >= seg.targetEnergyMin && track.energy <= seg.targetEnergyMax ? 1 : 0.5;

  const genreFit = prefs.genres.length === 0 || prefs.genres.includes(track.genre) ? 1 : 0.7;
  const includeArtistBoost = prefs.includeArtists.length && prefs.includeArtists.some(a => track.artist.toLowerCase().includes(a.toLowerCase())) ? 1.15 : 1.0;
  const excludePenalty = prefs.excludeArtists.length && prefs.excludeArtists.some(a => track.artist.toLowerCase().includes(a.toLowerCase())) ? 0.1 : 1.0;

  const theme = prefs.theme.trim().toLowerCase();
  const themeMatch = theme ? (track.title.toLowerCase().includes(theme) || track.artist.toLowerCase().includes(theme) ? 1.1 : 1.0) : 1.0;

  if (!prefs.explicitOk && track.explicit) return 0.01;

  const remixBoost = prefs.preferRemixes ? (track.isRemix ? 1.1 : 0.95) : 1.0;

  const familiarity = prefs.familiarity;
  const freshBoost = familiarity > 50 ? (track.isRemix || (track.decade && track.decade !== "2020s") ? 1.05 : 0.98) : (track.genre === "pop" || track.genre === "edm" ? 1.05 : 1.0);

  const base = 0.5 * bpmFit + 0.25 * energyFit + 0.15 * genreFit + 0.10;
  return base * includeArtistBoost * excludePenalty * themeMatch * remixBoost * freshBoost;
}

export function pickForSegment(seg: SegmentPlan, prefs: Prefs, usedIds: Set<string>): { track: Track | null; score: number } {
  let best: Track | null = null;
  let bestScore = -1;
  for (const track of MOCK_TRACKS) {
    if (usedIds.has(track.id)) continue;
    const score = scoreTrack(track, seg, prefs);
    if (score > bestScore) {
      best = track;
      bestScore = score;
    }
  }
  return { track: best, score: bestScore };
}

export function generatePlaylist(segs: SegmentPlan[], prefs: Prefs): PlaylistPick[] {
  const used = new Set<string>();
  const picks: PlaylistPick[] = [];
  for (const seg of segs) {
    const { track, score } = pickForSegment(seg, prefs, used);
    if (track) {
      used.add(track.id);
    }
    picks.push({ seg, track, score });
  }
  return picks;
}

export function summarizePlaylist(picks: PlaylistPick[]): string {
  return picks.map((pick, idx) => {
    if (!pick.track) {
      return `${idx + 1}. ${pick.seg.type} — (no match)`;
    }
    return `${idx + 1}. ${pick.seg.type}: ${pick.track.title} by ${pick.track.artist} (${pick.track.bpm} bpm)`;
  }).join("\n");
}
