const presenceMeta = {
  'Social Presence': { colour: 'teal', description: "Social presence is the ability of learners to project their personal characteristics into the community of inquiry, thereby presenting themselves as 'real people.'" },
  'Teaching Presence': { colour: 'plum', description: 'Teaching presence is defined as the design, facilitation, and direction of cognitive and social processes for the purpose of realizing personally meaningful and educational worthwhile learning outcomes.' },
  'Cognitive Presence': { colour: 'sky', description: 'Cognitive presence is the extent to which the participants in any particular configuration of a community of inquiry are able to construct meaning through sustained communication. It is a process that develops through four phases: a triggering event, exploration, integration, and resolution.' }
};
const accentClasses = {
  teal: { bar: 'bg-teal', tag: 'bg-teal-50 text-teal-800', button: 'text-teal hover:bg-teal-50' },
  plum: { bar: 'bg-plum', tag: 'bg-purple-50 text-purple-800', button: 'text-plum hover:bg-purple-50' },
  sky: { bar: 'bg-sky', tag: 'bg-blue-50 text-blue-800', button: 'text-sky hover:bg-blue-50' }
};
let frameworkData = {};
let currentFilter = 'All';
const selectedApproaches = new Map();

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('filter-controls').addEventListener('click', handleFilter);
  document.getElementById('approach-grid').addEventListener('click', handleApproachAction);
  document.getElementById('selected-approaches').addEventListener('click', handleRemove);
  document.getElementById('copy-btn').addEventListener('click', copyToClipboard);
  try {
    const response = await fetch('data.json');
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    frameworkData = await response.json();
    renderApproaches();
    openRequestedCategory();
  } catch (error) {
    document.getElementById('approach-grid').innerHTML = '<p class="col-span-full rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800">The strategy library could not be loaded. Please refresh the page or run the site through a local web server.</p>';
    console.error('Error loading strategy data:', error);
  }
  updateSelectedApproaches();
});

function escapeHtml(value = '') { return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }

function handleFilter(event) {
  const button = event.target.closest('[data-filter]');
  if (!button) return;
  currentFilter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(item => item.classList.toggle('active', item === button));
  renderApproaches();
}

function renderApproaches() {
  document.getElementById('approach-grid').innerHTML = Object.entries(presenceMeta).map(([presence, meta]) => {
    const accent = accentClasses[meta.colour];
    const categories = Object.entries(frameworkData[presence] || {}).map(([subcategory, value]) => {
      const approaches = (value.Approaches || []).filter(item => currentFilter === 'All' || item.Source === currentFilter);
      return `<details class="group border-t border-slate-200" data-category="${escapeHtml(subcategory)}">
        <summary class="flex cursor-pointer items-center justify-between gap-4 py-4 font-semibold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"><span>${escapeHtml(subcategory)}</span><span class="flex items-center gap-2 text-sm font-medium text-slate-400">${approaches.length}<svg class="category-chevron h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd"/></svg></span></summary>
        <div class="pb-5">${approaches.length ? `<ul class="space-y-3">${approaches.map(item => renderApproach(item, presence, subcategory, accent)).join('')}</ul>` : '<p class="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No approaches from this source in this category.</p>'}</div>
      </details>`;
    }).join('');
    return `<article class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft"><div class="h-2 ${accent.bar}"></div><div class="p-6"><h3 class="font-display text-2xl text-ink">${escapeHtml(presence)}</h3><p class="mt-3 min-h-[8.75rem] leading-7 text-slate-600">${escapeHtml(meta.description)}</p><div class="mt-5">${categories}</div></div></article>`;
  }).join('');
}

function renderApproach(approach, presence, subcategory, accent) {
  const key = makeKey(presence, subcategory, approach.Description);
  const citationUrl = extractUrl(approach.Citation);
  return `<li class="rounded-2xl bg-slate-50 p-4"><p class="text-sm leading-6 text-slate-700">${escapeHtml(approach.Description)}</p><div class="mt-3 flex flex-wrap items-center justify-between gap-2"><span class="rounded-full px-2.5 py-1 text-xs font-bold ${accent.tag}">${approach.Source === 'A' ? 'Research-based' : 'Focus group'}</span><span class="flex items-center gap-2">${citationUrl ? `<a class="text-xs font-semibold text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-ink" href="${escapeHtml(citationUrl)}" target="_blank" rel="noopener noreferrer">Source</a>` : ''}<button type="button" class="save-approach rounded-full px-3 py-1.5 text-xs font-bold ${accent.button}" data-key="${escapeHtml(key)}" data-presence="${escapeHtml(presence)}" data-subcategory="${escapeHtml(subcategory)}" data-description="${escapeHtml(approach.Description)}">${selectedApproaches.has(key) ? 'Saved ✓' : '+ Save'}</button></span></div></li>`;
}

function extractUrl(citation = '') { const match = citation.match(/https?:\/\/[^\s\)\]\}]+/); return match ? match[0].replace(/[.,;]+$/, '') : ''; }
function makeKey(presence, subcategory, description) { return `${presence}|||${subcategory}|||${description}`; }

function handleApproachAction(event) {
  const button = event.target.closest('.save-approach');
  if (!button) return;
  const { key, presence, subcategory, description } = button.dataset;
  if (selectedApproaches.has(key)) selectedApproaches.delete(key); else selectedApproaches.set(key, { presence, subcategory, description });
  renderApproaches(); updateSelectedApproaches();
}
function handleRemove(event) { const button = event.target.closest('[data-remove]'); if (!button) return; selectedApproaches.delete(button.dataset.remove); renderApproaches(); updateSelectedApproaches(); }

function updateSelectedApproaches() {
  const container = document.getElementById('selected-approaches');
  document.getElementById('copy-btn').disabled = selectedApproaches.size === 0;
  if (!selectedApproaches.size) { container.innerHTML = '<p class="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">No approaches saved yet.</p>'; return; }
  const grouped = {};
  selectedApproaches.forEach((item, key) => { grouped[item.presence] ||= {}; grouped[item.presence][item.subcategory] ||= []; grouped[item.presence][item.subcategory].push({ ...item, key }); });
  container.innerHTML = Object.entries(grouped).map(([presence, categories]) => `<section><h3 class="font-display text-xl text-ink">${escapeHtml(presence)}</h3>${Object.entries(categories).map(([category, items]) => `<div class="mt-3 rounded-2xl border border-slate-200 bg-white p-4"><h4 class="text-sm font-bold text-ink">${escapeHtml(category)}</h4><ul class="mt-2 space-y-2">${items.map(item => `<li class="flex items-start justify-between gap-4 text-sm leading-6 text-slate-600"><span>${escapeHtml(item.description)}</span><button type="button" data-remove="${escapeHtml(item.key)}" class="shrink-0 font-bold text-slate-400 hover:text-rose-600" aria-label="Remove saved approach">×</button></li>`).join('')}</ul></div>`).join('')}</section>`).join('');
}

async function copyToClipboard() {
  const grouped = {};
  selectedApproaches.forEach(item => { grouped[item.presence] ||= {}; grouped[item.presence][item.subcategory] ||= []; grouped[item.presence][item.subcategory].push(item.description); });
  const text = Object.entries(grouped).map(([presence, categories]) => `${presence}\n${Object.entries(categories).map(([category, items]) => `  ${category}\n${items.map(item => `    • ${item}`).join('\n')}`).join('\n')}`).join('\n\n');
  try { await navigator.clipboard.writeText(text); document.getElementById('copy-status').textContent = 'Copied to clipboard.'; setTimeout(() => { document.getElementById('copy-status').textContent = ''; }, 2500); }
  catch { document.getElementById('copy-status').textContent = 'Copy was unavailable in this browser.'; }
}

function openRequestedCategory() {
  const category = new URLSearchParams(window.location.search).get('category');
  if (!category) return;
  const details = [...document.querySelectorAll('[data-category]')].find(item => item.dataset.category === category);
  if (details) { details.open = true; details.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
}
