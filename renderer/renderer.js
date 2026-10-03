const GROUPS = [
  {
    key: 'comp',
    label: 'Competitive',
    playlists: [
      { id: 10, label: '1v1 Duel' },
      { id: 11, label: '2v2 Doubles' },
      { id: 13, label: '3v3 Standard' },
      { id: 61, label: '4v4 Quads' },
      { id: 27, label: 'Hoops' },
      { id: 28, label: 'Rumble' },
      { id: 29, label: 'Dropshot' },
      { id: 30, label: 'Snowday' },
      { id: 63, label: 'Heatseeker' },
    ],
  },
  { key: 'tourn', label: 'Tournaments', playlists: [{ id: 34, label: 'Tournament' }] },
  // Casual has no visible rank in-game, so only the rating number is shown.
  { key: 'casual', label: 'Casual', playlists: [{ id: 0, label: 'Casual', plain: true }] },
];
const COLUMNS = GROUPS.flatMap((g) => g.playlists.map((p) => ({ ...p, group: g.key })));

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

// Each account: { name, profile?, error?, loading? }
let accounts = [];

function persist() {
  window.tracker.saveAccounts(accounts.map(({ name, profile }) => ({ name, profile: profile || null })));
}

// Column sort: { id: playlistId, dir: 'desc' | 'asc' } or null for the manual (drag) order.
let sortState = null;
try {
  sortState = JSON.parse(localStorage.getItem('sort')) || null;
} catch {
  sortState = null;
}

function setSort(next) {
  sortState = next;
  localStorage.setItem('sort', JSON.stringify(sortState));
  renderHead();
}

function onHeaderClick(col) {
  if (drag) return;
  const dir = sortState && sortState.id === col.id && sortState.dir === 'desc' ? 'asc' : 'desc';
  setSort({ id: col.id, dir });
  render();
  persist();
}

// Stable sort of the accounts list by the active column; accounts without a rating stay at the bottom.
function applySort() {
  if (!sortState) return;
  const val = (a) => {
    const pl = a.profile && a.profile.playlists[sortState.id];
    return pl && pl.rating != null ? pl.rating : null;
  };
  const sign = sortState.dir === 'desc' ? -1 : 1;
  accounts = accounts
    .map((a, i) => ({ a, i, v: val(a) }))
    .sort((x, y) => {
      if (x.v == null || y.v == null) return x.v == null && y.v == null ? x.i - y.i : x.v == null ? 1 : -1;
      return (x.v - y.v) * sign || x.i - y.i;
    })
    .map((x) => x.a);
}

function renderHead() {
  const row = el('tr');
  row.append(
    el('th', 'col-account', 'Account'),
    ...COLUMNS.map((c) => {
      const th = el('th', `g-${c.group} sortable`);
      const label = el('span', 'th-label', c.label);
      const active = sortState && sortState.id === c.id;
      if (active) {
        th.classList.add('sorted');
        label.append(el('span', 'sort-arrow', sortState.dir === 'desc' ? '▼' : '▲'));
      }
      th.title = active && sortState.dir === 'desc' ? 'Sort ascending' : 'Sort descending';
      th.onclick = () => onHeaderClick(c);
      th.append(label);
      return th;
    })
  );
  $('thead').replaceChildren(row);
}

function shortTier(tier) {
  return tier
    .replace('Supersonic Legend', 'SSL')
    .replace('Grand Champion', 'GC')
    .replace('Champion', 'Champ')
    .replace('Platinum', 'Plat');
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function accountCell(acc) {
  const td = el('td', 'col-account');
  const wrap = el('div', 'account');
  const p = acc.profile;
  const displayName = (p && p.handle) || acc.name;

  const grip = el('span', 'grip', '⠿');
  grip.title = 'Drag to reorder';

  const avatar = el('div', 'avatar');
  if (p && p.avatarUrl) {
    const img = el('img');
    img.src = p.avatarUrl;
    img.alt = '';
    avatar.append(img);
  } else {
    avatar.textContent = displayName.charAt(0).toUpperCase();
  }

  const info = el('div');
  const nameEl = el('div', 'acc-name');
  const link = el('a', null, displayName);
  link.href = `https://rocketleague.tracker.network/rocket-league/profile/epic/${encodeURIComponent(
    (p && p.identifier) || acc.name
  )}/overview`;
  link.target = '_blank';
  nameEl.append(link);

  info.append(nameEl);
  if (acc.error && !acc.loading) info.append(el('div', 'acc-meta error', acc.error));

  const actions = el('div', 'row-actions');
  const remove = el('button', 'icon-btn danger', '✕');
  remove.title = 'Remove';
  remove.setAttribute('aria-label', `Remove ${displayName}`);
  remove.onclick = () => {
    accounts = accounts.filter((a) => a !== acc);
    persist();
    render();
  };
  actions.append(remove);

  wrap.append(grip, avatar, info, actions);
  td.append(wrap);
  return td;
}

function ratingCell(acc, col) {
  const td = el('td', `g-${col.group}`);
  if (acc.loading && !acc.profile) {
    td.append(el('span', 'spinner'));
    return td;
  }
  const pl = acc.profile && acc.profile.playlists[col.id];
  if (!pl || pl.rating == null) {
    td.append(el('span', 'na', '—'));
    return td;
  }
  const cell = el('div', 'cell');
  const line = el('div', 'mmr-line');
  if (pl.tierIcon && !col.plain) {
    const icon = el('img', 'rank-icon');
    icon.src = pl.tierIcon;
    icon.alt = '';
    line.append(icon);
  }
  line.append(el('span', 'mmr', Math.round(pl.rating).toLocaleString()));
  cell.append(line);
  if (pl.tier && !col.plain) {
    const div = pl.division && pl.tier !== 'Unranked' ? ` · ${pl.division.replace('Division ', 'Div ')}` : '';
    cell.append(el('span', 'rank', shortTier(pl.tier) + div));
  }
  cell.title = [
    pl.name,
    pl.tier && !col.plain && `${pl.tier}${pl.division && pl.tier !== 'Unranked' ? ` ${pl.division}` : ''}`,
    pl.matches != null && `${pl.matches} matches this season`,
  ]
    .filter(Boolean)
    .join('\n');
  td.append(cell);
  return td;
}

function render() {
  if (drag) {
    pendingRender = true;
    return;
  }
  pendingRender = false;
  applySort();
  $('tbody').replaceChildren(
    ...accounts.map((acc) => {
      const tr = el('tr');
      tr.append(accountCell(acc), ...COLUMNS.map((c) => ratingCell(acc, c)));
      tr.addEventListener('pointerdown', (e) => onRowPointerDown(e, tr, acc));
      return tr;
    })
  );
  $('emptyState').classList.toggle('hidden', accounts.length > 0);
  renderUpdated();
}

// Single "Updated x ago" label next to the Refresh button (based on the stalest account).
function renderUpdated() {
  const label = $('updatedLabel');
  const times = accounts.filter((a) => a.profile && a.profile.updatedAt).map((a) => a.profile.updatedAt);
  if (accounts.some((a) => a.loading)) label.textContent = 'Updating…';
  else if (times.length) label.textContent = `Updated ${timeAgo(Math.min(...times))}`;
  else label.textContent = '';
}

// ---------- Drag-and-drop reordering ----------
let drag = null;
let pendingRender = false;
const DRAG_THRESHOLD = 4;
const SHIFT_MS = 200;

function onRowPointerDown(e, tr, acc) {
  if (e.button !== 0 || e.target.closest('a, button') || drag) return;
  e.preventDefault(); // stop text selection / native image drag from hijacking the gesture
  const startY = e.clientY;
  const scroller = $('tableCard');
  const startScroll = scroller.scrollTop;

  const onMove = (ev) => {
    if (!drag) {
      if (Math.abs(ev.clientY - startY) < DRAG_THRESHOLD) return;
      beginDrag(tr, acc);
    }
    ev.preventDefault();
    updateDrag(ev.clientY - startY + (scroller.scrollTop - startScroll));
  };
  const onUp = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    if (drag) endDrag();
  };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
}

function beginDrag(tr, acc) {
  const rows = [...$('tbody').rows];
  const rects = rows.map((r) => r.getBoundingClientRect());
  drag = {
    tr,
    acc,
    rows,
    from: rows.indexOf(tr),
    target: rows.indexOf(tr),
    heights: rects.map((r) => r.height),
    mids: rects.map((r) => r.top + r.height / 2),
    dy: 0,
  };
  document.body.classList.add('is-dragging');
  rows.forEach((r) => {
    if (r !== tr) r.classList.add('shiftable');
  });
  tr.classList.add('dragging');
}

function updateDrag(dy) {
  const { tr, rows, from, heights, mids } = drag;
  drag.dy = dy;
  tr.style.transform = `translateY(${dy}px)`;

  const center = mids[from] + dy;
  let target = from;
  for (let i = from + 1; i < rows.length; i++) if (center > mids[i]) target = i;
  for (let i = from - 1; i >= 0; i--) if (center < mids[i]) target = i;
  drag.target = target;

  const h = heights[from];
  rows.forEach((r, i) => {
    if (i === from) return;
    let shift = 0;
    if (from < target && i > from && i <= target) shift = -h;
    else if (target < from && i >= target && i < from) shift = h;
    r.style.transform = shift ? `translateY(${shift}px)` : '';
  });
}

function endDrag() {
  const { tr, rows, from, target, heights, acc } = drag;
  let finalY = 0;
  if (target > from) for (let i = from + 1; i <= target; i++) finalY += heights[i];
  else for (let i = target; i < from; i++) finalY -= heights[i];

  tr.classList.add('dropping');
  tr.style.transform = `translateY(${finalY}px)`;

  setTimeout(() => {
    rows.forEach((r) => (r.style.transform = ''));
    document.body.classList.remove('is-dragging');
    drag = null;
    if (target !== from) {
      accounts = accounts.filter((a) => a !== acc);
      accounts.splice(target, 0, acc);
      if (sortState) setSort(null); // a manual reorder replaces the column sort
      persist();
    }
    render();
  }, SHIFT_MS);
}

let toastTimer;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 3000);
}

async function refreshAccount(acc) {
  if (!acc || acc.loading) return;
  acc.loading = true;
  acc.error = null;
  render();
  const res = await window.tracker.lookup((acc.profile && acc.profile.identifier) || acc.name);
  acc.loading = false;
  if (res.ok) acc.profile = res.profile;
  else acc.error = res.error;
  if (accounts.includes(acc)) persist();
  render();
}

async function refreshAll() {
  const btn = $('refreshAllBtn');
  btn.disabled = true;
  for (const acc of [...accounts]) {
    await refreshAccount(acc);
  }
  btn.disabled = false;
}

// ---------- Add account modal ----------
function openModal() {
  $('modal').classList.remove('hidden');
  $('nameInput').value = '';
  setFormMsg('');
  $('suggestions').replaceChildren();
  setTimeout(() => $('nameInput').focus(), 0);
}

function closeModal() {
  $('modal').classList.add('hidden');
}

function setFormMsg(msg, isError = false) {
  const m = $('formMsg');
  m.textContent = msg;
  m.classList.toggle('error', isError);
}

const isTracked = (name) =>
  accounts.some(
    (a) =>
      a.name.toLowerCase() === name.toLowerCase() ||
      (a.profile && a.profile.identifier && a.profile.identifier.toLowerCase() === name.toLowerCase())
  );

async function addAccount(name) {
  name = name.trim();
  if (!name) return setFormMsg('Enter an Epic Games username.', true);
  if (isTracked(name)) return setFormMsg('That account is already in the table.', true);

  $('submitBtn').disabled = true;
  $('nameInput').disabled = true;
  $('suggestions').replaceChildren();
  setFormMsg('Searching rocketleague.tracker.network…');

  const res = await window.tracker.lookup(name);

  $('submitBtn').disabled = false;
  $('nameInput').disabled = false;

  if (!res.ok) {
    setFormMsg(res.error, true);
    if (res.suggestions && res.suggestions.length) {
      $('suggestions').append(
        el('div', 'form-msg', 'Did you mean:'),
        ...res.suggestions.map((s) => {
          const b = el('button', null, s);
          b.type = 'button';
          b.onclick = () => {
            $('nameInput').value = s;
            addAccount(s);
          };
          return b;
        })
      );
    }
    $('nameInput').focus();
    return;
  }

  if (isTracked(res.profile.identifier)) return setFormMsg('That account is already in the table.', true);

  accounts.push({ name: res.profile.identifier || name, profile: res.profile });
  persist();
  render();
  closeModal();
  toast(`Added ${res.profile.handle}`);
}

// ---------- Init ----------
$('tbody').addEventListener('dragstart', (e) => e.preventDefault());
$('addBtn').onclick = openModal;
$('cancelBtn').onclick = closeModal;
$('refreshAllBtn').onclick = refreshAll;
$('modal').addEventListener('mousedown', (e) => {
  if (e.target.id === 'modal') closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});
$('addForm').addEventListener('submit', (e) => {
  e.preventDefault();
  addAccount($('nameInput').value);
});

(async () => {
  renderHead();
  accounts = (await window.tracker.loadAccounts()) || [];
  render();
  setInterval(renderUpdated, 30000); // keep "Updated x ago" fresh
  if (accounts.length) refreshAll();
})();
