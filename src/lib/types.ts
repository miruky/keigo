/** 動詞の敬語対照。respectfulが尊敬語、humbleが謙譲語(複数形あり) */
export interface VerbEntry {
  plain: string;
  respectful: string[];
  humble: string[];
  /** 使い分けの補足(任意) */
  note?: string;
}

/** 誤用判定の1問。okが真なら適切な文 */
export interface MisuseItem {
  id: string;
  sentence: string;
  ok: boolean;
  /** 不適切な場合の言い換え */
  fix?: string;
  note: string;
}

export type KeigoForm = 'respectful' | 'humble';

/** 変換ドリルの1問 */
export interface ConversionQuestion {
  kind: 'conversion';
  id: string;
  plain: string;
  form: KeigoForm;
  choices: string[];
  answerIndex: number;
  explanation: string;
}

/** 誤用判定の1問 */
export interface MisuseQuestion {
  kind: 'misuse';
  id: string;
  sentence: string;
  ok: boolean;
  explanation: string;
}

export type Question = ConversionQuestion | MisuseQuestion;
