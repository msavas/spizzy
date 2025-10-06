import React, { useEffect, useMemo, useState } from "react";
import { ALL_GENRES, MOCK_TRACKS } from "../shared/library";
import { buildPlan } from "../shared/planner";
import { generatePlaylist, scoreTrack } from "../shared/generator";
import type {
  Difficulty,
  Profile,
  Prefs,
  PlaylistPick,
  SegmentPlan,
  GenerationResponse,
} from "../shared/types";
import { requestAiPlaylist } from "./api/client";

const secToMin = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const SegLabel: Record<string, string> = {
  warmup: "Warm-Up",
  sprint: "Sprint",
  climb: "Climb",
  recovery: "Recovery",
  arm: "Arm Song",
  steady: "Steady",
  cooldown: "Cooldown",
};

type Mode = "mock" | "ai";
type AiStatus = "idle" | "loading" | "success" | "error";

export default function SpinSmithApp() {
  const [durationMin, setDurationMin] = useState<number>(45);
  const [difficulty, setDifficulty] = useState<Difficulty>("moderate");
  const [profile, setProfile] = useState<Profile>("mixed-intervals");
  const [genres, setGenres] = useState<string[]>(["pop", "edm"]);
  const [includeArtists, setIncludeArtists] = useState<string>("");
  const [excludeArtists, setExcludeArtists] = useState<string>("");
  const [theme, setTheme] = useState<string>("");
  const [armSongs, setArmSongs] = useState<number>(1);
  const [familiarity, setFamiliarity] = useState<number>(50);
  const [preferRemixes, setPreferRemixes] = useState<boolean>(true);
  const [explicitOk, setExplicitOk] = useState<boolean>(false);

  const [mode, setMode] = useState<Mode>("mock");
  const [aiStatus, setAiStatus] = useState<AiStatus>("idle");
  const [aiResult, setAiResult] = useState<GenerationResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiDirty, setAiDirty] = useState<boolean>(false);

  const prefs: Prefs = useMemo(
    () => ({
      genres,
      includeArtists: includeArtists.split(",").map((s) => s.trim()).filter(Boolean),
      excludeArtists: excludeArtists.split(",").map((s) => s.trim()).filter(Boolean),
      theme,
      familiarity,
      explicitOk,
      preferRemixes,
    }),
    [genres, includeArtists, excludeArtists, theme, familiarity, explicitOk, preferRemixes],
  );

  const plan = useMemo(() => buildPlan(durationMin, difficulty, profile, armSongs), [durationMin, difficulty, profile, armSongs]);
  const mockPicks = useMemo(() => generatePlaylist(plan, prefs), [plan, prefs]);

  useEffect(() => {
    if (mode !== "ai") return;
    setAiDirty(true);
  }, [mode, durationMin, difficulty, profile, armSongs, prefs]);

  useEffect(() => {
    if (mode === "mock") {
      setAiResult(null);
      setAiStatus("idle");
      setAiError(null);
      setAiDirty(false);
    }
  }, [mode]);

  const usingAi = mode === "ai" && aiResult !== null;
  const activePlan: SegmentPlan[] = mode === "ai" && aiResult && !aiDirty ? aiResult.plan : plan;
  const playlistForDisplay: PlaylistPick[] = mode === "ai" ? aiResult?.picks ?? [] : mockPicks;
  const totalPlanned = useMemo(() => activePlan.reduce((acc, seg) => acc + seg.durationSec, 0), [activePlan]);
  const totalActual = useMemo(
    () => playlistForDisplay.reduce((acc, pick) => acc + (pick.track?.durationSec ?? 0), 0),
    [playlistForDisplay],
  );

  const generationSource = usingAi ? aiResult!.source : "heuristic";

  function toggleGenre(genre: string) {
    setGenres((prev) => (prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]));
  }

  function explainMode(): string {
    return mode === "ai"
      ? "Calls the SpinSmith server which can use ChatGPT when an API key is configured."
      : "Runs the heuristic generator in your browser using the demo catalog.";
  }

  async function handleGenerate() {
    if (mode !== "ai") return;
    setAiStatus("loading");
    setAiError(null);
    try {
      const response = await requestAiPlaylist({
        durationMin,
        difficulty,
        profile,
        armSongs,
        ...prefs,
      });
      setAiResult(response);
      setAiStatus("success");
      setAiDirty(false);
    } catch (error) {
      setAiStatus("error");
      setAiResult(null);
      const message = error instanceof Error ? error.message : "Failed to generate playlist.";
      setAiError(message);
    }
  }

  function replaceTrack(segId: string) {
    if (mode === "ai") {
      alert("Re-run the ChatGPT generation to refresh tracks after tweaking your inputs.");
      return;
    }

    const seg = plan.find((s) => s.id === segId);
    if (!seg) return;

    const used = new Set(mockPicks.map((p) => p.track?.id).filter(Boolean) as string[]);
    let bestTrack: typeof MOCK_TRACKS[number] | null = null;
    let bestScore = -1;
    for (const track of MOCK_TRACKS) {
      if (used.has(track.id)) continue;
      const score = scoreTrack(track, seg, prefs);
      if (score > bestScore) {
        bestTrack = track;
        bestScore = score;
      }
    }

    if (!bestTrack) {
      alert("No alternate tracks available in the demo catalog.");
      return;
    }

    alert(
      `Next up suggestion: ${bestTrack.title} by ${bestTrack.artist}. Swap it in manually for this MVP demo.`,
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900">
      <header className="px-5 md:px-10 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            SpinSmith <span className="text-slate-500 font-normal">— Playlist Builder</span>
          </h1>
          <div className="text-sm text-slate-600">Heuristic + ChatGPT-powered alpha</div>
        </div>
      </header>

      <main className="px-5 md:px-10 grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6 pb-14">
        <div className="lg:col-span-1 space-y-5">
          <SectionCard title="Class Setup">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-600">Duration (min)</label>
                <Input
                  type="number"
                  min={20}
                  max={120}
                  value={durationMin}
                  onChange={(e) => setDurationMin(parseInt(e.target.value || "45"))}
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">Difficulty</label>
                <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
                  <option value="easy">Easy</option>
                  <option value="moderate">Moderate</option>
                  <option value="advanced">Advanced</option>
                </Select>
              </div>
              <div className="col-span-2">
                <label className="text-sm text-slate-600">Ride Profile</label>
                <Select value={profile} onChange={(e) => setProfile(e.target.value as Profile)}>
                  <option value="sprint-heavy">Sprint-heavy</option>
                  <option value="climb-heavy">Climb-heavy</option>
                  <option value="mixed-intervals">Mixed intervals</option>
                  <option value="rhythm-ride">Rhythm ride</option>
                </Select>
              </div>
              <div>
                <label className="text-sm text-slate-600">Arm Songs</label>
                <Select value={String(armSongs)} onChange={(e) => setArmSongs(parseInt(e.target.value))}>
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                </Select>
              </div>
              <div>
                <label className="text-sm text-slate-600">Explicit content</label>
                <Select value={explicitOk ? "yes" : "no"} onChange={(e) => setExplicitOk(e.target.value === "yes")}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </Select>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Music Preferences">
            <div>
              <div className="text-sm text-slate-600 mb-1">Genres</div>
              <div>
                {ALL_GENRES.map((g) => (
                  <GenrePill key={g} label={g} selected={genres.includes(g)} onToggle={() => toggleGenre(g)} />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-sm text-slate-600">Include artists (comma-separated)</label>
                <Input placeholder="e.g., Avicii, Rihanna" value={includeArtists} onChange={(e) => setIncludeArtists(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-slate-600">Exclude artists</label>
                <Input placeholder="e.g., Metallica" value={excludeArtists} onChange={(e) => setExcludeArtists(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-slate-600">Theme keywords</label>
                <Input placeholder="e.g., metal Disney covers" value={theme} onChange={(e) => setTheme(e.target.value)} />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600">Familiar ↔ Fresh</span>
                  <Badge>{familiarity}</Badge>
                </div>
                <Slider value={familiarity} onChange={setFamiliarity} />
              </div>
              <div className="flex items-center gap-3 mt-2 md:mt-6">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={preferRemixes} onChange={(e) => setPreferRemixes(e.target.checked)} />
                  Prefer remixes/extended edits
                </label>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Generation" right={<Badge>{mode === "ai" ? "ChatGPT" : "Heuristic"}</Badge>}>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-slate-600">Mode</label>
                <Select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
                  <option value="mock">On-device demo</option>
                  <option value="ai">ChatGPT via server</option>
                </Select>
                <p className="text-xs text-slate-500 mt-1">{explainMode()}</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">Planned duration</div>
                <div className="text-sm font-medium">{secToMin(totalPlanned)}</div>
              </div>
              <button
                onClick={handleGenerate}
                disabled={mode === "mock" || aiStatus === "loading"}
                className={`mt-1 w-full rounded-xl px-4 py-2.5 text-sm font-medium shadow transition ${mode === "mock" ? "bg-slate-200 text-slate-500 cursor-not-allowed" : "bg-slate-900 text-white hover:bg-slate-800"}`}
              >
                {mode === "mock" ? "Auto generated" : aiStatus === "loading" ? "Generating…" : "Generate with ChatGPT"}
              </button>
              {mode === "ai" && (
                <div className="text-xs text-slate-500 space-y-1">
                  <p>Provide your OpenAI API key to the server before running this mode.</p>
                  {aiStatus === "error" && aiError && <p className="text-rose-600">{aiError}</p>}
                  {aiStatus === "success" && aiDirty && <p className="text-amber-600">Inputs changed — regenerate to refresh the AI plan.</p>}
                  {aiStatus === "success" && !aiDirty && aiResult?.notes && <p className="text-slate-600">{aiResult.notes}</p>}
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <SectionCard title="Segment Plan" right={<Badge>{profile}</Badge>}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Segment</th>
                    <th className="py-2 pr-3">Target BPM</th>
                    <th className="py-2 pr-3">Target Energy</th>
                    <th className="py-2 pr-3 text-right">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {activePlan.map((segment, idx) => (
                    <tr key={segment.id} className="border-t border-slate-200">
                      <td className="py-2 pr-3 text-slate-500">{idx + 1}</td>
                      <td className="py-2 pr-3">
                        <Badge>{SegLabel[segment.type] ?? segment.type}</Badge>
                      </td>
                      <td className="py-2 pr-3">
                        {segment.targetBpmMin}–{segment.targetBpmMax}
                      </td>
                      <td className="py-2 pr-3">
                        {Math.round(segment.targetEnergyMin * 100)}–{Math.round(segment.targetEnergyMax * 100)}
                      </td>
                      <td className="py-2 pr-3 text-right">{secToMin(segment.durationSec)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Generated Playlist">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-600">Total actual</div>
              <div className={`text-sm font-medium ${Math.abs(totalActual - totalPlanned) <= 30 ? "text-emerald-600" : "text-amber-600"}`}>
                {secToMin(totalActual)} {Math.abs(totalActual - totalPlanned) <= 30 ? "(≈ fit)" : "(loose fit)"}
              </div>
            </div>
            {mode === "ai" && aiStatus === "idle" && <p className="text-sm text-slate-500">Run ChatGPT generation to populate this list.</p>}
            {mode === "ai" && aiStatus === "loading" && <p className="text-sm text-slate-500">ChatGPT is crafting your ride…</p>}
            <ul className="divide-y divide-slate-200 rounded-xl overflow-hidden border border-slate-200">
              {playlistForDisplay.map((pick, idx) => (
                <li key={pick.seg.id} className="bg-white/70 p-3 md:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge>
                          {idx + 1}. {SegLabel[pick.seg.type] ?? pick.seg.type}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {pick.seg.targetBpmMin}–{pick.seg.targetBpmMax} bpm
                        </span>
                      </div>
                      {pick.track ? (
                        <>
                          <div className="font-medium truncate">
                            {pick.track.title} <span className="text-slate-500 font-normal">• {pick.track.artist}</span>
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-3 flex-wrap">
                            <span className="uppercase tracking-wide">{pick.track.genre}</span>
                            <span>{pick.track.bpm} bpm</span>
                            <span>{secToMin(pick.track.durationSec)}</span>
                            {pick.track.isRemix && <Badge>Remix</Badge>}
                            {pick.track.explicit && <Badge>Explicit</Badge>}
                          </div>
                        </>
                      ) : (
                        <div className="italic text-slate-500">No match found (expand genres or allow explicit)</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => replaceTrack(pick.seg.id)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm"
                      >
                        Replace
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mt-4">
              <button className="rounded-xl bg-slate-900 text-white px-4 py-2 hover:bg-slate-800 shadow" disabled>
                Export to Spotify (coming soon)
              </button>
              <button className="rounded-xl border border-slate-300 px-4 py-2 text-slate-800 hover:bg-slate-100" disabled>
                Save as Template
              </button>
              <div className="text-xs text-slate-500 md:ml-auto">
                Source: {generationSource === "heuristic" ? "Demo heuristic" : generationSource === "chatgpt" ? "ChatGPT" : "Fallback"}
              </div>
            </div>
          </SectionCard>
        </div>
      </main>

      <footer className="px-5 md:px-10 pb-10 text-xs text-slate-500 space-y-1">
        <p>
          SpinSmith now includes a lightweight Node server that can call ChatGPT when the <code>OPENAI_API_KEY</code> environment
          variable is set. Without a key, the server falls back to the on-device heuristic.
        </p>
        <p>
          In production we will authenticate to streaming providers, fetch audio features, and push finalized playlists directly to
          instructor accounts.
        </p>
      </footer>
    </div>
  );
}

const SectionCard: React.FC<{ title: string; children: React.ReactNode; right?: React.ReactNode }> = ({ title, children, right }) => (
  <div className="bg-white/70 backdrop-blur rounded-2xl shadow p-4 md:p-6 border border-slate-200">
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-slate-800 font-semibold text-lg">{title}</h2>
      {right}
    </div>
    {children}
  </div>
);

const GenrePill: React.FC<{ label: string; selected: boolean; onToggle: () => void }> = ({ label, selected, onToggle }) => (
  <button
    onClick={onToggle}
    className={`px-3 py-1.5 rounded-full border text-sm mr-2 mb-2 transition ${selected ? "bg-slate-900 text-white border-slate-900" : "border-slate-300 text-slate-700 hover:bg-slate-100"}`}
  >
    {label}
  </button>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className={`w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400 ${props.className ?? ""}`}
  />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select
    {...props}
    className={`w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400 ${props.className ?? ""}`}
  >
    {props.children}
  </select>
);

const Slider: React.FC<{ value: number; onChange: (value: number) => void }> = ({ value, onChange }) => (
  <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
);

const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
    {children}
  </span>
);
