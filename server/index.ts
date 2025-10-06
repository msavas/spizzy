import "dotenv/config";
import express from "express";
import cors from "cors";
import { z } from "zod";
import OpenAI from "openai";
import type { GenerationInput, GenerationResponse, Prefs } from "../shared/types";
import { buildPlan } from "../shared/planner";
import { generatePlaylist } from "../shared/generator";

const app = express();
app.use(cors());
app.use(express.json());

const openaiApiKey = process.env.OPENAI_API_KEY;
const openaiModel = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

const requestSchema = z.object({
  durationMin: z.number().int().min(20).max(120),
  difficulty: z.enum(["easy", "moderate", "advanced"]),
  profile: z.enum(["sprint-heavy", "climb-heavy", "mixed-intervals", "rhythm-ride"]),
  armSongs: z.number().int().min(0).max(3),
  genres: z.array(z.string()).max(10),
  includeArtists: z.array(z.string()).max(10),
  excludeArtists: z.array(z.string()).max(10),
  theme: z.string().max(200),
  familiarity: z.number().min(0).max(100),
  explicitOk: z.boolean(),
  preferRemixes: z.boolean(),
});

function buildPrompt(input: GenerationInput, planSummary: string) {
  const { difficulty, profile, genres, includeArtists, excludeArtists, theme, familiarity, explicitOk, preferRemixes } = input;
  const themeLine = theme ? `Theme keywords: ${theme}.` : "";
  const includeLine = includeArtists.length ? `Prioritize artists: ${includeArtists.join(", ")}.` : "";
  const excludeLine = excludeArtists.length ? `Avoid artists: ${excludeArtists.join(", ")}.` : "";
  const explicitLine = explicitOk ? "Explicit tracks are allowed." : "Explicit tracks must be avoided.";
  const remixLine = preferRemixes ? "Remixes are encouraged." : "Prefer original edits.";
  const freshnessLine = familiarity >= 60 ? "Focus on fresher or unexpected picks." : familiarity <= 40 ? "Stick with familiar, high-energy staples." : "Blend familiar staples with a few newer surprises.";

  return `You are an elite indoor cycling coach and music supervisor. Create a playlist for a ${input.durationMin} minute ${difficulty} ${profile} ride. Use the following segment plan (with BPM and energy targets):\n${planSummary}\nGenres to emphasize: ${genres.length ? genres.join(", ") : "any high-energy"}. ${themeLine} ${includeLine} ${excludeLine} ${explicitLine} ${remixLine} ${freshnessLine} Provide a JSON object with a \"notes\" field and a \"picks\" array. Each pick must include segmentId, title, artist, genre, bpm, energy (0..1), durationSec, explicit, and isRemix. Match the BPM and energy targets and ensure total duration closely matches the plan.`;
}

async function callOpenAi(input: GenerationInput, plan: GenerationResponse["plan"], prefs: Prefs): Promise<GenerationResponse | null> {
  if (!openai) return null;

  const planSummary = plan
    .map((segment, idx) => `${idx + 1}. ${segment.type} (${segment.durationSec}s) BPM ${segment.targetBpmMin}-${segment.targetBpmMax}`)
    .join("\n");

  const prompt = buildPrompt({ ...input, ...prefs }, planSummary);

  try {
    const completion = await openai.chat.completions.create({
      model: openaiModel,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: "You are SpinSmith, an expert coach who programs indoor cycling playlists that fit detailed ride segment specs.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) {
      throw new Error("No content returned from ChatGPT");
    }

    const data = JSON.parse(text) as { picks: Array<{ segmentId: string; title: string; artist: string; genre: string; bpm: number; energy: number; durationSec: number; explicit?: boolean; isRemix?: boolean }>; notes?: string };

    const picks: GenerationResponse["picks"] = plan.map((segment) => {
      const match = data.picks.find((p) => p.segmentId === segment.id);
      if (!match) {
        return { seg: segment, track: null };
      }
      return {
        seg: segment,
        track: {
          id: `${segment.id}-${Math.random().toString(36).slice(2, 8)}`,
          title: match.title,
          artist: match.artist,
          genre: match.genre,
          bpm: Math.round(match.bpm),
          energy: Math.min(1, Math.max(0, match.energy ?? 0.8)),
          durationSec: Math.max(60, Math.round(match.durationSec)),
          explicit: Boolean(match.explicit),
          isRemix: Boolean(match.isRemix),
        },
      };
    });

    const totalDurationSec = picks.reduce((acc, pick) => acc + (pick.track?.durationSec ?? 0), 0);
    return {
      plan,
      picks,
      totalDurationSec,
      source: "chatgpt",
      notes: data.notes,
    };
  } catch (error) {
    console.error("ChatGPT generation failed", error);
    return null;
  }
}

app.post("/api/generate-playlist", async (req: any, res: any) => {
  const parseResult = requestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: "Invalid request", details: parseResult.error.flatten() });
  }

  const input = parseResult.data as GenerationInput;
  const prefs: Prefs = {
    genres: input.genres,
    includeArtists: input.includeArtists,
    excludeArtists: input.excludeArtists,
    theme: input.theme,
    familiarity: input.familiarity,
    explicitOk: input.explicitOk,
    preferRemixes: input.preferRemixes,
  };

  const plan = buildPlan(input.durationMin, input.difficulty, input.profile, input.armSongs);

  const heuristic = generatePlaylist(plan, prefs);
  const heuristicResponse: GenerationResponse = {
    plan,
    picks: heuristic,
    totalDurationSec: heuristic.reduce((acc, pick) => acc + (pick.track?.durationSec ?? 0), 0),
    source: "heuristic",
  };

  if (!openai) {
    return res.json({ ...heuristicResponse, notes: "OpenAI API key not configured. Returning heuristic playlist." });
  }

  const aiResponse = await callOpenAi(input, plan, prefs);
  if (aiResponse) {
    return res.json(aiResponse);
  }

  return res.json({
    ...heuristicResponse,
    source: "fallback",
    notes: "ChatGPT generation failed. Showing heuristic fallback.",
  });
});

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(port, () => {
  console.log(`SpinSmith server listening on http://localhost:${port}`);
});
