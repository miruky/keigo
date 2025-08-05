import type { MisuseItem, VerbEntry } from './types';

/** 検索クエリを正規化する(前後空白の除去と小文字化)。 */
export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

/**
 * 対照表の動詞を絞り込む。語・尊敬語・謙譲語・補足のいずれかに
 * クエリが部分一致すれば残す。空クエリは全件を返す。
 */
export function filterVerbs(verbs: VerbEntry[], query: string): VerbEntry[] {
  const q = normalizeQuery(query);
  if (!q) return verbs;
  return verbs.filter((verb) => {
    const haystack = [verb.plain, ...verb.respectful, ...verb.humble, verb.note ?? '']
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

/**
 * 誤用例を絞り込む。元の文・言い換え・解説のいずれかに
 * クエリが部分一致すれば残す。空クエリは全件を返す。
 */
export function filterMisuse(items: MisuseItem[], query: string): MisuseItem[] {
  const q = normalizeQuery(query);
  if (!q) return items;
  return items.filter((item) => {
    const haystack = [item.sentence, item.fix ?? '', item.note].join(' ').toLowerCase();
    return haystack.includes(q);
  });
}
