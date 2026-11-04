/* 共有リンク（URLに内容を圧縮して埋め込む）とPDFダウンロードの共通処理 */
(() => {
'use strict';

const toB64 = buf => {
  let bin = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
};
const fromB64 = s => {
  s = s.replace(/-/g,'+').replace(/_/g,'/');
  const bin = atob(s + '==='.slice((s.length + 3) % 4));
  return Uint8Array.from(bin, c => c.charCodeAt(0));
};

async function encode(obj){
  const data = new TextEncoder().encode(JSON.stringify(obj));
  const stream = new Blob([data]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return toB64(await new Response(stream).arrayBuffer());
}
async function decode(str){
  const stream = new Blob([fromB64(str)]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return JSON.parse(await new Response(stream).text());
}

/* 共有用URLを作る。key は # のあとに付ける名前 */
async function makeLink(key, obj){
  const url = new URL(location.href);
  url.hash = key + '=' + await encode(obj);
  return url.toString();
}
async function readLink(key){
  const m = new RegExp('^#' + key + '=(.+)$').exec(location.hash);
  if (!m) return null;
  try { return await decode(m[1]); } catch(e) { return undefined; }
}

async function copy(text){
  try { await navigator.clipboard.writeText(text); return true; }
  catch(e) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch(_) {}
    ta.remove(); return ok;
  }
}

let pdfLib;
function loadPdfLib(){
  if (window.html2pdf) return Promise.resolve();
  if (pdfLib) return pdfLib;
  pdfLib = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    s.onload = res; s.onerror = () => { pdfLib = null; rej(new Error('PDFライブラリを読み込めませんでした')); };
    document.head.appendChild(s);
  });
  return pdfLib;
}

/* el の内容を A4 の PDF として保存する（幅は用紙の印刷範囲に合わせる） */
async function pdf(el, filename, {landscape = false} = {}){
  await loadPdfLib();
  const width = Math.floor(((landscape ? 297 : 210) - 16) * 96 / 25.4);
  const holder = document.createElement('div');
  holder.className = 'pdf-render';
  holder.style.cssText = `position:fixed;left:-10000px;top:0;width:${width}px;background:#fff`;
  const copy = el.cloneNode(true);
  copy.classList.add('pdf-mode');
  copy.style.width = width + 'px';
  holder.appendChild(copy);
  document.body.appendChild(holder);
  try {
    await document.fonts?.ready;
    await window.html2pdf().set({
      margin: [8, 8, 10, 8],
      filename,
      image: {type:'jpeg', quality:0.85},
      html2canvas: {scale:1.6, useCORS:true, backgroundColor:'#ffffff'},
      jsPDF: {unit:'mm', format:'a4', orientation: landscape ? 'landscape' : 'portrait'},
      pagebreak: {mode:['css','legacy'], avoid:['tr','.pdf-avoid']},
    }).from(holder.firstChild).save();
  } finally { holder.remove(); }
}

window.Share = {encode, decode, makeLink, readLink, copy, pdf};
})();
