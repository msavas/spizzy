import type { Difficulty, Profile, SegmentPlan } from "./types";

function randId(prefix = "seg"): string {
  const cryptoRandom = (globalThis as any)?.crypto?.randomUUID as (() => string) | undefined;
  if (cryptoRandom) {
    return `${prefix}_${cryptoRandom().slice(0, 8)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function buildPlan(durationMin: number, difficulty: Difficulty, profile: Profile, armSongs: number): SegmentPlan[] {
  const totalSeconds = durationMin * 60;
  const segments: SegmentPlan[] = [];

  const warmup = clamp(Math.round((profile === "rhythm-ride" ? 6 : 5) * 60), 240, 540);
  segments.push({
    id: randId("warm"),
    type: "warmup",
    durationSec: warmup,
    targetBpmMin: 90,
    targetBpmMax: 110,
    targetEnergyMin: 0.3,
    targetEnergyMax: 0.55,
  });

  let remaining = totalSeconds - warmup - 240;
  if (remaining < 300) remaining = 300;

  const intenseCount = difficulty === "advanced" ? 6 : difficulty === "moderate" ? 5 : 4;
  const workDur = difficulty === "advanced" ? 180 : 150;
  const recDur = difficulty === "easy" ? 120 : 90;
  const sprintBias = profile === "sprint-heavy" ? 0.75 : profile === "mixed-intervals" ? 0.5 : profile === "rhythm-ride" ? 0.4 : 0.25;

  let coreDuration = 0;
  for (let i = 0; i < intenseCount; i++) {
    const isSprint = Math.random() < sprintBias || profile === "sprint-heavy";
    segments.push({
      id: randId("core"),
      type: isSprint ? "sprint" : "climb",
      durationSec: workDur,
      targetBpmMin: isSprint ? 140 : 60,
      targetBpmMax: isSprint ? 175 : 95,
      targetEnergyMin: 0.75,
      targetEnergyMax: 1.0,
    });
    coreDuration += workDur;
    if (i < intenseCount - 1) {
      segments.push({
        id: randId("rec"),
        type: "recovery",
        durationSec: recDur,
        targetBpmMin: 85,
        targetBpmMax: 110,
        targetEnergyMin: 0.3,
        targetEnergyMax: 0.55,
      });
      coreDuration += recDur;
    }
  }

  const used = warmup + coreDuration;
  let leftover = totalSeconds - used - 240;
  if (leftover > 120) {
    segments.push({
      id: randId("steady"),
      type: "steady",
      durationSec: leftover,
      targetBpmMin: 110,
      targetBpmMax: 130,
      targetEnergyMin: 0.55,
      targetEnergyMax: 0.75,
    });
  }

  let inserted = 0;
  for (let i = 0; i < segments.length && inserted < armSongs; i++) {
    const segment = segments[i];
    if (segment && segment.type === "recovery") {
      segments[i] = {
        ...segment,
        type: "arm",
        targetBpmMin: 95,
        targetBpmMax: 120,
        targetEnergyMin: 0.5,
        targetEnergyMax: 0.7,
      };
      inserted++;
    }
  }

  const cooldown = clamp(difficulty === "advanced" ? 240 : 300, 180, 420);
  segments.push({
    id: randId("cool"),
    type: "cooldown",
    durationSec: cooldown,
    targetBpmMin: 70,
    targetBpmMax: 95,
    targetEnergyMin: 0.1,
    targetEnergyMax: 0.4,
  });

  return segments;
}
