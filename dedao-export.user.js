// ==UserScript==
// @name         Dedao Article Exporter
// @namespace    https://www.dedao.cn/
// @version      2.0.0
// @description  Export Dedao course articles to PDF.
// @match        https://www.dedao.cn/course/article*
// @run-at       document-idle
// @grant        GM_addStyle
// @require      https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
// ==/UserScript==

(function () {
  'use strict';

  const BUTTON_ID = 'dedao-export-pdf-btn';
  const EXPORT_ROOT_ID = 'dedao-export-root';
  const EXPORT_MASK_ID = 'dedao-export-mask';
  const LOG_PREFIX = '[dedao-export]';
  const PAGE_WIDTH_PX = 794;
  const PAGE_HEIGHT_PX = 1123;
  const PAGE_MARGIN_TOP = 72;
  const PAGE_MARGIN_BOTTOM = 96;

  const STYLE = `
    #${BUTTON_ID} {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      border: none;
      border-radius: 999px;
      padding: 10px 16px;
      font-size: 14px;
      font-weight: 600;
      background: #1d1d1f;
      color: #fff;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
      cursor: pointer;
      transition: transform 0.15s ease, opacity 0.15s ease;
    }
    #${BUTTON_ID}:hover { transform: translateY(-1px); }
    #${BUTTON_ID}[disabled] { opacity: 0.6; cursor: not-allowed; }

    #${EXPORT_MASK_ID} {
      position: fixed;
      inset: 0;
      z-index: 999998;
      background: #ffffff;
      overflow: auto;
      padding: 18px 0 40px;
    }

    #${EXPORT_ROOT_ID} {
      position: relative;
      width: ${PAGE_WIDTH_PX}px;
      min-width: ${PAGE_WIDTH_PX}px;
      max-width: ${PAGE_WIDTH_PX}px;
      margin: 0 auto;
      padding: 72px 48px 96px;
      color: #121212;
      background: #fff;
      font-family: "Noto Serif SC", "Source Han Serif SC", "PingFang SC", "Microsoft YaHei", serif;
      line-height: 1.75;
      font-size: 15px;
      box-sizing: border-box;
      word-break: break-word;
    }

    #${EXPORT_ROOT_ID} h1 {
      font-size: 26px;
      margin: 0 0 8px;
      line-height: 1.3;
    }

    #${EXPORT_ROOT_ID} .dedao-export-meta {
      margin: 8px 0 20px;
      font-size: 13px;
      color: #555;
      display: flex;
      flex-wrap: wrap;
      gap: 8px 16px;
    }

    #${EXPORT_ROOT_ID} .dedao-export-meta span {
      white-space: nowrap;
    }

    #${EXPORT_ROOT_ID} .dedao-export-divider {
      height: 1px;
      background: #e5e5e5;
      margin: 18px 0 24px;
    }

    #${EXPORT_ROOT_ID} img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 14px auto;
    }

    #${EXPORT_ROOT_ID} figure {
      margin: 16px 0;
    }

    #${EXPORT_ROOT_ID} figcaption {
      font-size: 12px;
      color: #666;
      text-align: center;
      margin-top: 6px;
    }

    #${EXPORT_ROOT_ID} blockquote {
      margin: 16px 0;
      padding: 12px 16px;
      background: #f7f7f7;
      border-left: 4px solid #d3d3d3;
    }

    #${EXPORT_ROOT_ID} p {
      margin: 10px 0;
    }

    #${EXPORT_ROOT_ID} ul,
    #${EXPORT_ROOT_ID} ol {
      padding-left: 20px;
      margin: 10px 0;
    }

    #${EXPORT_ROOT_ID} a {
      color: #111;
      text-decoration: none;
    }

    #${EXPORT_ROOT_ID},
    #${EXPORT_ROOT_ID} * {
      content-visibility: visible !important;
      contain: none !important;
      box-sizing: border-box;
      max-width: 100%;
    }

    #${EXPORT_ROOT_ID} .dedao-export-content {
      width: 100% !important;
      max-width: none !important;
      overflow: visible !important;
    }

    #${EXPORT_ROOT_ID} h2,
    #${EXPORT_ROOT_ID} h3,
    #${EXPORT_ROOT_ID} h4 {
      margin: 18px 0 8px;
      line-height: 1.4;
    }

    #${EXPORT_ROOT_ID} h2 { font-size: 20px; }
    #${EXPORT_ROOT_ID} h3 { font-size: 18px; }
    #${EXPORT_ROOT_ID} h4 { font-size: 16px; }

    #${EXPORT_ROOT_ID} table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
    }

    #${EXPORT_ROOT_ID} th,
    #${EXPORT_ROOT_ID} td {
      border: 1px solid #e5e5e5;
      padding: 6px 8px;
    }
  `;

  GM_addStyle(STYLE);

  function log(...args) {
    console.log(LOG_PREFIX, ...args);
  }

  function waitForArticleReady(timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const timer = setInterval(() => {
        const titleEl = document.querySelector('.article-title');
        const bodyEl = document.querySelector('.article-body');
        const bodyText = bodyEl ? bodyEl.textContent.trim() : '';
        if (titleEl && bodyEl && bodyText.length > 10) {
          clearInterval(timer);
          resolve({ titleEl, bodyEl });
          return;
        }
        if (Date.now() - start > timeoutMs) {
          clearInterval(timer);
          reject(new Error('Article content not ready.'));
        }
      }, 500);
    });
  }

  function createButton() {
    if (document.getElementById(BUTTON_ID)) return;
    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.type = 'button';
    btn.textContent = '📄 导出PDF';
    btn.addEventListener('click', handleExport);
    document.body.appendChild(btn);
  }

  function getText(selector) {
    const el = document.querySelector(selector);
    if (!el) return '';
    return el.textContent.trim();
  }

  function getExportMeta() {
    const title = getText('.article-title');
    const course = getText('.course-title');
    const publishTime = getText('.article-publish-time') || getText('.article-update-time');
    const author = getText('.article-author') || getText('.author-name');
    const exportedAt = new Date().toLocaleString();

    return {
      title,
      course,
      publishTime,
      author,
      exportedAt,
    };
  }

  function sanitizeFileName(name) {
    return name.replace(/[\\/:*?"<>|]/g, '-').trim();
  }

  function cloneArticleBody() {
    const bodyEl = document.querySelector('.article-body');
    if (!bodyEl) throw new Error('Cannot find article body.');
    const clone = bodyEl.cloneNode(true);

    clone.querySelectorAll('script, style').forEach((el) => el.remove());
    clone.querySelectorAll('.dd-audio, .article-video, .pageControl, .article-settings, .article-control, .my-comment, .message-list, .comment-input-area, .message-title, .message-unfold').forEach((el) => el.remove());

    convertArticleHeaders(clone);
    sanitizeAttributes(clone);

    return clone;
  }

  function convertArticleHeaders(root) {
    root.querySelectorAll('.article-header').forEach((node) => {
      let level = 2;
      const classes = Array.from(node.classList);
      for (const cls of classes) {
        if (cls.startsWith('header-')) {
          const num = Number(cls.split('-')[1]);
          if (!Number.isNaN(num)) {
            level = Math.min(6, Math.max(2, num + 1));
          }
        }
      }
      const heading = document.createElement(`h${level}`);
      while (node.firstChild) heading.appendChild(node.firstChild);
      node.replaceWith(heading);
    });
  }

  function sanitizeAttributes(root) {
    const allowedStyles = new Set(['text-align', 'font-weight', 'font-style', 'text-decoration']);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null);
    while (walker.nextNode()) {
      const el = walker.currentNode;

      if (el.hasAttributes()) {
        Array.from(el.attributes).forEach((attr) => {
          const name = attr.name.toLowerCase();
          if (name === 'class' || name.startsWith('data-') || name.startsWith('aria-') || name.startsWith('on')) {
            el.removeAttribute(attr.name);
          }
        });
      }

      if (el.hasAttribute('style')) {
        const styleText = el.getAttribute('style') || '';
        const kept = styleText
          .split(';')
          .map((part) => part.trim())
          .filter(Boolean)
          .map((part) => {
            const [prop, value] = part.split(':').map((s) => s.trim());
            if (!prop || !value) return null;
            if (!allowedStyles.has(prop.toLowerCase())) return null;
            return `${prop}: ${value}`;
          })
          .filter(Boolean);
        if (kept.length) {
          el.setAttribute('style', kept.join('; '));
        } else {
          el.removeAttribute('style');
        }
      }
    }
  }

  function normalizeImages(root) {
    root.querySelectorAll('img').forEach((img) => {
      const dataSrc = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('data-url');
      if (dataSrc && (!img.getAttribute('src') || img.getAttribute('src').startsWith('data:'))) {
        img.setAttribute('src', dataSrc);
      }
      img.setAttribute('loading', 'eager');
      img.setAttribute('decoding', 'sync');
      img.setAttribute('crossorigin', 'anonymous');
    });
  }

  function waitForImages(root, timeoutMs = 20000) {
    const images = Array.from(root.querySelectorAll('img'));
    if (!images.length) return Promise.resolve();

    let settled = 0;
    return new Promise((resolve) => {
      const done = () => {
        settled += 1;
        if (settled >= images.length) resolve();
      };

      setTimeout(resolve, timeoutMs);

      images.forEach((img) => {
        if (img.complete && img.naturalWidth > 0) {
          done();
          return;
        }
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      });
    });
  }

  function buildExportRoot() {
    const meta = getExportMeta();
    if (!meta.title) throw new Error('Cannot read article title.');

    const mask = document.createElement('div');
    mask.id = EXPORT_MASK_ID;

    const root = document.createElement('div');
    root.id = EXPORT_ROOT_ID;

    const titleEl = document.createElement('h1');
    titleEl.textContent = meta.title;

    const metaWrap = document.createElement('div');
    metaWrap.className = 'dedao-export-meta';

    if (meta.course) metaWrap.appendChild(makeMetaItem('课程', meta.course));
    if (meta.author) metaWrap.appendChild(makeMetaItem('作者', meta.author));
    if (meta.publishTime) metaWrap.appendChild(makeMetaItem('发布时间', meta.publishTime));
    metaWrap.appendChild(makeMetaItem('导出时间', meta.exportedAt));

    const divider = document.createElement('div');
    divider.className = 'dedao-export-divider';

    const bodyClone = cloneArticleBody();
    normalizeImages(bodyClone);

    const bodyWrapper = document.createElement('div');
    bodyWrapper.className = 'dedao-export-content';
    bodyWrapper.appendChild(bodyClone);

    root.appendChild(titleEl);
    root.appendChild(metaWrap);
    root.appendChild(divider);
    root.appendChild(bodyWrapper);

    mask.appendChild(root);
    document.body.appendChild(mask);
    return { root, mask };
  }

  function makeMetaItem(label, value) {
    const span = document.createElement('span');
    span.textContent = `${label}: ${value}`;
    return span;
  }

  function getJsPdf() {
    const jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!jsPDF) throw new Error('jsPDF is not available.');
    return jsPDF;
  }

  async function ensureDependenciesReady() {
    if (!window.html2canvas) throw new Error('html2canvas is not available.');
    getJsPdf();
  }

  function applyNeutralViewportScale() {
    const html = document.documentElement;
    const body = document.body;

    const prev = {
      htmlZoom: html.style.zoom,
      bodyZoom: body.style.zoom,
      htmlTransform: html.style.transform,
      bodyTransform: body.style.transform,
    };

    html.style.zoom = '1';
    body.style.zoom = '1';
    html.style.transform = 'none';
    body.style.transform = 'none';

    return () => {
      html.style.zoom = prev.htmlZoom;
      body.style.zoom = prev.bodyZoom;
      html.style.transform = prev.htmlTransform;
      body.style.transform = prev.bodyTransform;
    };
  }

  async function handleExport() {
    const btn = document.getElementById(BUTTON_ID);
    if (!btn || btn.disabled) return;

    btn.disabled = true;
    const originalLabel = btn.textContent;
    btn.textContent = '生成中...';

    const restoreViewport = applyNeutralViewportScale();
    let exportElements;
    try {
      await ensureDependenciesReady();
      exportElements = buildExportRoot();
      await waitForImages(exportElements.root);

      const rootRect = exportElements.root.getBoundingClientRect();
      const maskWidth = exportElements.mask ? exportElements.mask.offsetWidth : 0;
      log('export-metrics', {
        rootWidth: rootRect.width,
        rootHeight: rootRect.height,
        maskWidth,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      });

      const meta = getExportMeta();
      const filename = sanitizeFileName(meta.title || 'dedao-article') + '.pdf';

      const captureWidth = PAGE_WIDTH_PX;
      const captureHeight = Math.ceil(exportElements.root.scrollHeight);
      const canvas = await window.html2canvas(exportElements.root, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: captureWidth,
        windowWidth: captureWidth,
        scrollX: 0,
        scrollY: 0,
      });

      const pdf = new (getJsPdf())({
        unit: 'px',
        format: [PAGE_WIDTH_PX, PAGE_HEIGHT_PX],
        orientation: 'portrait',
      });

      const pageContentHeight = PAGE_HEIGHT_PX - PAGE_MARGIN_TOP - PAGE_MARGIN_BOTTOM;
      const scaleFactor = canvas.width / PAGE_WIDTH_PX;
      const sliceHeightPx = Math.floor(pageContentHeight * scaleFactor);
      const totalPages = Math.max(1, Math.ceil(canvas.height / sliceHeightPx));

      for (let page = 0; page < totalPages; page += 1) {
        const sliceCanvas = document.createElement('canvas');
        const sliceStartY = page * sliceHeightPx;
        const sliceHeight = Math.min(sliceHeightPx, canvas.height - sliceStartY);
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeight;

        const ctx = sliceCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          sliceStartY,
          canvas.width,
          sliceHeight,
          0,
          0,
          sliceCanvas.width,
          sliceCanvas.height,
        );

        const sliceImg = sliceCanvas.toDataURL('image/jpeg', 0.98);
        const sliceHeightPdf = sliceHeight / scaleFactor;
        pdf.addImage(sliceImg, 'JPEG', 0, PAGE_MARGIN_TOP, PAGE_WIDTH_PX, sliceHeightPdf);

        if (page < totalPages - 1) {
          pdf.addPage();
        }
      }

      pdf.save(filename);
      log('Export finished:', filename);
    } catch (err) {
      console.error(LOG_PREFIX, err);
      alert(`导出失败: ${err.message || err}`);
    } finally {
      if (exportElements && exportElements.mask && exportElements.mask.isConnected) {
        exportElements.mask.remove();
      }
      restoreViewport();
      btn.disabled = false;
      btn.textContent = originalLabel;
    }
  }

  waitForArticleReady()
    .then(() => {
      createButton();
      log('Script loaded.');
    })
    .catch((err) => {
      console.warn(LOG_PREFIX, err.message || err);
    });
})();
