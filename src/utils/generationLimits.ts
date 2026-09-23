/**
 * Client-side generation usage tracking for free vs paid quota system
 * - Free (no API key): limited demo generations per day
 * - Paid (API key present): much higher daily quota
 */

export type GenerationKind = 'veo' | 'image' | 'music' | 'omni';

const STORAGE_KEY = 'imideo_generation_usage_v1';

const FREE_DAILY_LIMITS: Record<GenerationKind, number> = {
  veo: 2,
  image: 5,
  music: 2,
  omni: 3,
};

const PAID_DAILY_LIMITS: Record<GenerationKind, number> = {
  veo: 40,
  image: 100,
  music: 30,
  omni: 50,
};

interface DayUsage {
  date: string;
  counts: Partial<Record<GenerationKind, number>>;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadUsage(): DayUsage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: todayKey(), counts: {} };
    const parsed = JSON.parse(raw) as DayUsage;
    if (parsed.date !== todayKey()) {
      return { date: todayKey(), counts: {} };
    }
    return parsed;
  } catch {
    return { date: todayKey(), counts: {} };
  }
}

function saveUsage(usage: DayUsage) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  } catch {
    /* ignore */
  }
}

export function canGenerate(kind: GenerationKind, hasApiKey: boolean): boolean {
  const limits = hasApiKey ? PAID_DAILY_LIMITS : FREE_DAILY_LIMITS;
  const usage = loadUsage();
  const used = usage.counts[kind] || 0;
  return used < limits[kind];
}

export function consumeGeneration(kind: GenerationKind, hasApiKey: boolean): boolean {
  if (!canGenerate(kind, hasApiKey)) return false;
  const usage = loadUsage();
  usage.counts[kind] = (usage.counts[kind] || 0) + 1;
  saveUsage(usage);
  return true;
}

export function getUsageSummary(hasApiKey: boolean): Record<GenerationKind, { used: number; limit: number }> {
  const limits = hasApiKey ? PAID_DAILY_LIMITS : FREE_DAILY_LIMITS;
  const usage = loadUsage();
  const result = {} as Record<GenerationKind, { used: number; limit: number }>;
  (Object.keys(limits) as GenerationKind[]).forEach((k) => {
    result[k] = { used: usage.counts[k] || 0, limit: limits[k] };
  });
  return result;
}
