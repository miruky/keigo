import { describe, expect, it } from 'vitest';
import {
  accuracy,
  deserialize,
  emptyProgress,
  record,
  serialize,
  weakBreakdown,
  weakIds,
} from './progress';

describe('record', () => {
  it('正答と誤答を集計し、連続正解を数える', () => {
    let p = emptyProgress();
    p = record(p, 'a', true);
    p = record(p, 'b', true);
    p = record(p, 'c', false);
    p = record(p, 'd', true);
    expect(p.total).toBe(4);
    expect(p.correct).toBe(3);
    expect(p.streak).toBe(1);
    expect(p.bestStreak).toBe(2);
    expect(accuracy(p)).toBeCloseTo(0.75);
  });

  it('誤答は苦手に積まれ、正解すると減って消える', () => {
    let p = emptyProgress();
    p = record(p, 'x', false);
    p = record(p, 'x', false);
    expect(p.wrong.x).toBe(2);
    expect(weakIds(p)).toEqual(['x']);
    p = record(p, 'x', true);
    expect(p.wrong.x).toBe(1);
    p = record(p, 'x', true);
    expect(weakIds(p)).toEqual([]);
  });

  it('元のオブジェクトを書き換えない', () => {
    const before = emptyProgress();
    record(before, 'a', false);
    expect(before.total).toBe(0);
    expect(before.wrong).toEqual({});
  });
});

describe('weakBreakdown', () => {
  it('苦手idを接頭辞で変換ドリルと誤用判定に振り分ける', () => {
    let p = emptyProgress();
    p = record(p, 'c:言う:humble', false);
    p = record(p, 'c:見る:humble', false);
    p = record(p, 'm:double-goran', false);
    expect(weakBreakdown(p)).toEqual({ conversion: 2, misuse: 1 });
  });

  it('苦手がなければ両方0', () => {
    expect(weakBreakdown(emptyProgress())).toEqual({ conversion: 0, misuse: 0 });
  });
});

describe('serialize / deserialize', () => {
  it('往復で内容が保たれる', () => {
    let p = emptyProgress();
    p = record(p, 'a', false);
    p = record(p, 'b', true);
    expect(deserialize(serialize(p))).toEqual(p);
  });

  it('壊れたデータや未知のバージョンは初期状態に戻す', () => {
    expect(deserialize(null)).toEqual(emptyProgress());
    expect(deserialize('{broken')).toEqual(emptyProgress());
    expect(deserialize('{"version":99,"total":5}')).toEqual(emptyProgress());
  });
});
