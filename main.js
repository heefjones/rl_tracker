const { app, BrowserWindow, ipcMain, session, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const SITE_URL = 'https://rocketleague.tracker.network/';
const API_BASE = 'https://api.tracker.gg/api/v2/rocket-league/standard';

// Fixed data folder so saved accounts persist across dev runs, rebuilds and renames.
app.setPath('userData', path.join(app.getPath('appData'), 'RL Tracker'));

let mainWindow = null;
let scraperWindow = null;
let scraperReady = null;

const storePath = () => path.join(app.getPath('userData'), 'accounts.json');

function loadAccounts() {
  try {
    return JSON.parse(fs.readFileSync(storePath(), 'utf8'));
  } catch {
    return [];
  }
}

function saveAccounts(accounts) {
  fs.mkdirSync(path.dirname(storePath()), { recursive: true });
  fs.writeFileSync(storePath(), JSON.stringify(accounts, null, 2));
}

// tracker.gg's API sits behind Cloudflare, so requests are made from inside a
// hidden window that has loaded the tracker site (real browser context + cookies).
function ensureScraper(forceReload = false) {
  if (scraperWindow && !scraperWindow.isDestroyed() && scraperReady && !forceReload) {
    return scraperReady;
  }
  if (!scraperWindow || scraperWindow.isDestroyed()) {
    const ses = session.fromPartition('persist:tracker');
    ses.setUserAgent(
      `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome} Safari/537.36`
    );
    scraperWindow = new BrowserWindow({
      show: false,
      width: 1100,
      height: 800,
      title: 'Tracker verification',
      webPreferences: { session: ses, contextIsolation: true, nodeIntegration: false },
    });
    scraperWindow.webContents.setAudioMuted(true);
    scraperWindow.on('close', (e) => {
      // Keep the scraper alive; just hide it if the user closes it after verification.
      if (!app.isQuitting) {
        e.preventDefault();
        scraperWindow.hide();
      }
    });
  }
  scraperReady = scraperWindow
    .loadURL(SITE_URL)
    .catch(() => {})
    .then(() => waitForSite(20000));
  return scraperReady;
}

async function waitForSite(timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const host = await scraperWindow.webContents.executeJavaScript('location.hostname');
      const title = await scraperWindow.webContents.executeJavaScript('document.title || ""');
      if (host.includes('tracker.network') && !/just a moment|verif|attention/i.test(title)) return true;
    } catch {
      /* page still navigating */
    }
    await sleep(500);
  }
  return false;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function apiFetch(url) {
  await ensureScraper();
  const code = `fetch(${JSON.stringify(url)}, { credentials: 'include', headers: { accept: 'application/json' } })
    .then(async (r) => { const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch {} return { status: r.status, json }; })
    .catch((e) => ({ status: 0, error: String(e) }))`;
  let res = await scraperWindow.webContents.executeJavaScript(code);
  if (res.status === 403 || res.status === 0 || (res.status === 200 && !res.json)) {
    // Likely a Cloudflare challenge: reload the site (visible so the user can verify if needed) and retry.
    await ensureScraper(true);
    if (!(await waitForSite(3000))) {
      scraperWindow.show();
      await waitForSite(90000);
      scraperWindow.hide();
    }
    res = await scraperWindow.webContents.executeJavaScript(code);
  }
  return res;
}

function parseProfile(json) {
  const data = json.data;
  const playlists = {};
  for (const seg of data.segments || []) {
    if (seg.type !== 'playlist') continue;
    const s = seg.stats || {};
    playlists[seg.attributes.playlistId] = {
      name: seg.metadata.name,
      rating: s.rating ? s.rating.value : null,
      percentile: s.rating && typeof s.rating.percentile === 'number' ? s.rating.percentile : null,
      tier: s.tier ? s.tier.metadata.name : null,
      tierIcon: s.tier ? s.tier.metadata.iconUrl : null,
      division: s.division ? s.division.metadata.name : null,
      matches: s.matchesPlayed ? s.matchesPlayed.value : null,
    };
  }
  const info = data.platformInfo || {};
  return {
    handle: info.platformUserHandle || info.platformUserIdentifier,
    identifier: info.platformUserIdentifier || info.platformUserHandle,
    avatarUrl: info.avatarUrl || null,
    playlists,
    updatedAt: Date.now(),
  };
}

async function lookup(name) {
  const res = await apiFetch(`${API_BASE}/profile/epic/${encodeURIComponent(name)}`);
  if (res.status === 200 && res.json && res.json.data) {
    return { ok: true, profile: parseProfile(res.json) };
  }
  if (res.status === 404) {
    let suggestions = [];
    const s = await apiFetch(
      `${API_BASE}/search?platform=epic&query=${encodeURIComponent(name)}&autocomplete=true`
    );
    if (s.status === 200 && s.json && Array.isArray(s.json.data)) {
      suggestions = s.json.data.slice(0, 6).map((d) => d.platformUserHandle || d.platformUserIdentifier);
    }
    return { ok: false, error: `Player "${name}" not found on Epic.`, suggestions };
  }
  const msg = res.json && res.json.errors && res.json.errors[0] ? res.json.errors[0].message : null;
  return { ok: false, error: msg || `Tracker request failed (HTTP ${res.status || 'network error'}).` };
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1560,
    height: 760,
    minWidth: 900,
    minHeight: 420,
    backgroundColor: '#0d1017',
    autoHideMenuBar: true,
    title: 'RL Tracker',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\/rocketleague\.tracker\.network\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
    app.isQuitting = true;
    app.quit();
  });
}

ipcMain.handle('app:version', () => app.getVersion());
ipcMain.handle('accounts:load', () => loadAccounts());
ipcMain.handle('accounts:save', (_e, accounts) => {
  saveAccounts(accounts);
  return true;
});
ipcMain.handle('tracker:lookup', async (_e, name) => {
  try {
    return await lookup(String(name).trim());
  } catch (err) {
    return { ok: false, error: `Lookup failed: ${err.message}` };
  }
});

app.whenReady().then(() => {
  createMainWindow();
  ensureScraper();
});

app.on('before-quit', () => {
  app.isQuitting = true;
});
app.on('window-all-closed', () => app.quit());
