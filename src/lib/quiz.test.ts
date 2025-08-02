import { describe, expect, it } from 'vitest';
import { buildConversionQuestion, buildMisuseQuestion, createRng, shuffle } from './quiz';
import { verbs } from './data/verbs';
import { misuseItems } from './data/misuse';

describe('createRng / shuffle', () => {
  it('同じ種から同じ列が再現できる', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('shuffleは要素を保存する', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffled = shuffle(items, createRng(7));
    expect([...shuffled].sort((a, b) => a - b)).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe('buildConversionQuestion', () => {
  it('4択で正解が answerIndex の位置にある', () => {
    for (let seed = 0; seed < 50; seed++) {
      const q = buildConversionQuestion(verbs, createRng(seed));
      expect(q.choices, q.id).toHaveLength(4);
      expect(new Set(q.choices).size, q.id).toBe(4);
      expect(q.answerIndex).toBeGreaterThanOrEqual(0);
      const verb = verbs.find((v) => v.plain === q.plain)!;
      expect(verb[q.form]).toContain(q.choices[q.answerIndex]);
    }
  });

  it('誤答にその動詞の正しい語形が混ざらない', () => {
    for (let seed = 0; seed < 50; seed++) {
      const q = buildConversionQuestion(verbs, createRng(seed));
      const verb = verbs.find((v) => v.plain === q.plain)!;
      q.choices.forEach((choice, i) => {
        if (i === q.answerIndex) return;
        // 問われた形(尊敬/謙譲)の別解はどれも誤答にしない
        expect(verb[q.form], `${q.id} ${choice}`).not.toContain(choice);
      });
    }
  });

  it('出題対象を固定できる(復習用)', () => {
    const q = buildConversionQuestion(verbs, createRng(1), { plain: '見る', form: 'humble' });
    expect(q.plain).toBe('見る');
    expect(q.choices[q.answerIndex]).toBe('拝見する');
    expect(q.explanation).toContain('拝見する');
  });

  it('反対側の語形が紛れの誤答として入る', () => {
    const q = buildConversionQuestion(verbs, createRng(3), { plain: '言う', form: 'respectful' });
    expect(q.choices).toContain('申し上げる');
  });
});

describe('buildMisuseQuestion', () => {
  it('不適切な文の解説に言い換えが入る', () => {
    const q = buildMisuseQuestion(misuseItems, createRng(1), 'double-ossharareru');
    expect(q.ok).toBe(false);
    expect(q.explanation).toContain('おっしゃいました');
    expect(q.explanation).toContain('二重敬語');
  });

  it('適切な文は適切と説明される', () => {
    const q = buildMisuseQuestion(misuseItems, createRng(1), 'ok-ukagaimasu');
    expect(q.ok).toBe(true);
    expect(q.explanation).toMatch(/^適切。/);
  });

  it('ランダム出題でも全フィールドが揃う', () => {
    for (let seed = 0; seed < 30; seed++) {
      const q = buildMisuseQuestion(misuseItems, createRng(seed));
      expect(q.id).toMatch(/^m:/);
      expect(q.sentence.length).toBeGreaterThan(5);
      expect(q.explanation.length).toBeGreaterThan(10);
    }
  });
});
