import { describe, expect, it } from 'vitest';
import { verbs } from './data/verbs';
import { misuseItems } from './data/misuse';

describe('動詞の敬語対照表', () => {
  it('25語以上あり、見出しが一意', () => {
    expect(verbs.length).toBeGreaterThanOrEqual(25);
    expect(new Set(verbs.map((v) => v.plain)).size).toBe(verbs.length);
  });

  it('各動詞は尊敬語か謙譲語の少なくとも一方を持つ', () => {
    for (const verb of verbs) {
      expect(verb.respectful.length + verb.humble.length, verb.plain).toBeGreaterThan(0);
    }
  });

  it('同じ動詞の中で尊敬語と謙譲語が重複しない', () => {
    for (const verb of verbs) {
      const overlap = verb.respectful.filter((form) => verb.humble.includes(form));
      expect(overlap, verb.plain).toEqual([]);
    }
  });

  it('代表的な語形が正しい', () => {
    const byPlain = new Map(verbs.map((v) => [v.plain, v]));
    expect(byPlain.get('言う')?.respectful[0]).toBe('おっしゃる');
    expect(byPlain.get('見る')?.humble[0]).toBe('拝見する');
    expect(byPlain.get('食べる')?.respectful[0]).toBe('召し上がる');
    expect(byPlain.get('する')?.humble[0]).toBe('いたす');
  });
});

describe('誤用判定の問題集', () => {
  it('20問以上あり、idが一意', () => {
    expect(misuseItems.length).toBeGreaterThanOrEqual(20);
    expect(new Set(misuseItems.map((i) => i.id)).size).toBe(misuseItems.length);
  });

  it('不適切な文には言い換えが付き、適切な文には付かない', () => {
    for (const item of misuseItems) {
      if (item.ok) {
        expect(item.fix, item.id).toBeUndefined();
      } else {
        expect(item.fix, item.id).toBeTruthy();
        expect(item.fix, item.id).not.toBe(item.sentence);
      }
      expect(item.note.length, item.id).toBeGreaterThan(5);
    }
  });

  it('適切な文も2割程度含む(引っかけ防止)', () => {
    const okCount = misuseItems.filter((i) => i.ok).length;
    expect(okCount).toBeGreaterThanOrEqual(4);
    expect(okCount).toBeLessThan(misuseItems.length / 2);
  });
});
