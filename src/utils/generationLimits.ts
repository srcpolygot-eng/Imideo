/**
 * Generation quota system
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
    // ignore
  }
}

export function getLimits(hasApiKey: boolean): Record<GenerationKind, number> {
  return hasApiKey ? { ...PAID_DAILY_LIMITS } : { ...FREE_DAILY_LIMITS };
}

export function getUsed(kind: GenerationKind): number {
  const usage = loadUsage();
  return usage.counts[kind] ?? 0;
}

export function getRemaining(kind: GenerationKind, hasApiKey: boolean): number {
  const limit = getLimits(hasApiKey)[kind];
  return Math.max(0, limit - getUsed(kind));
}

export function canGenerate(kind: GenerationKind, hasApiKey: boolean): boolean {
  return getRemaining(kind, hasApiKey) > 0;
}

export function consumeGeneration(kind: GenerationKind): number {
  const usage = loadUsage();
  usage.counts[kind] = (usage.counts[kind] ?? 0) + 1;
  saveUsage(usage);
  return usage.counts[kind]!;
}

export function getUsageSummary(hasApiKey: boolean) {
  const limits = getLimits(hasApiKey);
  return {
    tier: hasApiKey ? ('paid' as const) : ('free' as const),
    veo: { used: getUsed('veo'), limit: limits.veo, remaining: getRemaining('veo', hasApiKey) },
    image: { used: getUsed('image'), limit: limits.image, remaining: getRemaining('image', hasApiKey) },
    music: { used: getUsed('music'), limit: limits.music, remaining: getRemaining('music', hasApiKey) },
    omni: { used: getUsed('omni'), limit: limits.omni, remaining: getRemaining('omni', hasApiKey) },
  };
}
