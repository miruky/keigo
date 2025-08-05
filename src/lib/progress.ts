/** 学習の通算成績。wrongは問題idごとの未克服回数 */
export interface Progress {
  total: number;
  correct: number;
  streak: number;
  bestStreak: number;
  wrong: Record<string, number>;
}

export const emptyProgress = (): Progress => ({
  total: 0,
  correct: 0,
  streak: 0,
  bestStreak: 0,
  wrong: {},
});

/** 解答を1件記録する。正解すると苦手カウントが1つ減る */
export function record(progress: Progress, questionId: string, ok: boolean): Progress {
  const wrong = { ...progress.wrong };
  if (ok) {
    if (wrong[questionId]) {
      wrong[questionId] -= 1;
      if (wrong[questionId] <= 0) delete wrong[questionId];
    }
  } else {
    wrong[questionId] = (wrong[questionId] ?? 0) + 1;
  }
  const streak = ok ? progress.streak + 1 : 0;
  return {
    total: progress.total + 1,
    correct: progress.correct + (ok ? 1 : 0),
    streak,
    bestStreak: Math.max(progress.bestStreak, streak),
    wrong,
  };
}

export function accuracy(progress: Progress): number {
  return progress.total === 0 ? 0 : progress.correct / progress.total;
}

/** 苦手として残っている問題id */
export function weakIds(progress: Progress): string[] {
  return Object.keys(progress.wrong);
}

/** 苦手の内訳。idの接頭辞(c:=変換ドリル, m:=誤用判定)で数える */
export function weakBreakdown(progress: Progress): { conversion: number; misuse: number } {
  let conversion = 0;
  let misuse = 0;
  for (const id of Object.keys(progress.wrong)) {
    if (id.startsWith('c:')) conversion += 1;
    else if (id.startsWith('m:')) misuse += 1;
  }
  return { conversion, misuse };
}

export function serialize(progress: Progress): string {
  return JSON.stringify({ version: 1, ...progress });
}

/**
 * 保存・書き出しデータを厳密にProgressへ復元する。形式が壊れていれば null。
 * 読み込み機能では「壊れたファイルで成績を消してしまう」のを避けるため、
 * 空成績へのフォールバック(deserialize)と区別してこちらを使う。
 */
export function parseProgress(json: string | null): Progress | null {
  if (!json) return null;
  let data: (Partial<Progress> & { version?: number }) | null;
  try {
    data = JSON.parse(json) as Partial<Progress> & { version?: number };
  } catch {
    return null;
  }
  if (!data || data.version !== 1 || typeof data.total !== 'number') return null;
  const wrong: Record<string, number> = {};
  if (data.wrong && typeof data.wrong === 'object') {
    for (const [id, count] of Object.entries(data.wrong)) {
      if (typeof count === 'number' && count > 0) wrong[id] = count;
    }
  }
  return {
    total: data.total,
    correct: typeof data.correct === 'number' ? data.correct : 0,
    streak: typeof data.streak === 'number' ? data.streak : 0,
    bestStreak: typeof data.bestStreak === 'number' ? data.bestStreak : 0,
    wrong,
  };
}

/** localStorageの読み込み用。壊れた保存データはまっさらな成績に戻す。 */
export function deserialize(json: string | null): Progress {
  return parseProgress(json) ?? emptyProgress();
}
