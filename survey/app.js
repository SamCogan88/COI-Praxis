const presenceStyles = {
  'Teaching Presence': { bar: 'bg-plum', soft: 'bg-purple-50 text-purple-900' },
  'Social Presence': { bar: 'bg-teal', soft: 'bg-teal-50 text-teal-900' },
  'Cognitive Presence': { bar: 'bg-sky', soft: 'bg-blue-50 text-blue-900' }
};
let frameworkData = {};
let latestScores = null;
const totalQuestions = Object.values(questions).flatMap(category => Object.values(category)).reduce((sum, items) => sum + items.length, 0);

document.addEventListener('DOMContentLoaded', async () => {
  generateForm();
  document.getElementById('feedback-form').addEventListener('change', updateProgress);
  document.getElementById('feedback-form').addEventListener('submit', calculateScores);
  document.getElementById('strategy-category').addEventListener('change', event => showMatchingApproaches(event.target.value));
  try {
    const response = await fetch('../data.json');
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    frameworkData = await response.json();
  } catch (error) {
    console.error('Could not load approaches:', error);
  }
});

function escapeHtml(value = '') { return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }

function generateForm() {
  let questionNumber = 0;
  document.getElementById('progress-label').textContent = `0 of ${totalQuestions}`;
  document.getElementById('form-content').innerHTML = Object.entries(questions).map(([presence, categories]) => {
    const style = presenceStyles[presence];
    return `<section class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft"><div class="h-2 ${style.bar}"></div><div class="p-5 sm:p-8"><div class="mb-7"><p class="text-xs font-bold uppercase tracking-[.15em] text-slate-400">Community of Inquiry</p><h2 class="mt-1 font-display text-3xl text-ink">${escapeHtml(presence)}</h2></div>${Object.entries(categories).map(([category, items]) => `<section class="mt-8 first:mt-0"><h3 class="mb-4 inline-flex rounded-full px-3 py-1 text-sm font-bold ${style.soft}">${escapeHtml(category)}</h3><div class="space-y-4">${items.map((question, index) => { questionNumber += 1; return renderQuestion(question, presence, category, index, questionNumber); }).join('')}</div></section>`).join('')}</div></section>`;
  }).join('');
}

function renderQuestion(question, presence, category, index, number) {
  const name = `q|${presence}|${category}|${index}`;
  return `<fieldset class="question-card rounded-2xl border border-slate-200 p-4 transition sm:p-5" data-question="${number}"><legend class="w-full text-base font-medium leading-7 text-slate-700"><span class="mr-2 text-sm font-bold text-slate-400">${number}.</span>${escapeHtml(question)}</legend><div class="mt-4 flex flex-wrap items-center justify-between gap-3"><span class="text-xs font-semibold text-slate-400">Strongly disagree</span><div class="flex gap-2" aria-label="Rating from 1 to 5">${[1, 2, 3, 4, 5].map(value => `<label class="rating-option relative"><input type="radio" name="${escapeHtml(name)}" value="${value}" required aria-label="${value}: ${value === 1 ? 'Strongly disagree' : value === 5 ? 'Strongly agree' : `Rating ${value}`}"><span>${value}</span></label>`).join('')}</div><span class="text-xs font-semibold text-slate-400">Strongly agree</span></div></fieldset>`;
}

function updateProgress() {
  const answered = new Set([...new FormData(document.getElementById('feedback-form')).keys()]).size;
  document.getElementById('progress-label').textContent = `${answered} of ${totalQuestions}`;
  document.getElementById('progress-bar').style.width = `${(answered / totalQuestions) * 100}%`;
}

function calculateScores(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const answered = new Set([...formData.keys()]).size;
  const error = document.getElementById('form-error');
  if (answered < totalQuestions) {
    const firstMissing = [...form.querySelectorAll('.question-card')].find(card => !card.querySelector('input:checked'));
    error.textContent = `Please respond to all statements. ${totalQuestions - answered} ${totalQuestions - answered === 1 ? 'response is' : 'responses are'} still missing.`;
    error.classList.remove('hidden');
    firstMissing?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    firstMissing?.querySelector('input')?.focus({ preventScroll: true });
    return;
  }
  error.classList.add('hidden');
  const sums = {}; const counts = {};
  for (const [key, value] of formData.entries()) {
    const [, presence, category] = key.split('|');
    sums[presence] ||= {}; counts[presence] ||= {};
    sums[presence][category] = (sums[presence][category] || 0) + Number(value);
    counts[presence][category] = (counts[presence][category] || 0) + 1;
  }
  const scores = {}; const overall = {};
  Object.entries(sums).forEach(([presence, categories]) => {
    scores[presence] = {};
    let total = 0; let count = 0;
    Object.entries(categories).forEach(([category, sum]) => { scores[presence][category] = sum / counts[presence][category]; total += sum; count += counts[presence][category]; });
    overall[presence] = total / count;
  });
  latestScores = scores;
  displayResults(scores, overall);
}

function getBand(score) {
  if (score < 2.5) return { label: 'Explore', classes: 'bg-amber-50 text-amber-900 ring-amber-200' };
  if (score < 3.75) return { label: 'Develop', classes: 'bg-blue-50 text-blue-900 ring-blue-200' };
  return { label: 'Extend', classes: 'bg-teal-50 text-teal-900 ring-teal-200' };
}

function displayResults(scores, overall) {
  document.getElementById('results').innerHTML = Object.entries(scores).map(([presence, categories]) => {
    const band = getBand(overall[presence]);
    return `<article class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft"><div class="h-2 ${presenceStyles[presence].bar}"></div><div class="p-6"><div class="flex items-start justify-between gap-3"><h3 class="font-display text-2xl text-ink">${escapeHtml(presence)}</h3><span class="rounded-full px-3 py-1 text-xs font-bold ring-1 ${band.classes}">${band.label}</span></div><p class="mt-3 text-4xl font-bold text-ink">${overall[presence].toFixed(2)}<span class="text-base font-medium text-slate-400"> / 5</span></p><ul class="mt-5 divide-y divide-slate-100">${Object.entries(categories).map(([category, score]) => `<li class="flex items-center justify-between gap-3 py-3"><button type="button" class="result-category text-left text-sm font-semibold text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-teal" data-result="${escapeHtml(`${presence}|||${category}`)}">${escapeHtml(category)}</button><span class="font-bold text-ink">${score.toFixed(2)}</span></li>`).join('')}</ul></div></article>`;
  }).join('');
  document.querySelectorAll('.result-category').forEach(button => button.addEventListener('click', () => selectStrategyCategory(button.dataset.result)));
  populateStrategySelector(scores);
  const section = document.getElementById('results-section');
  section.classList.remove('hidden'); section.focus({ preventScroll: true }); section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function populateStrategySelector(scores) {
  const entries = Object.entries(scores).flatMap(([presence, categories]) => Object.entries(categories).map(([category, score]) => ({ presence, category, score })));
  const select = document.getElementById('strategy-category');
  select.innerHTML = `<option value="">Choose a category</option>${entries.map(item => `<option value="${escapeHtml(`${item.presence}|||${item.category}`)}">${escapeHtml(item.category)} · ${item.score.toFixed(2)} (${escapeHtml(item.presence)})</option>`).join('')}`;
  select.value = '';
  document.getElementById('matching-approaches').innerHTML = '<p class="text-sm text-slate-600">Select a category to view matching approaches.</p>';
}

function selectStrategyCategory(value) {
  const select = document.getElementById('strategy-category'); select.value = value; showMatchingApproaches(value);
  select.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showMatchingApproaches(value) {
  if (!value) {
    document.getElementById('matching-approaches').innerHTML = '<p class="text-sm text-slate-600">Select a category to view matching approaches.</p>';
    return;
  }
  const [presence, category] = value.split('|||');
  const approaches = frameworkData[presence]?.[category]?.Approaches || [];
  const score = latestScores?.[presence]?.[category];
  const container = document.getElementById('matching-approaches');
  if (!approaches.length) { container.innerHTML = `<p class="text-sm text-slate-600">Matching approaches could not be loaded. <a class="font-bold text-teal underline" href="../?category=${encodeURIComponent(category)}">Open this category in the full library</a>.</p>`; return; }
  const preview = approaches.slice(0, 4);
  container.innerHTML = `<div class="flex flex-wrap items-start justify-between gap-3"><div><p class="text-xs font-bold uppercase tracking-[.14em] text-teal">${escapeHtml(presence)}</p><h4 class="mt-1 font-display text-2xl text-ink">${escapeHtml(category)}</h4></div>${Number.isFinite(score) ? `<span class="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-ink">${score.toFixed(2)} / 5</span>` : ''}</div><ul class="mt-4 space-y-3">${preview.map(item => `<li class="rounded-xl bg-slate-50 p-3 text-sm leading-6"><span class="mr-2 font-bold text-teal">→</span>${escapeHtml(item.Description)}</li>`).join('')}</ul><a class="mt-5 inline-flex rounded-full bg-teal px-4 py-2 text-sm font-bold text-white hover:bg-teal-800" href="../?category=${encodeURIComponent(category)}">See all ${approaches.length} approaches →</a>`;
}
