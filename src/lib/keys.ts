/**
 * 数字キー('1'〜'9')を0始まりの選択肢インデックスへ変換する。
 * 数字でない・選択肢数を超えるキーは null。
 */
export function choiceIndexFromKey(key: string, count: number): number | null {
  if (!/^[1-9]$/.test(key)) return null;
  const index = Number(key) - 1;
  return index < count ? index : null;
}

/** フィードバック表示中に「次の問題へ」を進めるキーか。 */
export function isAdvanceKey(key: string): boolean {
  return key === 'Enter' || key === ' ' || key === 'n';
}
