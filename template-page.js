/* 定型台本ページの共通処理
   イベントごとの型（入力項目・定型文・表の列）は window.EVENT に入れておき、このファイルが画面・保存・共有・PDFを受け持つ。

   window.EVENT の中身
     key, title, unit           保存の名前、ページ名、「大会」「レース」などの呼び方
     modes                      {キー: {label, desc, defaults}} 開催の形（1つだけなら切替は出さない）
     SECTIONS                   入力項目
     computed(v)                入力内容から計算で出す項目を足して返す
     blocks(c)                  進行台本の行 [{at, lap, section, …列のキー}]
     cols                       進行台本の列 [{k, label, w, cls}]
     rough(c) / roughCols       ラフスケジュール（任意）
     appendix(c)                付録の表 [{title, cols, rows}]（任意）
     head                       表紙に出す2行目の定型文
     alias                      計算項目 → 入力項目（クリックで飛ぶ先）
     editorType(b)              台本エディタに送るときの区分 */
(() => {
'use strict';
const E = window.EVENT;
const {SECTIONS} = E;
const STORE_KEY = `event-script-maker:${E.key}:v1`;
const EDITOR_KEY = 'event-script-maker:v1';
const MODE_KEYS = Object.keys(E.modes);
const modeLabel = m => (E.modes[m] || E.modes[MODE_KEYS[0]]).label;

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const FIELDS = Object.fromEntries(SECTIONS.flatMap(s => s.fields.map(f => [f.k, {...f, section:s.id}])));
const LISTS = Object.values(FIELDS).filter(f => f.type === 'list');
const ALIAS = E.alias || {};

/* ---------- 状態 ---------- */
let state = load();
let shared = null;               // 共有リンクで開いたときの内容
let openSections = new Set(E.openSections || SECTIONS.slice(0, 3).map(s => s.id));
let undoFn = null;

function load(){
  try { const d = JSON.parse(localStorage.getItem(STORE_KEY)); if (d && Array.isArray(d.drafts)) return d; } catch(e) {}
  return {drafts:[], currentId:null};
}
let saveTimer;
function save(now){
  clearTimeout(saveTimer);
  const run = () => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); setStatus('保存しました ' + new Date().toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})); }
    catch(e) { setStatus('保存できませんでした（ブラウザの設定をご確認ください）'); }
  };
  setStatus('保存中…');
  now ? run() : (saveTimer = setTimeout(run, 400));
}
const setStatus = t => document.getElementById('saveStatus').textContent = t;
const current = () => shared || state.drafts.find(d => d.id === state.currentId) || null;
const defaults = mode => clone((E.modes[mode] || E.modes[MODE_KEYS[0]]).defaults);
/* 共有リンクを短くするため、初期値から変えた項目だけを入れる */
const diff = (mode, vars) => { const base = defaults(mode); return Object.fromEntries(Object.entries(vars).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(base[k]))); };

function createDraft(mode){
  const d = {id:uid(), mode, vars:defaults(mode), updatedAt:Date.now()};
  state.drafts.unshift(d); state.currentId = d.id;
  save(true); render();
  toast(E.modes[mode].created || `${E.unit}の台本を作りました`);
}

/* ---------- 定型文に入力内容を差し込む ---------- */
function fill(tpl, c, html){
  let s = String(tpl ?? ''), m;
  const sec = /\{\{([#^])(\w+)\}\}([\s\S]*?)\{\{\/\2\}\}/;
  while ((m = sec.exec(s))){
    const val = c[m[2]];
    const on = Array.isArray(val) ? val.length > 0 : typeof val === 'string' ? val.trim() !== '' : !!val;
    s = s.slice(0, m.index) + ((m[1] === '#') === on ? m[3] : '') + s.slice(m.index + m[0].length);
  }
  s = s.replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '');
  const out = s.split(/(\{\{\w+\}\}|__L_\w+?_\d+_\w+__)/).map(p => {
    let k, val, label, at = '';
    if ((m = /^\{\{(\w+)\}\}$/.exec(p))){
      const base = m[1].replace(/_jp$/, '').replace(/\d+$/, n => FIELDS[m[1].replace(/_jp$/, '')] ? n : '');
      k = ALIAS[base] || ALIAS[m[1]] || base; val = c[m[1]];
      label = FIELDS[k]?.label || k;
    } else if ((m = /^__L_(\w+?)_(\d+)_(\w+)__$/.exec(p))){
      const item = (c.L[m[1]] || [])[+m[2]] || {};
      k = m[1]; val = item[m[3]];
      const real = (current() ? (ctxVars(current())[k] || []) : []).indexOf(item);
      at = ` data-i="${real < 0 ? m[2] : real}" data-f="${m[3]}"`;
      label = (FIELDS[k]?.item || []).find(x => x.k === m[3])?.label || FIELDS[k]?.label || k;
    } else return html ? esc(p) : p;
    const str = val == null ? '' : String(val);
    if (!str && p.startsWith('__L_')) return '';   // 一覧の中の空欄は、そのまま空欄にする
    if (!html) return str || `［${label}］`;
    return `<mark class="var${str ? '' : ' empty'}" data-k="${k}"${at} title="${esc(label)}（クリックで入力欄へ）">${str ? esc(str) : '［' + esc(label) + '］'}</mark>`;
  }).join('');
  if (!html) return out;
  return out.split('\n').map(line => {
    const t = line.replace(/<[^>]+>/g, '');
    if (/^[【《＝━]/.test(t)) return `<span class="cue">${line}</span>`;
    if (/^\s*※/.test(t)) return `<span class="note">${line}</span>`;
    if (/^[◆⚫︎□]/.test(t)) return `<span class="head">${line}</span>`;
    return line;
  }).join('\n');
}

const ctxVars = d => d.vars;
function ctx(d){
  /* あとから増えた項目は初期値で補う */
  const v = {...defaults(d.mode), ...d.vars, mode:d.mode};
  const c = E.computed(v);
  c.L = Object.fromEntries(LISTS.map(f => [f.k, (v[f.k] || []).filter(x => x[f.item[0].k])]));
  return c;
}

/* ---------- 描画 ---------- */
const $main = document.getElementById('main');

function render(){
  const d = current();
  if (shared) return renderShared();
  if (!d) return renderEmpty();
  $main.innerHTML = `
    <div class="tk-bar">
      <div class="tk-bar-left">
        <label class="visually-hidden" for="draftSel">台本を切り替え</label>
        <select class="select tk-draft" id="draftSel">
          ${state.drafts.map(x => `<option value="${x.id}" ${x.id===d.id?'selected':''}>${esc(draftName(x))}</option>`).join('')}
        </select>
        <button class="btn btn-tertiary btn-sm" data-act="new">＋ 新しい${esc(E.unit)}</button>
      </div>
      <div class="btn-group">
        <button class="btn btn-primary btn-sm" data-act="share">共有リンクを発行</button>
        <button class="btn btn-secondary btn-sm" data-act="pdf">PDFダウンロード</button>
        <button class="btn btn-secondary btn-sm" data-act="to-editor">エディタで細かく編集</button>
        <button class="btn btn-tertiary btn-sm" data-act="dup">複製</button>
        <button class="btn btn-danger btn-sm" data-act="del">削除</button>
      </div>
    </div>
    <div class="tk-mode"${MODE_KEYS.length > 1 ? ' role="radiogroup" aria-label="開催の形"' : ''}>
      ${MODE_KEYS.length > 1 ? `<span class="label">開催の形</span>
      ${MODE_KEYS.map(k => `<label class="tk-radio"><input type="radio" name="mode" value="${k}" ${d.mode===k?'checked':''}> ${esc(E.modes[k].label)}</label>`).join('')}` : ''}
      <span class="hint">色の付いた文字が入力した内容です。クリックすると入力欄に移動します。</span>
    </div>
    <div class="tk-grid">
      <form class="tk-form" id="form" onsubmit="return false" aria-label="差し込む内容">${formHTML(d)}</form>
      <section class="tk-preview" aria-label="台本プレビュー"><div class="tk-preview-scroll" id="preview">${docHTML(d)}</div></section>
    </div>`;
}
const draftName = x => `${x.vars.name || '無題の' + E.unit}` + (MODE_KEYS.length > 1 ? `（${modeLabel(x.mode)}）` : '');

function templateCards(){
  return MODE_KEYS.map(k => `<button class="template-card" data-new="${k}"><strong>${esc(E.modes[k].label)}</strong><span>${esc(E.modes[k].desc)}</span></button>`).join('');
}

function renderEmpty(){
  $main.innerHTML = `
    <div class="empty" style="margin-top:32px">
      <h2>${esc(E.title)}の台本をつくる</h2>
      <p>${esc(E.intro)}</p>
      <div class="template-grid">${templateCards()}</div>
    </div>`;
}

function renderShared(){
  $main.innerHTML = `
    <div class="tk-shared-banner">
      <div><strong>共有された台本です（閲覧用）</strong><span class="hint">このページで内容を変えても、共有した人の台本は変わりません。</span></div>
      <div class="btn-group">
        <button class="btn btn-primary btn-sm" data-act="pdf">PDFダウンロード</button>
        <button class="btn btn-secondary btn-sm" data-act="import">コピーして編集する</button>
      </div>
    </div>
    <div class="tk-preview tk-preview-full tk-readonly"><div class="tk-preview-scroll" id="preview">${docHTML(shared)}</div></div>`;
}

function formHTML(d){
  const v = d.vars;
  return SECTIONS.filter(s => !s.show || s.show(v)).map(s => {
    const fields = s.fields.filter(f => (!f.mode || f.mode === d.mode) && (!f.show || f.show(v)));
    return `
    <details class="tk-sec" data-sec="${s.id}" ${openSections.has(s.id) ? 'open' : ''}>
      <summary>${esc(s.title)}</summary>
      <div class="tk-fields">${fields.map(f => fieldHTML(f, v)).join('')}</div>
    </details>`;
  }).join('');
}

function inputHTML(type, attrs, val, rows){
  if (type === 'textarea') return `<textarea class="textarea" ${attrs} rows="${rows || 3}">${esc(val)}</textarea>`;
  const t = ['number','time','date'].includes(type) ? type : 'text';
  return `<input class="input${type === 'small' ? ' input-sm' : ''}" type="${t}" ${attrs} value="${esc(val)}" ${t === 'number' ? 'min="0" step="1"' : ''}>`;
}

function fieldHTML(f, v){
  const id = 'f-' + f.k, val = v[f.k];
  const hint = f.hint ? `<span class="hint">${esc(f.hint)}</span>` : '';
  const cls = 'field' + (f.half ? ' half' : '');
  switch (f.type){
    case 'toggle':
      return `<label class="tk-check"><input type="checkbox" id="${id}" data-k="${f.k}" ${val?'checked':''}><span>${esc(f.label)}</span></label>`;
    case 'textarea':
      return `<div class="${cls}"><label for="${id}">${esc(f.label)}</label>${hint}${inputHTML('textarea', `id="${id}" data-k="${f.k}"`, val, f.rows)}</div>`;
    case 'list': {
      const items = val || [];
      return `<div class="field"><span class="label">${esc(f.label)}</span>${hint}
        <ol class="tk-list" id="${id}">${items.map((it, i) => `
          <li><div class="tk-list-head"><span>${esc(f.itemLabel ? f.itemLabel(i) : `${i + 1}つ目`)}</span>
            <button type="button" class="btn-icon" data-act="li-up" data-list="${f.k}" data-i="${i}" aria-label="上へ" ${i===0?'disabled':''}>↑</button>
            <button type="button" class="btn-icon" data-act="li-down" data-list="${f.k}" data-i="${i}" aria-label="下へ" ${i===items.length-1?'disabled':''}>↓</button>
            <button type="button" class="btn-icon" data-act="li-del" data-list="${f.k}" data-i="${i}" aria-label="削除" style="color:var(--red-900)">✕</button></div>
            ${f.item.map(x => {
              const a = `data-list="${f.k}" data-i="${i}" data-f="${x.k}" aria-label="${esc((f.itemLabel ? f.itemLabel(i) : i + 1) + 'の' + x.label)}" placeholder="${esc(x.placeholder || x.label)}"`;
              if (x.type === 'toggle') return `<label class="tk-check"><input type="checkbox" ${a} ${it[x.k] ? 'checked' : ''}><span>${esc(x.label)}</span></label>`;
              return (x.type === 'textarea' ? `<span class="hint">${esc(x.label)}</span>` : '') + inputHTML(x.type === 'textarea' ? 'textarea' : x.type === 'number' ? 'number' : 'small', a, it[x.k], x.rows);
            }).join('')}
          </li>`).join('')}</ol>
        <button type="button" class="btn btn-tertiary btn-sm" data-act="li-add" data-list="${f.k}">＋ ${esc(f.addLabel || '追加')}</button></div>`;
    }
    default:
      return `<div class="${cls}"><label for="${id}">${esc(f.label)}</label>${hint}${inputHTML(f.type, `id="${id}" data-k="${f.k}"`, val)}</div>`;
  }
}

/* PDF用：台詞を空行で区切って複数の行に分ける（差し込み箇所の途中では区切らない） */
function paragraphs(html){
  const out = []; let depth = 0, start = 0;
  for (let i = 0; i < html.length; i++){
    if (html.startsWith('<mark', i)) depth++;
    else if (html.startsWith('</mark>', i)) depth--;
    else if (depth === 0 && html.startsWith('\n\n', i)){ out.push(html.slice(start, i)); start = i + 2; }
  }
  out.push(html.slice(start));
  return out.filter(p => p.trim());
}

function tableHTML(cls, cols, rows, F, split){
  const cell = (col, val) => col.raw ? `<td class="t">${esc(val)}</td>` : `<td class="${col.cls || ''}">${F(val)}</td>`;
  const body = rows.map(r => {
    if (r.section) return `<tr class="tk-sec-row"><td colspan="${cols.length}">${F(r.section)}</td></tr>`;
    const main = cols.findIndex(c => c.main);
    const paras = split && main >= 0 ? paragraphs(F(r[cols[main].k])) : null;
    if (!paras || paras.length < 2) return `<tr>${cols.map(c => cell(c, r[c.k])).join('')}</tr>`;
    return paras.map((p, i) => `<tr class="${i ? 'c-cont' : ''}${i < paras.length - 1 ? ' c-head' : ''}">${cols.map((c, j) =>
      j === main ? `<td class="${c.cls || ''}">${p}</td>` : i === 0 ? cell(c, r[c.k]) : '<td></td>').join('')}</tr>`).join('');
  }).join('');
  return `<table class="tk-table ${cls}">
      <thead><tr>${cols.map(c => { const w = split ? c.pw || c.w : c.w; return `<th${w ? ` style="width:${w}"` : ''}>${esc(c.label)}</th>`; }).join('')}</tr></thead>
      <tbody>${body}</tbody>
    </table>`;
}

function docHTML(d, {split = false} = {}){
  const c = ctx(d);
  const F = t => fill(t, c, true);
  const R = E.rough ? E.rough(c) : null;
  const A = E.appendix ? E.appendix(c) : [];
  return `
  <article class="tk-doc" id="doc">
    <header class="tk-doc-head">
      <h2>${F('{{name}}')}</h2>
      <p>${F(E.head)}</p>
    </header>
    ${R ? `<h3 class="tk-doc-h">【${esc(E.roughTitle || '当日ラフスケジュール')}】</h3>${tableHTML('tk-rough', E.roughCols, R, F, false)}` : ''}
    <h3 class="tk-doc-h">【${esc(E.scriptTitle || '進行台本')}】</h3>
    ${tableHTML('tk-script', E.cols, E.blocks(c), F, split)}
    ${A.map(a => `<h3 class="tk-doc-h">【${esc(a.title)}】</h3>${tableHTML('tk-rough', a.cols, a.rows, F, false)}`).join('')}
  </article>`;
}

let previewTimer;
function refreshPreview(){
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    const el = document.getElementById('preview'); const d = current();
    if (el && d){ const y = el.scrollTop; el.innerHTML = docHTML(d); el.scrollTop = y; }
  }, 120);
}

/* ---------- 入力 ---------- */
document.addEventListener('input', e => {
  const d = current(); if (!d || shared) return;
  const t = e.target;
  if (t.dataset.list && t.dataset.f){
    const item = (FIELDS[t.dataset.list].item || []).find(x => x.k === t.dataset.f) || {};
    d.vars[t.dataset.list][+t.dataset.i][t.dataset.f] = item.type === 'toggle' ? t.checked : item.type === 'number' ? (t.value === '' ? '' : Number(t.value)) : t.value;
  } else if (t.dataset.k){
    const f = FIELDS[t.dataset.k];
    d.vars[t.dataset.k] = f.type === 'toggle' ? t.checked : f.type === 'number' ? (t.value === '' ? '' : Number(t.value)) : t.value;
    if (f.type === 'toggle'){ d.updatedAt = Date.now(); save(); return rerenderForm(t.id); }
  } else return;
  d.updatedAt = Date.now(); save(); refreshPreview();
  if (t.dataset.k === 'name') refreshDraftSel();
});
document.addEventListener('change', e => {
  const d = current(); if (!d || shared) return;
  if (e.target.name === 'mode'){ d.mode = e.target.value; d.updatedAt = Date.now(); save(true); rerenderForm(); toast(`開催の形を「${modeLabel(d.mode)}」にしました`); }
  if (e.target.id === 'draftSel'){ state.currentId = e.target.value; save(true); render(); }
});
document.addEventListener('toggle', e => {
  const s = e.target.dataset?.sec; if (!s) return;
  e.target.open ? openSections.add(s) : openSections.delete(s);
}, true);

function rerenderForm(focusId){
  const form = document.getElementById('form'), d = current();
  if (!form || !d) return;
  const y = form.scrollTop;
  form.innerHTML = formHTML(d); form.scrollTop = y;
  if (focusId) document.getElementById(focusId)?.focus();
  refreshPreview();
}
function refreshDraftSel(){
  const sel = document.getElementById('draftSel'); const d = current();
  const o = sel && [...sel.options].find(o => o.value === d.id);
  if (o) o.textContent = draftName(d);
}

/* プレビューの差し込み箇所をクリック → 入力欄へ */
document.addEventListener('click', e => {
  const mk = e.target.closest('mark.var'); if (!mk || shared) return;
  const k = mk.dataset.k, f = FIELDS[k]; if (!f) return;
  const d = current();
  if (f.show && !f.show(d.vars)) return toast('この項目は今の設定では使われていません');
  openSections.add(f.section);
  const det = document.querySelector(`.tk-sec[data-sec="${f.section}"]`);
  if (det && !det.open) det.open = true;
  const el = mk.dataset.f ? document.querySelector(`[data-list="${k}"][data-i="${mk.dataset.i}"][data-f="${mk.dataset.f}"]`) || document.getElementById('f-' + k) : document.getElementById('f-' + k);
  const box = mk.dataset.f ? el?.closest('li') : el?.closest('.field,.tk-check');
  if (el){ el.scrollIntoView({block:'center', behavior:'smooth'}); (el.matches('ol') ? el.querySelector('input,textarea') : el)?.focus({preventScroll:true}); box?.classList.add('flash'); setTimeout(() => box?.classList.remove('flash'), 1200); }
});

document.addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.new){ document.getElementById('newDlg').close(); createDraft(b.dataset.new); return; }
  if (b.id === 'newCancel'){ document.getElementById('newDlg').close(); return; }
  if (b.id === 'toastUndo'){ undoFn && undoFn(); hideToast(); return; }
  if (b.id === 'shareClose'){ document.getElementById('shareDlg').close(); return; }
  if (b.id === 'shareCopy'){ await Share.copy(document.getElementById('shareUrl').value); toast('コピーしました'); return; }
  const act = b.dataset.act; if (!act) return;
  const d = current();

  switch (act){
    case 'new':
      if (MODE_KEYS.length === 1) createDraft(MODE_KEYS[0]);
      else { document.getElementById('newChoices').innerHTML = templateCards(); document.getElementById('newDlg').showModal(); }
      break;
    case 'share': {
      const url = await Share.makeLink('d', {m:d.mode, v:diff(d.mode, d.vars)});
      const ok = await Share.copy(url);
      document.getElementById('shareUrl').value = url;
      document.getElementById('shareDlg').showModal();
      document.getElementById('shareUrl').select();
      if (!ok) toast('自動でコピーできませんでした。表示されたリンクをコピーしてください');
      break;
    }
    case 'pdf': {
      b.disabled = true; const label = b.textContent; b.textContent = 'PDFを作成中…';
      try {
        const tmp = document.createElement('div'); tmp.innerHTML = docHTML(d, {split:true});
        await Share.pdf(tmp.firstElementChild, `${fileName(d)}.pdf`, {landscape:true});
        toast('PDFをダウンロードしました');
      }
      catch(err){ toast('PDFを作れませんでした。通信状況を確認するか、ブラウザの印刷からPDF保存してください'); }
      finally { b.disabled = false; b.textContent = label; }
      break;
    }
    case 'import': {
      const c = {id:uid(), mode:shared.mode, vars:clone(shared.vars), updatedAt:Date.now()};
      state.drafts.unshift(c); state.currentId = c.id; shared = null;
      history.replaceState(null, '', location.pathname);
      save(true); render(); toast('自分の台本としてコピーしました'); break;
    }
    case 'to-editor': toEditor(d); break;
    case 'dup': {
      const c = {id:uid(), mode:d.mode, vars:clone(d.vars), updatedAt:Date.now()};
      c.vars.name = (d.vars.name || '') + '（コピー）';
      state.drafts.unshift(c); state.currentId = c.id; save(true); render(); toast('複製しました'); break;
    }
    case 'del': {
      const ok = await confirmDlg(`この${E.unit}の台本を削除しますか？`, `「${d.vars.name || '無題の' + E.unit}」を削除します。削除後しばらくは「元に戻す」で復元できます。`);
      if (!ok) break;
      const pos = state.drafts.indexOf(d);
      state.drafts.splice(pos, 1); state.currentId = state.drafts[0]?.id || null; save(true); render();
      toast('削除しました', () => { state.drafts.splice(pos, 0, d); state.currentId = d.id; save(true); render(); });
      break;
    }
    case 'li-add': {
      const f = FIELDS[b.dataset.list];
      const list = d.vars[f.k] = d.vars[f.k] || [];
      list.push(Object.fromEntries(f.item.map(x => [x.k, x.type === 'toggle' ? false : ''])));
      afterList(d, `[data-list="${f.k}"][data-i="${list.length - 1}"][data-f="${f.item[0].k}"]`); break;
    }
    case 'li-del': {
      const f = FIELDS[b.dataset.list], i = +b.dataset.i;
      const [rm] = d.vars[f.k].splice(i, 1); afterList(d);
      toast(`「${rm[f.item[0].k] || f.label}」を削除しました`, () => { d.vars[f.k].splice(i, 0, rm); afterList(d); });
      break;
    }
    case 'li-up': case 'li-down': {
      const list = d.vars[b.dataset.list], i = +b.dataset.i, j = act === 'li-up' ? i - 1 : i + 1;
      [list[i], list[j]] = [list[j], list[i]];
      afterList(d, `[data-act="${act}"][data-list="${b.dataset.list}"][data-i="${j}"]`); break;
    }
  }
});
function afterList(d, focusSel){
  d.updatedAt = Date.now(); save(true); rerenderForm();
  if (focusSel) document.querySelector(focusSel)?.focus();
}
const fileName = d => (d.vars.name || E.title).replace(/[\\/:*?"<>|]/g, '_') + '_進行台本';

/* 通常の台本エディタへ送る（行ごとの細かい編集用） */
function toEditor(d){
  const c = ctx(d);
  const P = t => fill(t, c, false);
  const B = E.blocks(c).filter(b => !b.section && !b.prevDay);   // 前日の行はエディタの時刻計算に入れない
  const toMin = t => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ''); return m ? (+m[1]) * 60 + (+m[2]) : null; };
  const get = (b, role) => { const col = E.cols.find(x => x.role === role); return col ? P(b[col.k]) : ''; };
  const script = {
    id:uid(), title:P('{{name}}'), date:d.vars.date || '', venue:P(E.editorVenue || '{{venue}}'),
    startTime:(B[0]?.at || '12:00').padStart(5, '0'), staff:'', memo:`「${E.title}」ページから作成`,
    rows:B.map((b, i) => {
      const next = B[i + 1], gap = next && toMin(next.at) != null && toMin(b.at) != null ? toMin(next.at) - toMin(b.at) : null;
      return {id:uid(), type:E.editorType ? E.editorType(b) : 'progress', title:get(b, 'title').replace(/\n/g,' ／ '), dur:gap > 0 ? gap : 2,
        speaker:get(b, 'speaker'), line:get(b, 'line'), sound:get(b, 'sound'), light:'', video:'', note:get(b, 'note')};
    }),
    updatedAt:Date.now(),
  };
  let store; try { store = JSON.parse(localStorage.getItem(EDITOR_KEY)); } catch(e) {}
  if (!store || !Array.isArray(store.scripts)) store = {scripts:[], currentId:null};
  store.scripts.unshift(script); store.currentId = script.id;
  try { localStorage.setItem(EDITOR_KEY, JSON.stringify(store)); location.href = 'index.html'; }
  catch(e) { toast('エディタに送れませんでした（ブラウザの保存領域をご確認ください）'); }
}

/* ---------- トースト・ダイアログ ---------- */
let toastTimer;
function toast(msg, undo){
  const el = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  const ub = document.getElementById('toastUndo');
  undoFn = undo || null; ub.hidden = !undo;
  el.hidden = false; clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, undo ? 8000 : 3500);
}
function hideToast(){ document.getElementById('toast').hidden = true; undoFn = null; }
function confirmDlg(title, msg){
  const d = document.getElementById('confirmDlg');
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMsg').textContent = msg;
  return new Promise(res => {
    const ok = document.getElementById('confirmOk'), cancel = document.getElementById('confirmCancel');
    const done = v => { d.close(); ok.onclick = cancel.onclick = null; res(v); };
    ok.onclick = () => done(true); cancel.onclick = () => done(false);
    d.oncancel = () => res(false);
    d.showModal(); cancel.focus();
  });
}

/* ---------- 起動 ---------- */
document.querySelector('.app-nav [aria-current]')?.scrollIntoView({inline:'center', block:'nearest'});
window.addEventListener('hashchange', () => { if (location.hash.startsWith('#d=')) location.reload(); });
(async () => {
  const data = await Share.readLink('d');
  if (data === undefined) toast('共有リンクを読み込めませんでした。リンクが途中で切れていないか確認してください');
  if (data && data.v){
    const mode = E.modes[data.m] ? data.m : MODE_KEYS[0];
    shared = {id:'shared', mode, vars:{...defaults(mode), ...data.v}, updatedAt:Date.now()};
    document.title = (shared.vars.name || E.title) + '｜共有された台本';
  }
  state.drafts.forEach(d => { if (!E.modes[d.mode]) d.mode = MODE_KEYS[0]; d.vars = {...defaults(d.mode), ...d.vars}; });
  if (!shared && !state.currentId && state.drafts[0]) state.currentId = state.drafts[0].id;
  render();
})();
})();
