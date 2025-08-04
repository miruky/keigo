import './style.css';
import {
  FORM_LABELS,
  accuracy,
  buildConversionQuestion,
  buildMisuseQuestion,
  choiceIndexFromKey,
  createRng,
  deserialize,
  emptyProgress,
  isAdvanceKey,
  misuseItems,
  record,
  serialize,
  verbs,
  weakIds,
} from './lib';
import type { KeigoForm, Question } from './lib';

const STORAGE_KEY = 'keigo-progress';

const stage = document.getElementById('stage')!;
const accuracyEl = document.getElementById('score-accuracy')!;
const streakEl = document.getElementById('score-streak')!;
const meterEl = document.getElementById('meter')!;
const meterFill = document.getElementById('meter-fill')!;
const tabs = [...document.querySelectorAll<HTMLButtonElement>('.tab')];

const rng = createRng(Date.now() >>> 0);
let progress = deserialize(localStorage.getItem(STORAGE_KEY));
let mode: 'drill' | 'misuse' | 'review' | 'list' = 'drill';
let current: Question | null = null;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function updateScoreboard(): void {
  const ratio = accuracy(progress);
  const pct = progress.total === 0 ? '--' : (ratio * 100).toFixed(0);
  accuracyEl.textContent = `正答率 ${pct}%(${progress.correct}/${progress.total})`;
  streakEl.textContent = `連続 ${progress.streak}(最高 ${progress.bestStreak})`;
  const filled = progress.total === 0 ? 0 : Math.round(ratio * 100);
  meterFill.style.width = `${filled}%`;
  meterEl.setAttribute('aria-valuenow', String(filled));
}

function saveProgress(): void {
  localStorage.setItem(STORAGE_KEY, serialize(progress));
}

// ---- 出題 ----

/** 復習モードでは苦手として残っている問題idから再出題する */
function nextQuestion(): Question | null {
  if (mode === 'review') {
    const ids = weakIds(progress);
    if (ids.length === 0) return null;
    const id = ids[Math.floor(rng() * ids.length)]!;
    if (id.startsWith('c:')) {
      const [, plain, form] = id.split(':');
      const verb = verbs.find((v) => v.plain === plain);
      if (verb && (form === 'respectful' || form === 'humble') && verb[form].length > 0) {
        return buildConversionQuestion(verbs, rng, { plain: plain!, form: form as KeigoForm });
      }
    }
    if (id.startsWith('m:')) {
      const item = misuseItems.find((i) => `m:${i.id}` === id);
      if (item) return buildMisuseQuestion(misuseItems, rng, item.id);
    }
    return nextQuestionFresh();
  }
  return nextQuestionFresh();
}

function nextQuestionFresh(): Question {
  if (mode === 'misuse') return buildMisuseQuestion(misuseItems, rng);
  if (mode === 'drill') return buildConversionQuestion(verbs, rng);
  // 復習で形式が壊れていた場合の保険として混合出題
  return rng() < 0.5 ? buildConversionQuestion(verbs, rng) : buildMisuseQuestion(misuseItems, rng);
}

function renderQuestion(): void {
  current = nextQuestion();
  if (!current) {
    stage.innerHTML =
      `<section class="card empty-card"><p>苦手な問題はありません。</p>` +
      `<p class="hint">ドリルや誤用判定で間違えた問題がここに溜まり、正解すると消えます。</p></section>`;
    return;
  }
  if (current.kind === 'conversion') {
    const buttons = current.choices
      .map(
        (choice, i) =>
          `<button class="choice" type="button" data-index="${i}" style="--i:${i}">` +
          `${escapeHtml(choice)}</button>`,
      )
      .join('');
    stage.innerHTML =
      `<section class="card question-card">` +
      `<p class="question-type">変換ドリル</p>` +
      `<h2 class="question">「${escapeHtml(current.plain)}」の${FORM_LABELS[current.form]}は?</h2>` +
      `<div class="choices">${buttons}</div>` +
      `<p class="kbd-hint">数字キー <kbd>1</kbd>〜<kbd>${current.choices.length}</kbd> でも回答できます</p>` +
      `<div id="feedback" class="feedback" aria-live="polite"></div>` +
      `</section>`;
  } else {
    stage.innerHTML =
      `<section class="card question-card">` +
      `<p class="question-type">誤用判定</p>` +
      `<h2 class="question sentence">${escapeHtml(current.sentence)}</h2>` +
      `<p class="hint">この敬語の使い方は適切?</p>` +
      `<div class="choices judge">` +
      `<button class="choice" type="button" data-judge="ok" style="--i:0">適切</button>` +
      `<button class="choice" type="button" data-judge="ng" style="--i:1">不適切</button></div>` +
      `<p class="kbd-hint"><kbd>1</kbd> 適切 / <kbd>2</kbd> 不適切</p>` +
      `<div id="feedback" class="feedback" aria-live="polite"></div>` +
      `</section>`;
  }
}

function showFeedback(ok: boolean, explanation: string, chosen: HTMLButtonElement): void {
  progress = record(progress, current!.id, ok);
  saveProgress();
  updateScoreboard();
  const mark = ok
    ? `<svg class="verdict-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5 9.5 18 20 6.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    : `<svg class="verdict-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>`;
  const feedback = document.getElementById('feedback')!;
  feedback.innerHTML =
    `<p class="verdict ${ok ? 'is-ok' : 'is-ng'}">${mark}<span>${ok ? '正解' : '不正解'}</span></p>` +
    `<p class="explanation">${escapeHtml(explanation)}</p>` +
    `<button id="next-button" class="primary-button" type="button">次の問題へ` +
    `<span class="btn-kbd">Enter</span></button>`;
  for (const button of stage.querySelectorAll<HTMLButtonElement>('.choice')) {
    button.disabled = true;
  }
  chosen.classList.add(ok ? 'was-correct' : 'was-wrong');
  if (current!.kind === 'conversion') {
    const correctButton = stage.querySelector<HTMLButtonElement>(
      `.choice[data-index="${current!.answerIndex}"]`,
    );
    correctButton?.classList.add('was-correct');
  }
  document.getElementById('next-button')!.addEventListener('click', renderQuestion);
  document.getElementById('next-button')!.focus();
}

stage.addEventListener('click', (e) => {
  const button = (e.target as HTMLElement).closest<HTMLButtonElement>('.choice');
  if (!button || button.disabled || !current) return;
  if (current.kind === 'conversion') {
    const index = Number(button.dataset.index);
    showFeedback(index === current.answerIndex, current.explanation, button);
  } else {
    const judged = button.dataset.judge === 'ok';
    showFeedback(judged === current.ok, current.explanation, button);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (mode === 'list' || !current) return;
  const next = document.getElementById('next-button');
  if (next) {
    if (isAdvanceKey(e.key)) {
      e.preventDefault();
      (next as HTMLButtonElement).click();
    }
    return;
  }
  let target: HTMLButtonElement | null = null;
  if (current.kind === 'conversion') {
    const index = choiceIndexFromKey(e.key, current.choices.length);
    if (index === null) return;
    target = stage.querySelector(`.choice[data-index="${index}"]`);
  } else {
    const judge = e.key === '1' ? 'ok' : e.key === '2' ? 'ng' : null;
    if (!judge) return;
    target = stage.querySelector(`.choice[data-judge="${judge}"]`);
  }
  if (target) {
    e.preventDefault();
    target.click();
  }
});

// ---- 対照表 ----

function renderList(): void {
  const rows = verbs
    .map(
      (verb) =>
        `<tr><th scope="row">${escapeHtml(verb.plain)}</th>` +
        `<td>${escapeHtml(verb.respectful.join('・') || 'なし')}</td>` +
        `<td>${escapeHtml(verb.humble.join('・') || 'なし')}</td>` +
        `<td>${escapeHtml(verb.note ?? '')}</td></tr>`,
    )
    .join('');
  const misuse = misuseItems
    .filter((item) => !item.ok)
    .map(
      (item) =>
        `<li><span class="ng-sentence">${escapeHtml(item.sentence)}</span>` +
        `<span class="ok-sentence">${escapeHtml(item.fix!)}</span>` +
        `<span class="misuse-note">${escapeHtml(item.note)}</span></li>`,
    )
    .join('');
  stage.innerHTML =
    `<section class="card list-card"><h2>動詞の敬語対照表</h2>` +
    `<div class="table-wrap"><table><thead><tr><th>動詞</th><th>尊敬語</th><th>謙譲語</th><th>補足</th></tr></thead>` +
    `<tbody>${rows}</tbody></table></div></section>` +
    `<section class="card list-card"><h2>よくある誤用と言い換え</h2><ul class="misuse-list">${misuse}</ul></section>`;
}

// ---- モード切替 ----

function setMode(next: typeof mode): void {
  mode = next;
  for (const tab of tabs) {
    const active = tab.dataset.mode === next;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  }
  if (mode === 'list') renderList();
  else renderQuestion();
}

for (const tab of tabs) {
  tab.addEventListener('click', () => setMode(tab.dataset.mode as typeof mode));
}

// ---- 配色テーマ ----

const THEME_KEY = 'keigo-theme';
const themeToggle = document.getElementById('theme-toggle')!;

function applyTheme(theme: string | null): void {
  if (theme === 'light' || theme === 'dark') {
    document.documentElement.setAttribute('data-theme', theme);
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

themeToggle.addEventListener('click', () => {
  const currentTheme =
    document.documentElement.getAttribute('data-theme') ??
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
});

applyTheme(localStorage.getItem(THEME_KEY));

// ---- 成績の書き出し・リセット ----

document.getElementById('export-progress')!.addEventListener('click', () => {
  const blob = new Blob([serialize(progress)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'keigo-progress.json';
  link.click();
  URL.revokeObjectURL(url);
});

document.getElementById('reset-progress')!.addEventListener('click', () => {
  if (progress.total > 0 && !confirm('これまでの成績と苦手リストを消します。よろしいですか?')) {
    return;
  }
  progress = emptyProgress();
  saveProgress();
  updateScoreboard();
  if (mode === 'list') renderList();
  else renderQuestion();
});

updateScoreboard();
setMode('drill');
