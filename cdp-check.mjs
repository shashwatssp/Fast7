// Measures horizontal overflow at phone/tablet widths via Chrome DevTools Protocol.
// Usage: node cdp-check.mjs <port> <url1> <url2> ...
const CDP_PORT = process.argv[2];
const urls = process.argv.slice(3);
const WIDTHS = [320, 390, 768];

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => resolve(ws);
    ws.onerror = (e) => reject(new Error('ws error: ' + e.message));
  });
}

let msgId = 0;
const pending = new Map();

async function main() {
  const targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
  const page = targets.find(t => t.type === 'page');
  if (!page) throw new Error('no page target');
  const ws = await connect(page.webSocketDebuggerUrl);
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  };
  const send = (method, params = {}) => new Promise((resolve) => {
    const id = ++msgId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });

  await send('Page.enable');

  for (const url of urls) {
    for (const width of WIDTHS) {
      await send('Emulation.setDeviceMetricsOverride', {
        width, height: 900, deviceScaleFactor: 1, mobile: width < 700,
      });
      await send('Page.navigate', { url });
      await new Promise(r => setTimeout(r, 3500));
      const expr = `(() => {
        const vw = document.documentElement.clientWidth;
        const scrollW = document.documentElement.scrollWidth;
        const bad = [];
        document.querySelectorAll('*').forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && (r.right > vw + 1 || r.left < -1)) {
            bad.push({ tag: el.tagName, cls: String(el.className).slice(0, 70), left: Math.round(r.left), right: Math.round(r.right) });
          }
        });
        return JSON.stringify({
          vw, scrollW, overflow: scrollW > vw + 1,
          hasStorefront: !!document.querySelector('.restaurant-header'),
          bad: bad.slice(0, 10),
        });
      })()`;
      const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
      const value = res.result?.result?.value;
      console.log(`\n=== ${url} @ ${width}px ===`);
      if (value) {
        const d = JSON.parse(value);
        console.log(`viewport=${d.vw} scrollWidth=${d.scrollW} overflow=${d.overflow} storefront=${d.hasStorefront}`);
        if (d.bad.length) console.log('offscreen elements:', JSON.stringify(d.bad, null, 1));
      } else {
        console.log('evaluate failed:', JSON.stringify(res).slice(0, 300));
      }
    }
  }
  ws.close();
  console.log('\nDONE');
}

main().catch(err => { console.error('FATAL', err.message); });
