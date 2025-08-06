# keigo

[![CI](https://github.com/miruky/keigo/actions/workflows/ci.yml/badge.svg)](https://github.com/miruky/keigo/actions/workflows/ci.yml)
[![Deploy](https://github.com/miruky/keigo/actions/workflows/deploy.yml/badge.svg)](https://github.com/miruky/keigo/actions/workflows/deploy.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**尊敬語・謙譲語の変換ドリルと誤用判定で、敬語の反射神経を鍛えるトレーニング**

デモ: https://miruky.github.io/keigo/

## 概要

keigoは、敬語の使い分けを反復練習するWebアプリである。モードは4つあり、変換ドリルでは「『言う』の尊敬語は?」のような4択に答える。誤用判定では「部長がそうおっしゃられました」のような実際の文を見て適切か不適切かを判断し、答えると言い換えと根拠の解説が出る。間違えた問題は苦手復習に溜まり、正解するまで再出題される。苦手復習では残りの苦手が変換・誤用の内訳とともに示される。対照表モードでは38語の尊敬語・謙譲語の一覧と、よくある誤用と言い換えの一覧を、語形でも解説の語でも絞り込みながら眺められる。回答は選択肢のクリックでも数字キーでも行え、解答後は Enter で次の問題へ進める。

出題には作り込みがある。敬語には「行く・来る・いる」がいずれも「いらっしゃる」になるような語形の共有があるため、誤答の選択肢を単純に他の動詞から取ると正解が2つある問題ができてしまう。出題器は、その動詞のどの語形とも一致しない候補だけを誤答にし、さらに「尊敬語を問うときにその動詞の謙譲語を混ぜる」という紛らわしい選択肢を意図的に加えている。

成績(正答率・連続正解・苦手リスト)はlocalStorageに保存され、ブラウザを閉じても続きから練習できる。ヘッダー下の進捗メーターが正答率を示し、成績はJSONとして書き出せるほか、書き出したファイルを読み込んで別の端末へ引き継いだり、いつでもリセットしたりできる。読み込みではファイルの形式を検証し、壊れたファイルでうっかり成績を消さないようにしている。配色はライト・ダークに対応し、切り替えも記憶される。

### なぜ作ったのか

敬語の知識は一覧表を読んだだけでは定着せず、「とっさに出るか」がすべてで、それには反復しかない。既存の学習サイトは記事の形が多く、間違えた所だけを繰り返す道具が欲しかった。また「おっしゃられました」のような二重敬語は知識としては知っていても文の形で出されると見落としがちで、文単位の判定練習を変換ドリルと別に用意した。語形と誤用の判断は文化審議会答申「敬語の指針」の整理に沿わせ、「とんでもございません」のように指針で許容されている形は引っかけとして適切側に置いている。

## アーキテクチャ

![keigoのアーキテクチャ図](docs/architecture.svg)

## 技術スタック

| カテゴリ             | 技術                                 |
| :------------------- | :----------------------------------- |
| 言語                 | TypeScript 5(strict、実行時依存ゼロ) |
| ビルド               | Vite 8                               |
| テスト               | Vitest(node環境)                     |
| リンタ・フォーマッタ | ESLint(typescript-eslint)+ Prettier  |
| CI / 配信            | GitHub Actions / GitHub Pages        |

## 使い方

### 画面の操作

タブで4モード(変換ドリル / 誤用判定 / 苦手復習 / 対照表)を切り替える。タブはクリックのほか左右矢印キーと Home/End でも移動できる。回答はクリックのほか、変換ドリルでは数字キー(1〜4)、誤用判定では `1`(適切)・`2`(不適切)で選べる。解答後は Enter / Space / `n` で次の問題へ進む。対照表モードの検索欄に語を入れると、動詞表と誤用一覧の両方を語形・解説の語で絞り込める。フッターから成績の書き出し(JSON)・読み込み・リセットができる。

### 出題する

```ts
import { buildConversionQuestion, createRng, verbs } from './lib';

const q = buildConversionQuestion(verbs, createRng(42));
q.choices; // => 4択(正解1つ+選別済みの誤答3つ)
q.choices[q.answerIndex]; // => 正解の語形
q.explanation; // => 「見る」の謙譲語は「拝見する」。尊敬語: ご覧になる / 謙譲語: 拝見する
```

乱数はシード付き(mulberry32)で、同じシードからは同じ出題列が再現される。復習用に `buildConversionQuestion(verbs, rng, { plain: '見る', form: 'humble' })` と対象を固定することもできる。

### 採点と苦手管理

```ts
import { emptyProgress, record, weakIds } from './lib';

let p = emptyProgress();
p = record(p, q.id, false); // 不正解 → 苦手に積まれる
weakIds(p); // => ['c:見る:humble']
p = record(p, q.id, true); // 正解すると苦手から消えていく
```

## プロジェクト構成

- `src/lib/data/verbs.ts` 38語の尊敬語・謙譲語対照表
- `src/lib/data/misuse.ts` 二重敬語・さ入れ・バイト敬語など31問の誤用例
- `src/lib/quiz.ts` シード付き乱数と出題の生成(別解の混入防止)
- `src/lib/progress.ts` 成績・苦手リストの集計、保存、読み込み時の形式検証
- `src/lib/search.ts` 対照表の絞り込み(語形・解説への部分一致)
- `src/lib/keys.ts` キーボード操作の解釈(数字キー→選択肢、次へ進むキー)
- `src/main.ts` タブ・出題・採点フィードバック・キー操作・成績管理のUI配線
- `docs/` アーキテクチャ図

## はじめ方

### 前提条件

- Node.js 24以上

### セットアップ

```bash
git clone https://github.com/miruky/keigo.git
cd keigo
npm ci
npm run dev
```

### テスト・lint・ビルド

```bash
npm test
npm run lint
npm run build
```

### デプロイ

mainへのpushで `deploy.yml` がGitHub Pagesへ公開する。サブパス配信のためのbaseは環境変数 `KEIGO_BASE` で渡す。

## 制約

- 収録は基本動詞38語と誤用31問で、ビジネスメールの文面添削のような自由入力の診断はしない。
- 敬語の許容範囲には立場差がある。本アプリは「敬語の指針」の整理を基準とし、それを解説文にも明記する。

## 設計方針

- **別解を誤答にしない** — 「いらっしゃる」のように複数の動詞で正しい語形があるため、誤答候補は出題した動詞の全語形と突き合わせて選別する。このロジック自体をテストで保証している。
- **間違いは正解するまで残る** — 誤答は問題idごとに積まれ、正解で1つずつ減る。復習モードはこのリストだけから出題する。
- **読み込みは検証してから置き換える** — 成績の読み込みは、書き出し形式に合致するかを `parseProgress` で確かめ、合致しないファイルでは何も上書きしない。localStorageの自動復元は空成績へフォールバックするが、明示的な読み込みでは黙って消さない。
- **根拠を添えて採点する** — 正誤だけでなく、言い換えと「なぜそうなのか」を毎回表示する。出典は敬語の指針に揃える。
- **シード付き乱数** — 出題はすべて再現可能で、テストでは50シードを回して選択肢の不変条件(4択・一意・別解非混入)を検査する。

## ライセンス

[MIT](LICENSE)
