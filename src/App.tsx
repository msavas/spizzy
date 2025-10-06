import React, { useMemo, useState } from "react";

// Simple, dependency-free MVP front-end (React + Tailwind). No external UI libs.
// Mock generation logic on the client to preview UX.

// ------------------ Types ------------------
type Difficulty = "easy" | "moderate" | "advanced";
type Profile = "sprint-heavy" | "climb-heavy" | "mixed-intervals" | "rhythm-ride";

type Track = {
  id: string;
  title: string;
  artist: string;
  genre: string; // one primary genre tag
  bpm: number; // integer bpm
  energy: number; // 0..1
  durationSec: number; // whole seconds
  isRemix?: boolean;
  explicit?: boolean;
  decade?: string; // e.g. "2010s"
};

type SegmentType = "warmup" | "sprint" | "climb" | "recovery" | "arm" | "steady" | "cooldown";

interface SegmentPlan {
  id: string;
  type: SegmentType;
  durationSec: number;
  targetBpmMin: number;
  targetBpmMax: number;
  targetEnergyMin: number;
  targetEnergyMax: number;
}

// ------------------ Mock Library ------------------
// NOTE: In production this comes from Spotify/Apple APIs + audio features.
const MOCK_TRACKS: Track[] = [
  { id: "t1", title: "Blinding Lights", artist: "The Weeknd", genre: "pop", bpm: 171, energy: 0.9, durationSec: 200, decade: "2020s" },
  { id: "t2", title: "Titanium (feat. Sia)", artist: "David Guetta", genre: "edm", bpm: 126, energy: 0.86, durationSec: 245, decade: "2010s" },
  { id: "t3", title: "Levitating", artist: "Dua Lipa", genre: "pop", bpm: 103, energy: 0.82, durationSec: 203, decade: "2020s" },
  { id: "t4", title: "Believer", artist: "Imagine Dragons", genre: "rock", bpm: 125, energy: 0.85, durationSec: 204, decade: "2010s" },
  { id: "t5", title: "Industry Baby", artist: "Lil Nas X", genre: "hiphop", bpm: 150, energy: 0.88, durationSec: 212, decade: "2020s", explicit: true },
  { id: "t6", title: "Lose Yourself", artist: "Eminem", genre: "hiphop", bpm: 171, energy: 0.88, durationSec: 326, decade: "2000s", explicit: true },
  { id: "t7", title: "Don't Stop Me Now", artist: "Queen", genre: "rock", bpm: 156, energy: 0.95, durationSec: 210, decade: "1970s" },
  { id: "t8", title: "Hysteria", artist: "Muse", genre: "rock", bpm: 187, energy: 0.92, durationSec: 228, decade: "2000s" },
  { id: "t9", title: "On My Way (Alan Walker)", artist: "Alan Walker", genre: "edm", bpm: 170, energy: 0.83, durationSec: 191, decade: "2010s" },
  { id: "t10", title: "Bad Guy (Remix)", artist: "Billie Eilish", genre: "pop", bpm: 135, energy: 0.78, durationSec: 194, isRemix: true, decade: "2010s" },
  { id: "t11", title: "Enter Sandman", artist: "Metallica", genre: "rock", bpm: 124, energy: 0.89, durationSec: 331, decade: "1990s" },
  { id: "t12", title: "Stronger", artist: "Kanye West", genre: "hiphop", bpm: 104, energy: 0.83, durationSec: 311, decade: "2000s", explicit: true },
  { id: "t13", title: "Where Are Ü Now", artist: "Skrillex & Diplo", genre: "edm", bpm: 140, energy: 0.8, durationSec: 247, decade: "2010s" },
  { id: "t14", title: "We Found Love", artist: "Rihanna", genre: "pop", bpm: 128, energy: 0.9, durationSec: 224, decade: "2010s" },
  { id: "t15", title: "Sandstorm", artist: "Darude", genre: "edm", bpm: 136, energy: 0.95, durationSec: 228, decade: "2000s" },
  { id: "t16", title: "Mr. Brightside", artist: "The Killers", genre: "rock", bpm: 148, energy: 0.91, durationSec: 222, decade: "2000s" },
  { id: "t17", title: "The Trooper", artist: "Iron Maiden", genre: "rock", bpm: 160, energy: 0.94, durationSec: 248, decade: "1980s" },
  { id: "t18", title: "Uptown Funk", artist: "Mark Ronson", genre: "pop", bpm: 115, energy: 0.9, durationSec: 270, decade: "2010s" },
  { id: "t19", title: "Seven Nation Army", artist: "The White Stripes", genre: "rock", bpm: 124, energy: 0.8, durationSec: 231, decade: "2000s" },
  { id: "t20", title: "Rain On Me", artist: "Lady Gaga", genre: "pop", bpm: 123, energy: 0.86, durationSec: 182, decade: "2020s" },
  { id: "t21", title: "Levels", artist: "Avicii", genre: "edm", bpm: 126, energy: 0.93, durationSec: 221, decade: "2010s" },
  { id: "t22", title: "Waka Waka", artist: "Shakira", genre: "latin", bpm: 128, energy: 0.85, durationSec: 201, decade: "2010s" },
  { id: "t23", title: "Thunderstruck", artist: "AC/DC", genre: "rock", bpm: 134, energy: 0.96, durationSec: 292, decade: "1990s" },
  { id: "t24", title: "Can't Hold Us", artist: "Macklemore", genre: "hiphop", bpm: 146, energy: 0.9, durationSec: 270, decade: "2010s" },
  { id: "t25", title: "Hall of Fame", artist: "The Script", genre: "pop", bpm: 85, energy: 0.7, durationSec: 201, decade: "2010s" },
  { id: "t26", title: "Numb", artist: "Linkin Park", genre: "rock", bpm: 110, energy: 0.88, durationSec: 185, decade: "2000s" },
  { id: "t27", title: "Eye of the Tiger", artist: "Survivor", genre: "rock", bpm: 109, energy: 0.86, durationSec: 245, decade: "1980s" },
  { id: "t28", title: "Gasolina", artist: "Daddy Yankee", genre: "latin", bpm: 95, energy: 0.94, durationSec: 193, decade: "2000s" },
  { id: "t29", title: "Calm Down", artist: "Rema", genre: "afrobeats", bpm: 107, energy: 0.73, durationSec: 239, decade: "2020s" },
  { id: "t30", title: "Zombie", artist: "The Cranberries", genre: "rock", bpm: 167, energy: 0.84, durationSec: 306, decade: "1990s" },
  { id: "t31", title: "Let It Go (Metal Cover)", artist: "Frog Leap", genre: "rock", bpm: 140, energy: 0.92, durationSec: 232, isRemix: true, decade: "2010s" },
  { id: "t32", title: "Surface Pressure (Rock Cover)", artist: "Jonathan Young", genre: "rock", bpm: 150, energy: 0.91, durationSec: 208, isRemix: true, decade: "2020s" },
  { id: "t33", title: "Holding Out for a Hero (Remix)", artist: "Bonnie Tyler", genre: "pop", bpm: 150, energy: 0.9, durationSec: 220, isRemix: true, decade: "1980s" },
  { id: "t34", title: "Party Rock Anthem", artist: "LMFAO", genre: "edm", bpm: 130, energy: 0.92, durationSec: 262, decade: "2010s" },
  { id: "t35", title: "Heat Waves", artist: "Glass Animals", genre: "indie", bpm: 80, energy: 0.65, durationSec: 238, decade: "2020s" },
  { id: "t36", title: "Take On Me (Kygo Remix)", artist: "a-ha", genre: "edm", bpm: 114, energy: 0.86, durationSec: 215, isRemix: true, decade: "2010s" },
  { id: "t37", title: "Higher Love (Kygo Remix)", artist: "Whitney Houston", genre: "edm", bpm: 104, energy: 0.88, durationSec: 212, isRemix: true, decade: "2010s" },
  { id: "t38", title: "We Will Rock You", artist: "Queen", genre: "rock", bpm: 81, energy: 0.95, durationSec: 123, decade: "1970s" },
  { id: "t39", title: "Feel So Close", artist: "Calvin Harris", genre: "edm", bpm: 128, energy: 0.9, durationSec: 231, decade: "2010s" },
  { id: "t40", title: "Flowers", artist: "Miley Cyrus", genre: "pop", bpm: 118, energy: 0.82, durationSec: 201, decade: "2020s" },
];

const ALL_GENRES = [
  "pop", "edm", "hiphop", "rock", "latin", "indie", "afrobeats"
];

// ------------------ Helpers ------------------
const secToMin = (s: number) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;

function randId(prefix="id"): string { return `${prefix}_${Math.random().toString(36).slice(2,8)}`; }

function clamp(n: number, a: number, b: number) { return Math.max(a, Math.min(b, n)); }

// Simple score for a track vs segment spec
function scoreTrack(track: Track, seg: SegmentPlan, prefs: Prefs): number {
  // bpm fit (0..1)
  const bpmFit = track.bpm >= seg.targetBpmMin && track.bpm <= seg.targetBpmMax
    ? 1
    : 1 - (Math.min(Math.abs(track.bpm - (track.bpm < seg.targetBpmMin ? seg.targetBpmMin : seg.targetBpmMax)), 50) / 50);

  // energy fit
  const energyFit = track.energy >= seg.targetEnergyMin && track.energy <= seg.targetEnergyMax ? 1 : 0.5;

  // genre/artist preference
  const genreFit = prefs.genres.length === 0 || prefs.genres.includes(track.genre) ? 1 : 0.7;
  const includeArtistBoost = prefs.includeArtists.length && prefs.includeArtists.some(a => track.artist.toLowerCase().includes(a.toLowerCase())) ? 1.15 : 1.0;
  const excludePenalty = prefs.excludeArtists.length && prefs.excludeArtists.some(a => track.artist.toLowerCase().includes(a.toLowerCase())) ? 0.1 : 1.0;

  // theme (very naive: if theme keyword appears in title/artist/known covers)
  const theme = prefs.theme.trim().toLowerCase();
  const themeMatch = theme ? (track.title.toLowerCase().includes(theme) || track.artist.toLowerCase().includes(theme) ? 1.1 : 1.0) : 1.0;

  // explicit filter
  if (!prefs.explicitOk && track.explicit) return 0.01;

  // remix preference
  const remixBoost = prefs.preferRemixes ? (track.isRemix ? 1.1 : 0.95) : 1.0;

  // familiarity: mock heuristic — push remixes/older decades for "fresh", otherwise pop/edm weights
  const fam = prefs.familiarity; // 0..100 (0 fam=very familiar / 100 very fresh)
  const freshBoost = fam > 50 ? (track.isRemix || (track.decade && track.decade !== "2020s") ? 1.05 : 0.98) : (track.genre === "pop" || track.genre === "edm" ? 1.05 : 1.0);

  const base = 0.5 * bpmFit + 0.25 * energyFit + 0.15 * genreFit + 0.10;
  return base * includeArtistBoost * excludePenalty * themeMatch * remixBoost * freshBoost;
}

// ------------------ Segment Planning ------------------
function buildPlan(durationMin: number, difficulty: Difficulty, profile: Profile, armSongs: number): SegmentPlan[] {
  const dur = durationMin * 60;
  const segs: SegmentPlan[] = [];

  // Warmup
  const warm = clamp(Math.round( (profile === "rhythm-ride" ? 6 : 5) * 60 ), 240, 540);
  segs.push({ id: randId("seg"), type: "warmup", durationSec: warm, targetBpmMin: 90, targetBpmMax: 110, targetEnergyMin: 0.3, targetEnergyMax: 0.55 });

  // Core blocks length depends on remaining time
  let remaining = dur - warm - 240; // reserve ~4 min cooldown baseline
  if (remaining < 300) remaining = 300;

  const intenseCount = difficulty === "advanced" ? 6 : difficulty === "moderate" ? 5 : 4;
  const workDur = difficulty === "advanced" ? 180 : 150;
  const recDur = difficulty === "easy" ? 120 : 90;

  // Profile split ratios
  const sprintBias = profile === "sprint-heavy" ? 0.75 : profile === "mixed-intervals" ? 0.5 : profile === "rhythm-ride" ? 0.4 : 0.25;

  let totalCore = 0;
  for (let i=0;i<intenseCount;i++) {
    const isSprint = Math.random() < sprintBias || profile === "sprint-heavy";
    segs.push({ id: randId("seg"), type: isSprint ? "sprint" : "climb", durationSec: workDur, targetBpmMin: isSprint ? 140 : 60, targetBpmMax: isSprint ? 175 : 95, targetEnergyMin: 0.75, targetEnergyMax: 1.0 });
    totalCore += workDur;
    // add recovery after each except maybe last
    if (i < intenseCount-1) {
      segs.push({ id: randId("seg"), type: "recovery", durationSec: recDur, targetBpmMin: 85, targetBpmMax: 110, targetEnergyMin: 0.3, targetEnergyMax: 0.55 });
      totalCore += recDur;
    }
  }

  // Optional steady block if time remains
  const used = warm + totalCore;
  let leftover = dur - used - 240; // leave cooldown
  if (leftover > 120) {
    segs.push({ id: randId("seg"), type: "steady", durationSec: leftover, targetBpmMin: 110, targetBpmMax: 130, targetEnergyMin: 0.55, targetEnergyMax: 0.75 });
  }

  // Arm songs: replace first recoveries if requested
  let inserted = 0;
  for (let i=0;i<segs.length && inserted < armSongs; i++) {
    if (segs[i].type === "recovery") {
      segs[i] = { ...segs[i], type: "arm", targetBpmMin: 95, targetBpmMax: 120, targetEnergyMin: 0.5, targetEnergyMax: 0.7 };
      inserted++;
    }
  }

  // Cooldown ~ 4-6 minutes based on difficulty
  const cool = clamp( (difficulty === "advanced" ? 240 : 300), 180, 420);
  segs.push({ id: randId("seg"), type: "cooldown", durationSec: cool, targetBpmMin: 70, targetBpmMax: 95, targetEnergyMin: 0.1, targetEnergyMax: 0.4 });

  return segs;
}

// ------------------ Generation ------------------
interface Prefs {
  genres: string[];
  includeArtists: string[];
  excludeArtists: string[];
  theme: string;
  familiarity: number; // 0 familiar .. 100 fresh
  explicitOk: boolean;
  preferRemixes: boolean;
}

function pickForSegment(seg: SegmentPlan, prefs: Prefs, usedIds: Set<string>): Track | null {
  let best: Track | null = null;
  let bestScore = -1;
  for (const tr of MOCK_TRACKS) {
    if (usedIds.has(tr.id)) continue; // avoid duplicates in MVP
    const s = scoreTrack(tr, seg, prefs);
    if (s > bestScore) { best = tr; bestScore = s; }
  }
  return best;
}

function generatePlaylist(segs: SegmentPlan[], prefs: Prefs) {
  const used = new Set<string>();
  const picks: { seg: SegmentPlan; track: Track | null }[] = [];
  for (const seg of segs) {
    const tr = pickForSegment(seg, prefs, used);
    if (tr) used.add(tr.id);
    picks.push({ seg, track: tr });
  }
  return picks;
}

// ------------------ UI ------------------
const SectionCard: React.FC<{ title: string; children: React.ReactNode; right?: React.ReactNode }>=({title, children, right})=> (
  <div className="bg-white/70 backdrop-blur rounded-2xl shadow p-4 md:p-6 border border-slate-200">
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-slate-800 font-semibold text-lg">{title}</h2>
      {right}
    </div>
    {children}
  </div>
);

const GenrePill: React.FC<{label:string; selected:boolean; onToggle:()=>void}> = ({label, selected, onToggle})=> (
  <button onClick={onToggle} className={`px-3 py-1.5 rounded-full border text-sm mr-2 mb-2 transition ${selected?"bg-slate-900 text-white border-slate-900":"border-slate-300 text-slate-700 hover:bg-slate-100"}`}>
    {label}
  </button>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props)=> (
  <input {...props} className={`w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400 ${props.className??""}`} />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props)=> (
  <select {...props} className={`w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400 ${props.className??""}`}>{props.children}</select>
);

const Slider: React.FC<{value:number; onChange:(v:number)=>void}> = ({value,onChange})=> (
  <input type="range" min={0} max={100} value={value} onChange={(e)=>onChange(Number(e.target.value))} className="w-full"/>
);

const Badge: React.FC<{children: React.ReactNode}> = ({children}) => (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">{children}</span>
);

const SegLabel: Record<any, string> = {
  warmup: "Warm-Up",
  sprint: "Sprint",
  climb: "Climb",
  recovery: "Recovery",
  arm: "Arm Song",
  steady: "Steady",
  cooldown: "Cooldown",
};

// Main App Component
export default function SpinSmithApp(){
  const [durationMin, setDurationMin] = useState<number>(45);
  const [difficulty, setDifficulty] = useState<Difficulty>("moderate");
  const [profile, setProfile] = useState<Profile>("mixed-intervals");
  const [genres, setGenres] = useState<string[]>(["pop","edm"]);
  const [includeArtists, setIncludeArtists] = useState<string>("");
  const [excludeArtists, setExcludeArtists] = useState<string>("");
  const [theme, setTheme] = useState<string>("");
  const [armSongs, setArmSongs] = useState<number>(1);
  const [familiarity, setFamiliarity] = useState<number>(50);
  const [preferRemixes, setPreferRemixes] = useState<boolean>(true);
  const [explicitOk, setExplicitOk] = useState<boolean>(false);

  const prefs: any = useMemo(()=>({
    genres,
    includeArtists: includeArtists.split(",").map(s=>s.trim()).filter(Boolean),
    excludeArtists: excludeArtists.split(",").map(s=>s.trim()).filter(Boolean),
    theme,
    familiarity,
    explicitOk,
    preferRemixes,
  }),[genres, includeArtists, excludeArtists, theme, familiarity, explicitOk, preferRemixes]);

  const plan = useMemo(()=>buildPlan(durationMin, difficulty, profile, armSongs), [durationMin, difficulty, profile, armSongs]);
  const picks = useMemo(()=>generatePlaylist(plan, prefs), [plan, prefs]);

  const totalPlanned = useMemo(()=>plan.reduce((a,b)=>a+b.durationSec,0),[plan]);
  const totalActual = useMemo(()=>picks.reduce((a,b)=>a+(b.track?.durationSec??0),0),[picks]);

  function toggleGenre(g: string){
    setGenres(prev => prev.includes(g) ? prev.filter(x=>x!==g) : [...prev, g]);
  }

  function replaceTrack(segId: string){
    const seg = plan.find(s=>s.id===segId);
    if(!seg) return;
    // pick next best not currently used
    const used = new Set(picks.map(p=>p.track?.id).filter(Boolean) as string[]);
    let best: any = null; let bestScore = -1;
    for (const tr of MOCK_TRACKS) {
      if (used.has(tr.id)) continue;
      const s = scoreTrack(tr, seg, prefs);
      if (s > bestScore) { best = tr; bestScore = s; }
    }
    if (!best) return;
    alert("This MVP demo auto-regenerates using your prefs. In a real app, this would swap just one track.");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900">
      <header className="px-5 md:px-10 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">SpinSmith <span className="text-slate-500 font-normal">— Playlist Builder</span></h1>
          <div className="text-sm text-slate-600">MVP Mock • Client-side only</div>
        </div>
      </header>

      <main className="px-5 md:px-10 grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6 pb-14">
        {/* Inputs */}
        <div className="lg:col-span-1 space-y-5">
          <SectionCard title="Class Setup">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-600">Duration (min)</label>
                <Input type="number" min={20} max={120} value={durationMin} onChange={(e)=>setDurationMin(parseInt(e.target.value||"45"))} />
              </div>
              <div>
                <label className="text-sm text-slate-600">Difficulty</label>
                <Select value={difficulty} onChange={(e)=>setDifficulty(e.target.value as Difficulty)}>
                  <option value="easy">Easy</option>
                  <option value="moderate">Moderate</option>
                  <option value="advanced">Advanced</option>
                </Select>
              </div>
              <div className="col-span-2">
                <label className="text-sm text-slate-600">Ride Profile</label>
                <Select value={profile} onChange={(e)=>setProfile(e.target.value as Profile)}>
                  <option value="sprint-heavy">Sprint-heavy</option>
                  <option value="climb-heavy">Climb-heavy</option>
                  <option value="mixed-intervals">Mixed intervals</option>
                  <option value="rhythm-ride">Rhythm ride</option>
                </Select>
              </div>
              <div>
                <label className="text-sm text-slate-600">Arm Songs</label>
                <Select value={String(armSongs)} onChange={(e)=>setArmSongs(parseInt(e.target.value))}>
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                </Select>
              </div>
              <div>
                <label className="text-sm text-slate-600">Explicit content</label>
                <Select value={explicitOk?"yes":"no"} onChange={(e)=>setExplicitOk(e.target.value==="yes")}>
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
                {ALL_GENRES.map(g=> (
                  <GenrePill key={g} label={g} selected={genres.includes(g)} onToggle={()=>toggleGenre(g)} />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-sm text-slate-600">Include artists (comma-separated)</label>
                <Input placeholder="e.g., Avicii, Rihanna" value={includeArtists} onChange={(e)=>setIncludeArtists(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-slate-600">Exclude artists</label>
                <Input placeholder="e.g., Metallica" value={excludeArtists} onChange={(e)=>setExcludeArtists(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-slate-600">Theme keywords</label>
                <Input placeholder="e.g., metal Disney covers" value={theme} onChange={(e)=>setTheme(e.target.value)} />
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
                  <input type="checkbox" checked={preferRemixes} onChange={(e)=>setPreferRemixes(e.target.checked)} />
                  Prefer remixes/extended edits
                </label>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Generation">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">Planned duration</div>
              <div className="text-sm font-medium">{secToMin(totalPlanned)}</div>
            </div>
            <button onClick={()=>{ /* picks are reactive; noop */ }} className="mt-3 w-full rounded-xl bg-slate-900 text-white py-2.5 hover:bg-slate-800 transition shadow">Generate Playlist</button>
            <p className="text-xs text-slate-500 mt-2">This mock regenerates live as you change inputs.</p>
          </SectionCard>
        </div>

        {/* Plan preview */}
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
                  {plan.map((s, idx)=> (
                    <tr key={s.id} className="border-t border-slate-200">
                      <td className="py-2 pr-3 text-slate-500">{idx+1}</td>
                      <td className="py-2 pr-3"><Badge>{SegLabel[s.type]}</Badge></td>
                      <td className="py-2 pr-3">{s.targetBpmMin}–{s.targetBpmMax}</td>
                      <td className="py-2 pr-3">{Math.round(s.targetEnergyMin*100)}–{Math.round(s.targetEnergyMax*100)}</td>
                      <td className="py-2 pr-3 text-right">{secToMin(s.durationSec)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Generated Playlist (mock)">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-600">Total actual</div>
              <div className={`text-sm font-medium ${Math.abs(totalActual - totalPlanned) <= 30 ? "text-emerald-600" : "text-amber-600"}`}>
                {secToMin(totalActual)} {Math.abs(totalActual - totalPlanned) <= 30 ? "(≈ fit)" : "(loose fit)"}
              </div>
            </div>
            <ul className="divide-y divide-slate-200 rounded-xl overflow-hidden border border-slate-200">
              {picks.map((p, idx)=> (
                <li key={p.seg.id} className="bg-white/70 p-3 md:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge>{idx+1}. {SegLabel[p.seg.type]}</Badge>
                        <span className="text-xs text-slate-500">{p.seg.targetBpmMin}–{p.seg.targetBpmMax} bpm</span>
                      </div>
                      {p.track ? (
                        <>
                          <div className="font-medium truncate">{p.track.title} <span className="text-slate-500 font-normal">• {p.track.artist}</span></div>
                          <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-3">
                            <span className="uppercase tracking-wide">{p.track.genre}</span>
                            <span>{p.track.bpm} bpm</span>
                            <span>{secToMin(p.track.durationSec)}</span>
                            {p.track.isRemix && <Badge>Remix</Badge>}
                            {p.track.explicit && <Badge>Explicit</Badge>}
                          </div>
                        </>
                      ) : (
                        <div className="italic text-slate-500">No match found (expand genres or allow explicit)</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={()=>replaceTrack(p.seg.id)} className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm">Replace</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mt-4">
              <button className="rounded-xl bg-slate-900 text-white px-4 py-2 hover:bg-slate-800 shadow">Export to Spotify (disabled in demo)</button>
              <button className="rounded-xl border border-slate-300 px-4 py-2 text-slate-800 hover:bg-slate-100">Save as Template</button>
              <div className="text-xs text-slate-500 md:ml-auto">Tip: Enable 5s crossfade in your player for smoother transitions.</div>
            </div>
          </SectionCard>
        </div>
      </main>

      <footer className="px-5 md:px-10 pb-10 text-xs text-slate-500">
        Built as a front-end MVP mock. In production, this would authenticate to Spotify/Apple, fetch audio features, and export real playlists.
      </footer>
    </div>
  );
}
