import { describe, expect, it } from 'vitest';
import { choiceIndexFromKey, isAdvanceKey } from './keys';

describe('choiceIndexFromKey', () => {
  it('数字キーを0始まりのインデックスへ変換する', () => {
    expect(choiceIndexFromKey('1', 4)).toBe(0);
    expect(choiceIndexFromKey('4', 4)).toBe(3);
  });

  it('選択肢数を超えるキーはnull', () => {
    expect(choiceIndexFromKey('5', 4)).toBeNull();
    expect(choiceIndexFromKey('9', 2)).toBeNull();
  });

  it('数字でないキーはnull', () => {
    expect(choiceIndexFromKey('0', 4)).toBeNull();
    expect(choiceIndexFromKey('a', 4)).toBeNull();
    expect(choiceIndexFromKey('Enter', 4)).toBeNull();
  });
});

describe('isAdvanceKey', () => {
  it('Enter・スペース・nで次へ進む', () => {
    expect(isAdvanceKey('Enter')).toBe(true);
    expect(isAdvanceKey(' ')).toBe(true);
    expect(isAdvanceKey('n')).toBe(true);
  });

  it('それ以外は進めない', () => {
    expect(isAdvanceKey('1')).toBe(false);
    expect(isAdvanceKey('Escape')).toBe(false);
  });
});
