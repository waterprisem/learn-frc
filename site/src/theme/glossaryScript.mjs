/**
 * Inline script: wraps the first mention of each glossary term in lesson text with a tooltip span.
 * Runs after load, skips code, links, headings and interactive islands.
 */
export const glossaryScript = `
addEventListener('DOMContentLoaded', async () => {
  const root = document.querySelector('.sl-markdown-content');
  if (!root || !/^\\/(?!glossary|flashcards|credits)[^/]+\\/[^/]+\\/?$/.test(location.pathname)) return;
  let list;
  try { list = await (await fetch('/glossary.json')).json(); } catch { return; }
  const SKIP = 'code,pre,a,h1,h2,h3,h4,h5,h6,button,summary,kbd,svg,script,style,abbr,astro-island,.lf-playground,.lf-practice,.lf-term,figure,.lf-walk,.expressive-code';
  const forms = new Map();
  const page = document.querySelector('[data-lesson-id]')?.dataset.lessonId;
  if (!page) return;
  for (const e of list) {
    // Single ordinary words ("error", "output") only get a tooltip on the lessons that teach them.
    if (e.term.length < 3 || (!/[\\s\\d]/.test(e.term) && e.term !== e.term.toUpperCase() && !e.lessons.includes(page))) continue;
    forms.set(e.term, e);
    if (e.term !== e.term.toUpperCase()) forms.set(e.term.toLowerCase(), e);
  }
  const esc = (s) => s.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
  const re = new RegExp('(?<![\\\\w-])(' + [...forms.keys()].sort((a, b) => b.length - a.length).map(esc).join('|') + ')(?![\\\\w-])', 'g');
  const used = new Set();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.nodeValue.trim() && !n.parentElement.closest(SKIP) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const text = node.nodeValue;
    let last = 0;
    const frag = document.createDocumentFragment();
    for (const m of text.matchAll(re)) {
      const entry = forms.get(m[1]);
      if (!entry || used.has(entry.id)) continue;
      used.add(entry.id);
      frag.append(text.slice(last, m.index));
      const span = document.createElement('span');
      span.className = 'lf-term';
      span.tabIndex = 0;
      span.dataset.short = entry.short;
      span.textContent = m[1];
      frag.append(span);
      last = m.index + m[1].length;
    }
    if (last) { frag.append(text.slice(last)); node.replaceWith(frag); }
  }
});
`;
