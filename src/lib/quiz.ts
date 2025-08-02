import { FORM_LABELS } from './data/verbs';
import type { ConversionQuestion, KeigoForm, MisuseItem, MisuseQuestion, VerbEntry } from './types';

/** 再現可能な乱数(mulberry32)。テストと「同じ出題列」の共有に使う */
export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

const pick = <T>(items: T[], rng: () => number): T => items[Math.floor(rng() * items.length)]!;

export const conversionId = (plain: string, form: KeigoForm) => `c:${plain}:${form}`;

/**
 * 変換ドリルを1問作る。正解はその動詞の代表形、誤答は他の動詞の語形から選ぶ。
 * 「いらっしゃる」のように複数の動詞で正しい語形があるため、
 * 出題した動詞のどの語形とも一致しない候補だけを誤答にする。
 */
export function buildConversionQuestion(
  verbs: VerbEntry[],
  rng: () => number,
  fixed?: { plain: string; form: KeigoForm },
): ConversionQuestion {
  const candidates = verbs.flatMap((verb) =>
    (['respectful', 'humble'] as const)
      .filter((form) => verb[form].length > 0)
      .map((form) => ({ verb, form })),
  );
  const target = fixed
    ? candidates.find((c) => c.verb.plain === fixed.plain && c.form === fixed.form)
    : pick(candidates, rng);
  if (!target) throw new Error('出題対象が見つからない');
  const { verb, form } = target;
  const correct = verb[form][0]!;

  const own = new Set([...verb.respectful, ...verb.humble]);
  const pool = new Set<string>();
  for (const other of verbs) {
    for (const candidate of [...other.respectful, ...other.humble]) {
      if (!own.has(candidate)) pool.add(candidate);
    }
  }
  // 自分の反対側の語形(尊敬を問うなら謙譲)は紛らわしい良い誤答なので必ず混ぜる
  const opposite = form === 'respectful' ? verb.humble[0] : verb.respectful[0];
  const distractors = shuffle([...pool], rng).slice(0, opposite ? 2 : 3);
  if (opposite) distractors.push(opposite);

  const choices = shuffle([correct, ...distractors], rng);
  const parts = [
    `尊敬語: ${verb.respectful.join('・') || 'なし'}`,
    `謙譲語: ${verb.humble.join('・') || 'なし'}`,
  ];
  if (verb.note) parts.push(verb.note);
  return {
    kind: 'conversion',
    id: conversionId(verb.plain, form),
    plain: verb.plain,
    form,
    choices,
    answerIndex: choices.indexOf(correct),
    explanation: `「${verb.plain}」の${FORM_LABELS[form]}は「${correct}」。${parts.join(' / ')}`,
  };
}

export function buildMisuseQuestion(
  items: MisuseItem[],
  rng: () => number,
  fixedId?: string,
): MisuseQuestion {
  const item = fixedId ? items.find((i) => i.id === fixedId) : pick(items, rng);
  if (!item) throw new Error('出題対象が見つからない');
  const explanation = item.ok
    ? `適切。${item.note}`
    : `不適切。「${item.fix}」が自然。${item.note}`;
  return {
    kind: 'misuse',
    id: `m:${item.id}`,
    sentence: item.sentence,
    ok: item.ok,
    explanation,
  };
}
