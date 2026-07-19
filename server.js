'use strict';

const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const TRACKER = path.resolve(ROOT, 'tracker');
const statuses = new Set(['planned', 'building', 'live', 'blocked']);

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

async function catalog() {
  const [roadmapText, progressText] = await Promise.all([
    fs.readFile(path.join(TRACKER, 'roadmap.json'), 'utf8'),
    fs.readFile(path.join(TRACKER, 'progress.json'), 'utf8').catch(() => '{"products":[]}')
  ]);
  const roadmap = JSON.parse(roadmapText);
  const progress = JSON.parse(progressText);
  const actual = new Map((progress.products || []).map(product => [Number(product.day), product]));
  return roadmap.map(item => {
    const merged = {...item, ...(actual.get(item.day) || {})};
    merged.status = statuses.has(merged.status) ? merged.status : 'planned';
    return merged;
  });
}

function layout({title, description, content, canonical = '/'}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} · ThirtyFoundry</title><meta name="description" content="${escapeHtml(description)}"><meta property="og:title" content="${escapeHtml(title)} · ThirtyFoundry"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:type" content="website"><link rel="canonical" href="${escapeHtml(process.env.PUBLIC_URL || 'http://localhost:'+PORT)}${escapeHtml(canonical)}"><link rel="stylesheet" href="/styles.css"></head><body><header><a class="brand" href="/">Thirty<span>Foundry</span></a><nav aria-label="Main navigation"><a href="/#products">Products</a><a href="/#pass">Foundry Pass</a><a href="/support">Support</a></nav></header><main>${content}</main><footer><p>© ${new Date().getFullYear()} ThirtyFoundry. Small tools, carefully made.</p><nav aria-label="Legal"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/refund-policy">Refunds</a><a href="/support">Support</a></nav></footer></body></html>`;
}

function home(products) {
  const live = products.filter(p => p.status === 'live').length;
  const cards = products.map(p => {
    const status = escapeHtml(p.status);
    const url = p.url || '{{APP_URL}}';
    const action = p.status === 'live'
      ? `<div class="actions"><a class="button" href="${escapeHtml(url)}" target="_blank" rel="noopener">Start free</a><a href="/apps/${encodeURIComponent(p.id)}">Details</a></div>`
      : `<p class="muted">Day ${p.day} · ${p.status === 'blocked' ? 'Awaiting a dependency' : p.status === 'building' ? 'In the workshop' : 'On the roadmap'}</p>`;
    return `<article class="card"><div class="card-top"><span class="day">${String(p.day).padStart(2,'0')}</span><span class="status ${status}">${status}</span></div><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.problem)}</p>${action}</article>`;
  }).join('');
  return layout({title:'Niche software that earns its tab',description:'Thirty focused SaaS tools for freelancers and independent service businesses.',content:`<section class="hero"><div><p class="eyebrow">30 tools · 30 days · built in public</p><h1>Less busywork for businesses that do real work.</h1><p class="lede">Focused, dependable tools for freelancers and local operators—each useful for free, each affordable to keep.</p><a class="button primary" href="#products">Explore the roadmap</a></div><aside><strong>${live}</strong><span>tools live</span><strong>${30-live}</strong><span>in the foundry</span></aside></section><section id="pass" class="pass"><div><p class="eyebrow">One key, every tool</p><h2>Foundry Pass</h2><p>Unlock Pro across the entire portfolio—including every tool added later.</p></div><div><p><strong>$15/month</strong> or <strong>$149 lifetime</strong></p><a class="button light" href="mailto:support@example.com?subject=Foundry%20Pass">Get launch updates</a></div></section><section id="products"><div class="section-head"><div><p class="eyebrow">The portfolio</p><h2>Thirty narrow tools. Zero bloated suites.</h2></div><p>Individual Pro plans start at $7/month. Every tool keeps a useful free tier.</p></div><div class="grid">${cards}</div></section>`});
}

const legal = {
  privacy: ['Privacy','We design for minimal data collection. The public hub stores no visitor profiles and sets no tracking cookies. Individual tools describe their data use at collection. License validation stores only a Stripe customer identifier, plan, expiry, and a one-way license-key hash. Contact support to request access or deletion.'],
  terms: ['Terms','Use the tools for lawful business purposes. Calculations and generated documents are operational aids, not legal, tax, or financial advice. You remain responsible for reviewing outputs. Services are provided as available; liability is limited to fees paid for the affected product where the law permits.'],
  'refund-policy': ['Refund policy','If a paid tool does not work for you, contact support within 14 days of the first purchase. We review refunds promptly. Lifetime purchases are eligible within the same window; renewed subscription periods are normally non-refundable unless required by law.'],
  support: ['Support','Email support@example.com with the product name, browser, and a description of what happened. Do not send passwords, license keys, payment card details, or sensitive client information. Typical response target: two business days.']
};

async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname === '/styles.css') {
      res.writeHead(200, {'content-type':'text/css; charset=utf-8','cache-control':'public, max-age=300'});
      return res.end(await fs.readFile(path.join(ROOT, 'styles.css')));
    }
    if (url.pathname === '/api/products') return json(res, 200, await catalog());
    if (url.pathname === '/health') return json(res, 200, {ok:true});
    if (url.pathname === '/') return html(res, 200, home(await catalog()));
    const appMatch = url.pathname.match(/^\/apps\/([a-z0-9-]+)$/);
    if (appMatch) {
      const product = (await catalog()).find(p => p.id === appMatch[1] && p.status === 'live');
      if (!product) return html(res, 404, notFound('That product has not launched yet.'));
      const appUrl = product.url || '{{APP_URL}}';
      return html(res, 200, layout({title:product.title,description:product.problem,canonical:url.pathname,content:`<section class="detail"><p class="eyebrow">Day ${product.day} · Now live</p><h1>${escapeHtml(product.title)}</h1><p class="lede">${escapeHtml(product.problem)}</p><p>Use the practical free tier, or unlock Pro for $7/month. Foundry Pass members get Pro automatically.</p><a class="button primary" href="${escapeHtml(appUrl)}" target="_blank" rel="noopener">Open the free app</a><p class="availability">If the app is temporarily unavailable, this page and the rest of the portfolio will remain online. Please retry later or contact support.</p></section>`}));
    }
    if (legal[url.pathname.slice(1)]) {
      const [title, body] = legal[url.pathname.slice(1)];
      return html(res, 200, layout({title,description:`ThirtyFoundry ${title.toLowerCase()}.`,canonical:url.pathname,content:`<article class="prose"><p class="eyebrow">ThirtyFoundry policy</p><h1>${title}</h1><p>${body}</p><p>Last updated: July 19, 2026.</p></article>`}));
    }
    return html(res, 404, notFound('We could not find that page.'));
  } catch (error) {
    console.error('Request failed:', error.message);
    return html(res, 500, layout({title:'Temporarily unavailable',description:'The portfolio data is temporarily unavailable.',content:'<article class="prose"><h1>The foundry hit a snag.</h1><p>The portfolio data could not be loaded. Please retry shortly; individual app outages never take down this page.</p></article>'}));
  }
}

function notFound(message) { return layout({title:'Not found',description:message,content:`<article class="prose"><h1>Not found</h1><p>${escapeHtml(message)}</p><a href="/">Return to the portfolio</a></article>`}); }
function html(res, status, body) { res.writeHead(status, {'content-type':'text/html; charset=utf-8','x-content-type-options':'nosniff'}); res.end(body); }
function json(res, status, body) { res.writeHead(status, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'}); res.end(JSON.stringify(body)); }

if (require.main === module) http.createServer(handler).listen(PORT, () => console.log(`ThirtyFoundry hub listening on http://localhost:${PORT}`));
module.exports = {handler, catalog};
