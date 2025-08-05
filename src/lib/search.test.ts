import { describe, expect, it } from 'vitest';
import { filterMisuse, filterVerbs, normalizeQuery } from './search';
import { verbs } from './data/verbs';
import { misuseItems } from './data/misuse';

describe('normalizeQuery', () => {
  it('前後の空白を除き、小文字へ揃える', () => {
    expect(normalizeQuery('  Keigo  ')).toBe('keigo');
    expect(normalizeQuery('見る')).toBe('見る');
  });
});

describe('filterVerbs', () => {
  it('空クエリは全件を返す', () => {
    expect(filterVerbs(verbs, '')).toHaveLength(verbs.length);
    expect(filterVerbs(verbs, '   ')).toHaveLength(verbs.length);
  });

  it('見出し語で絞り込める', () => {
    const result = filterVerbs(verbs, '見る');
    expect(result.map((v) => v.plain)).toContain('見る');
    expect(result.length).toBeLessThan(verbs.length);
  });

  it('尊敬語・謙譲語の語形でも拾える', () => {
    const result = filterVerbs(verbs, 'おっしゃる');
    expect(result.map((v) => v.plain)).toContain('言う');
  });

  it('補足(note)の語でも拾える', () => {
    const result = filterVerbs(verbs, '丁重語');
    expect(result.length).toBeGreaterThan(0);
  });

  it('一致しなければ空配列', () => {
    expect(filterVerbs(verbs, 'まったく存在しない語')).toEqual([]);
  });
});

describe('filterMisuse', () => {
  it('空クエリは全件を返す', () => {
    expect(filterMisuse(misuseItems, '')).toHaveLength(misuseItems.length);
  });

  it('解説の語で絞り込める', () => {
    const result = filterMisuse(misuseItems, '二重敬語');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((i) => `${i.sentence}${i.fix ?? ''}${i.note}`.includes('二重敬語'))).toBe(
      true,
    );
  });

  it('言い換え(fix)の語でも拾える', () => {
    const result = filterMisuse(misuseItems, '承知しました');
    expect(result.length).toBeGreaterThan(0);
  });

  it('一致しなければ空配列', () => {
    expect(filterMisuse(misuseItems, 'まったく存在しない語')).toEqual([]);
  });
});
