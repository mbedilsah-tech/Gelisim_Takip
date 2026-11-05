'use strict';

/* =========================================================
   Gelişim Takip — namaz, spor, program ve hedef takibi
   Tüm veriler tarayıcıda (localStorage) saklanır.
   ========================================================= */

/* ---------- Sabitler ---------- */
const TIME_KEYS = ['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'];
const TIME_LABELS = { imsak: 'İmsak', gunes: 'Güneş', ogle: 'Öğle', ikindi: 'İkindi', aksam: 'Akşam', yatsi: 'Yatsı' };
const PRAYERS = [
  { name: 'Sabah', t: 'imsak' },
  { name: 'Öğle', t: 'ogle' },
  { name: 'İkindi', t: 'ikindi' },
  { name: 'Akşam', t: 'aksam' },
  { name: 'Yatsı', t: 'yatsi' },
];
const SPORTS = [
  { name: '1. Set', sub: 'Sabah / Öğle' },
  { name: '2. Set', sub: 'Akşam · yatmadan önce' },
];
const TOTAL = PRAYERS.length + SPORTS.length;
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const WEEKDAYS_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const DAYS_LONG = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

const CITIES = [
  ['Adana', 37.0000, 35.3213], ['Ankara', 39.9334, 32.8597], ['Antalya', 36.8969, 30.7133],
  ['Balıkesir', 39.6484, 27.8826], ['Bursa', 40.1885, 29.0610], ['Denizli', 37.7765, 29.0864],
  ['Diyarbakır', 37.9144, 40.2306], ['Edirne', 41.6772, 26.5557], ['Elazığ', 38.6810, 39.2264],
  ['Erzurum', 39.9000, 41.2700], ['Eskişehir', 39.7767, 30.5206], ['Gaziantep', 37.0662, 37.3833],
  ['Hatay', 36.2028, 36.1606], ['İstanbul', 41.0082, 28.9784], ['İzmir', 38.4237, 27.1428],
  ['Kahramanmaraş', 37.5858, 36.9371], ['Kayseri', 38.7312, 35.4787], ['Kocaeli', 40.7654, 29.9408],
  ['Konya', 37.8746, 32.4932], ['Malatya', 38.3552, 38.3095], ['Manisa', 38.6191, 27.4289],
  ['Mersin', 36.8121, 34.6415], ['Ordu', 40.9839, 37.8764], ['Sakarya', 40.7569, 30.3781],
  ['Samsun', 41.2928, 36.3313], ['Sivas', 39.7477, 37.0179], ['Şanlıurfa', 37.1591, 38.7969],
  ['Tekirdağ', 40.9781, 27.5117], ['Trabzon', 41.0015, 39.7178], ['Van', 38.4891, 43.4089],
];

const STORE_KEY = 'gelisim_takip_v1';

/* ---------- Depolama (localStorage yoksa bellekte tutar) ---------- */
const memStore = {};
const store = {
  get(k) {
    try { const v = localStorage.getItem(k); if (v !== null) return v; } catch (e) { /* yok say */ }
    return k in memStore ? memStore[k] : null;
  },
  set(k, v) {
    memStore[k] = v;
    try { localStorage.setItem(k, v); } catch (e) { /* yok say */ }
  },
};

function defaultState() {
  return {
    version: 1,
    days: {},                     // "2026-11-05": { p:[0,0,0,0,0], s:[0,0], events:[], note:'' }
    goals: { week: {}, month: {} }, // "2026-W45": [{id,text,done}], "2026-11": [...]
    settings: {
      city: 'İstanbul', lat: 41.0082, lng: 28.9784,
      notify: false, before: 0,
      sportNotify: true, sportTimes: ['12:30', '22:00'],
      sportText: '10 dk barfiks + şınav',
    },
  };
}

function loadState() {
  const def = defaultState();
  let s = null;
  try { s = JSON.parse(store.get(STORE_KEY)); } catch (e) { s = null; }
  if (!s || typeof s !== 'object') return def;
  return {
    ...def, ...s,
    goals: { week: { ...(s.goals && s.goals.week) }, month: { ...(s.goals && s.goals.month) } },
    settings: { ...def.settings, ...(s.settings || {}) },
    days: s.days || {},
  };
}

let state = loadState();
function save() { store.set(STORE_KEY, JSON.stringify(state)); }

const ui = {
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(),
  openDay: null,
  goalTab: 'week',
  weekOffset: 0,
  monthOffset: 0,
};

/* ---------- Tarih yardımcıları ---------- */
const pad = n => String(n).padStart(2, '0');
const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const todayKey = () => keyOf(new Date());
const hhmm = mins => `${pad(Math.floor(mins / 60) % 24)}:${pad(mins % 60)}`;
function atTime(date, str) {
  const [h, m] = str.split(':').map(Number);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m, 0, 0);
}
function isoWeek(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7);
  return `${y}-W${pad(w)}`;
}
function mondayOf(d) { const wd = (d.getDay() + 6) % 7; return addDays(d, -wd); }
function longDate(d) { return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} ${DAYS_LONG[d.getDay()]}`; }
function hijri(d) {
  try {
    return new Intl.DateTimeFormat('tr-TR-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' })
      .format(d).replace(/\s*(AH|Hicri)$/i, '') + ' H.';
  } catch (e) { return ''; }
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

/* ---------- Namaz vakti hesabı (çevrimdışı yedek) ----------
   Diyanet yöntemi: İmsak 18°, Yatsı 17°, İkindi Şafii (1 gölge boyu),
   temkin farkları: Güneş −7, Öğle +5, İkindi +4, Akşam +7 dk.
   Diyanet takviminden ±1-2 dk sapabilir. */
const PrayerCalc = (() => {
  const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
  const sin = d => Math.sin(rad(d)), cos = d => Math.cos(rad(d)), tan = d => Math.tan(rad(d));
  const asin = x => deg(Math.asin(x)), acos = x => deg(Math.acos(x));
  const atan2 = (y, x) => deg(Math.atan2(y, x)), acot = x => deg(Math.atan(1 / x));
  const fix = (a, b) => { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; };

  function julian(y, m, d) {
    if (m <= 2) { y -= 1; m += 12; }
    const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  }
  function sunPos(jd) {
    const D = jd - 2451545.0;
    const g = fix(357.529 + 0.98560028 * D, 360);
    const q = fix(280.459 + 0.98564736 * D, 360);
    const L = fix(q + 1.915 * sin(g) + 0.020 * sin(2 * g), 360);
    const e = 23.439 - 0.00000036 * D;
    const RA = fix(atan2(cos(e) * sin(L), cos(L)) / 15, 24);
    return { decl: asin(sin(e) * sin(L)), eqt: q / 15 - RA };
  }
  function compute(date, lat, lng, tz) {
    const jd = julian(date.getFullYear(), date.getMonth() + 1, date.getDate()) - lng / (15 * 24);
    const midDay = t => fix(12 - sunPos(jd + t).eqt, 24);
    const angleTime = (angle, t, ccw) => {
      const decl = sunPos(jd + t).decl;
      const x = (-sin(angle) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat));
      const tt = acos(Math.max(-1, Math.min(1, x))) / 15;
      return midDay(t) + (ccw ? -tt : tt);
    };
    const asrTime = (f, t) => {
      const decl = sunPos(jd + t).decl;
      return angleTime(-acot(f + tan(Math.abs(lat - decl))), t);
    };
    const raw = {
      imsak: angleTime(18, 5 / 24, true),
      gunes: angleTime(0.833, 6 / 24, true),
      ogle: midDay(12 / 24),
      ikindi: asrTime(1, 13 / 24),
      aksam: angleTime(0.833, 18 / 24),
      yatsi: angleTime(17, 18 / 24),
    };
    const temkin = { imsak: 0, gunes: -7, ogle: 5, ikindi: 4, aksam: 7, yatsi: 0 };
    const out = {};
    for (const k of TIME_KEYS) {
      const h = fix(raw[k] + tz - lng / 15, 24);
      out[k] = hhmm((Math.round(h * 60) + temkin[k] + 1440) % 1440);
    }
    return out;
  }
  return { compute };
})();

/* ---------- Namaz vakitleri: önce çevrimiçi (Diyanet yöntemi), yoksa hesap ---------- */
const Times = {
  mem: {},
  pending: {},
  monthKey(y, m) {
    const s = state.settings;
    return `pt|${Number(s.lat).toFixed(3)}|${Number(s.lng).toFixed(3)}|${y}-${m}`;
  },
  get(date) {
    const y = date.getFullYear(), m = date.getMonth() + 1, k = this.monthKey(y, m);
    let month = this.mem[k];
    if (!month) {
      try { const raw = store.get(k); if (raw) month = this.mem[k] = JSON.parse(raw); } catch (e) { /* yok say */ }
    }
    if (!month) this.fetchMonth(y, m);
    const d = month && month.days[date.getDate()];
    if (d) return { ...d, src: 'online' };
    const s = state.settings;
    return { ...PrayerCalc.compute(date, Number(s.lat), Number(s.lng), -date.getTimezoneOffset() / 60), src: 'calc' };
  },
  async fetchMonth(y, m) {
    const k = this.monthKey(y, m);
    if (this.pending[k] || typeof fetch !== 'function') return;
    this.pending[k] = true;
    const s = state.settings;
    try {
      const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      const timer = ctrl && setTimeout(() => ctrl.abort(), 8000);
      const url = `https://api.aladhan.com/v1/calendar/${y}/${m}?latitude=${s.lat}&longitude=${s.lng}&method=13`;
      const res = await fetch(url, ctrl ? { signal: ctrl.signal } : undefined);
      if (timer) clearTimeout(timer);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      const days = {};
      const c = v => String(v).slice(0, 5);
      for (const item of json.data) {
        const t = item.timings;
        days[parseInt(item.date.gregorian.day, 10)] = {
          imsak: c(t.Fajr), gunes: c(t.Sunrise), ogle: c(t.Dhuhr),
          ikindi: c(t.Asr), aksam: c(t.Maghrib), yatsi: c(t.Isha),
        };
      }
      const month = { days, fetched: Date.now() };
      this.mem[k] = month;
      store.set(k, JSON.stringify(month));
      onTimesUpdated();
    } catch (e) {
      // Çevrimdışı ya da erişilemiyor: hesaplanan vakitler kullanılmaya devam eder.
    }
  },
};

function onTimesUpdated() {
  renderWidget();
  renderToday();
  if (ui.openDay) renderDayModal();
  scheduleNotifications();
}

/* ---------- Gün verisi ---------- */
function getDay(key, create) {
  let d = state.days[key];
  if (!d && create) d = state.days[key] = { p: [0, 0, 0, 0, 0], s: [0, 0], events: [], note: '' };
  return d;
}
function dayScore(key) {
  const d = state.days[key];
  if (!d) return 0;
  return d.p.filter(Boolean).length + d.s.filter(Boolean).length;
}
function levelOf(score) {
  if (score >= TOTAL) return 'full';
  if (score >= TOTAL / 2) return 'half';
  if (score > 0) return 'low';
  return '';
}

function toggleItem(key, kind, i) {
  if (key > todayKey()) { toast('İleri tarihli günler işaretlenemez.'); return; }
  const before = dayScore(key);
  const d = getDay(key, true);
  const arr = kind === 'p' ? d.p : d.s;
  arr[i] = arr[i] ? 0 : 1;
  save();
  const after = dayScore(key);
  if (after >= TOTAL && before < TOTAL) toast('Maşallah! Günün tüm hedefleri tamam ⭐', 'gold');
  else if (after >= TOTAL / 2 && before < TOTAL / 2) toast('Günün yarısı tamam, devam! 💪');
  renderAll();
}

/* ---------- Bileşenler ---------- */
function checklistHTML(key) {
  const d = getDay(key) || { p: [0, 0, 0, 0, 0], s: [0, 0] };
  const times = Times.get(parseKey(key));
  const future = key > todayKey();
  const score = dayScore(key);
  const pc = d.p.filter(Boolean).length, sc = d.s.filter(Boolean).length;
  const dis = future ? 'disabled' : '';
  return `
    <div class="sec-title"><span>Namaz</span><span>${pc}/5</span></div>
    <div class="chips">
      ${PRAYERS.map((p, i) => `
        <button class="chip ${d.p[i] ? 'on' : ''}" data-act="toggle" data-kind="p" data-i="${i}" data-key="${key}" ${dis}>
          <span class="ck"></span><span class="chip-name">${p.name}</span><span class="chip-time">${times[p.t]}</span>
        </button>`).join('')}
    </div>
    <div class="sec-title"><span>Spor · ${esc(state.settings.sportText)}</span><span>${sc}/2</span></div>
    <div class="chips sport">
      ${SPORTS.map((s, i) => `
        <button class="chip ${d.s[i] ? 'on' : ''}" data-act="toggle" data-kind="s" data-i="${i}" data-key="${key}" ${dis}>
          <span class="ck"></span><span class="chip-name">${s.name}</span><span class="chip-time">${s.sub}</span>
        </button>`).join('')}
    </div>
    <div class="progress ${score >= TOTAL ? 'full' : ''}"><div style="width:${Math.round(score / TOTAL * 100)}%"></div></div>
    <div class="progress-label"><span>${future ? 'Bu gün henüz gelmedi' : score >= TOTAL ? 'Gün tamamlandı ⭐' : score >= TOTAL / 2 ? 'Yarısı geçti' : 'Devam'}</span><span>${score}/${TOTAL}</span></div>`;
}

function renderHeader() {
  const now = new Date();
  const h = hijri(now);
  document.getElementById('todayLabel').textContent = longDate(now) + (h ? ' · ' + h : '');
}

function nextPrayerInfo(now) {
  const t = Times.get(now);
  let current = null;
  for (const k of TIME_KEYS) {
    const at = atTime(now, t[k]);
    if (at > now) return { next: k, at, current, times: t };
    current = k;
  }
  const tm = addDays(now, 1);
  const t2 = Times.get(tm);
  return { next: 'imsak', at: atTime(tm, t2.imsak), current: 'yatsi', times: t, tomorrow: true };
}

function renderWidget() {
  const now = new Date();
  const info = nextPrayerInfo(now);
  const diff = Math.max(0, Math.floor((info.at - now) / 1000));
  const h = Math.floor(diff / 3600), m = Math.floor(diff % 3600 / 60), s = diff % 60;
  document.getElementById('pwLabel').textContent = `${TIME_LABELS[info.next]}${info.tomorrow ? ' (yarın)' : ''}`;
  document.getElementById('pwTime').textContent = hhmm(info.at.getHours() * 60 + info.at.getMinutes());
  document.getElementById('pwCount').textContent = h ? `${h} sa ${m} dk kaldı` : `${m} dk ${pad(s)} sn kaldı`;
  const pop = document.getElementById('timesPopover');
  if (!pop.hidden) renderPopover(info);
}

function renderPopover(info) {
  info = info || nextPrayerInfo(new Date());
  const s = state.settings;
  const pop = document.getElementById('timesPopover');
  pop.innerHTML = `
    <h3>${esc(s.city)} · Bugün</h3>
    <div class="src">${info.times.src === 'online' ? 'Diyanet hesaplama yöntemi (aladhan.com, canlı)' : 'Diyanet yöntemiyle cihazda hesaplandı (çevrimdışı)'}</div>
    <ul class="times-list">
      ${TIME_KEYS.map(k => `<li class="${k === info.current ? 'now' : ''} ${k === info.next && !info.tomorrow ? 'next' : ''}"><span>${TIME_LABELS[k]}</span><span>${info.times[k]}</span></li>`).join('')}
    </ul>
    <div class="hint" style="margin-top:8px">Şehri ayarlardan değiştirebilirsin.</div>`;
}

function renderCalendar() {
  const y = ui.viewYear, m = ui.viewMonth;
  document.getElementById('monthTitle').textContent = `${MONTHS[m]} ${y}`;
  document.getElementById('weekdays').innerHTML = WEEKDAYS_SHORT.map(w => `<div>${w}</div>`).join('');
  const first = new Date(y, m, 1);
  const lead = (first.getDay() + 6) % 7;
  const count = new Date(y, m + 1, 0).getDate();
  const tk = todayKey();
  let html = '';
  for (let i = 0; i < lead; i++) html += '<div class="cell empty"></div>';
  for (let day = 1; day <= count; day++) {
    const key = `${y}-${pad(m + 1)}-${pad(day)}`;
    const d = state.days[key];
    const score = dayScore(key);
    const cls = ['cell', levelOf(score), key === tk ? 'today' : '', key > tk ? 'future' : ''].join(' ');
    const p = d ? d.p : [0, 0, 0, 0, 0], s = d ? d.s : [0, 0];
    const events = d && d.events ? [...d.events].sort((a, b) => (a.time || '').localeCompare(b.time || '')) : [];
    html += `
      <button class="${cls}" data-act="open-day" data-key="${key}" aria-label="${day} ${MONTHS[m]}, ${score}/${TOTAL}">
        <span class="num">${day}</span>
        <div class="ev-list">${events.slice(0, 2).map(e => `<div>${e.time ? esc(e.time) + ' ' : ''}${esc(e.title)}</div>`).join('')}${events.length > 2 ? `<div>+${events.length - 2} daha</div>` : ''}</div>
        <div class="dots">
          ${p.map(v => `<i class="dot ${v ? 'on' : ''}"></i>`).join('')}<i class="dot sep"></i>${s.map(v => `<i class="dot sq ${v ? 'on' : ''}"></i>`).join('')}
        </div>
        ${events.length ? `<span class="ev-badge">${events.length}</span>` : ''}
      </button>`;
  }
  document.getElementById('calGrid').innerHTML = html;
}

function renderToday() {
  const key = todayKey();
  document.getElementById('todayCard').innerHTML = `
    <h3><span>Bugün</span><button class="pill-btn" data-act="open-day" data-key="${key}">Program & not</button></h3>
    ${checklistHTML(key)}`;
}

function goalPeriod() {
  const now = new Date();
  if (ui.goalTab === 'week') {
    const d = addDays(now, ui.weekOffset * 7);
    const mon = mondayOf(d), sun = addDays(mon, 6);
    const label = mon.getMonth() === sun.getMonth()
      ? `${mon.getDate()}–${sun.getDate()} ${MONTHS[sun.getMonth()]}`
      : `${mon.getDate()} ${MONTHS[mon.getMonth()]} – ${sun.getDate()} ${MONTHS[sun.getMonth()]}`;
    const rel = ui.weekOffset === 0 ? 'Bu hafta' : ui.weekOffset === -1 ? 'Geçen hafta' : ui.weekOffset === 1 ? 'Gelecek hafta' : '';
    return { bucket: 'week', key: isoWeek(d), label: rel ? `${rel} · ${label}` : label };
  }
  const d = new Date(now.getFullYear(), now.getMonth() + ui.monthOffset, 1);
  const rel = ui.monthOffset === 0 ? 'Bu ay · ' : '';
  return { bucket: 'month', key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`, label: `${rel}${MONTHS[d.getMonth()]} ${d.getFullYear()}` };
}

function renderGoals() {
  const per = goalPeriod();
  const list = state.goals[per.bucket][per.key] || [];
  const done = list.filter(g => g.done).length;
  document.getElementById('goalsCard').innerHTML = `
    <h3><span>Hedefler</span>
      <span class="tabs">
        <button class="${ui.goalTab === 'week' ? 'on' : ''}" data-act="goal-tab" data-tab="week">Haftalık</button>
        <button class="${ui.goalTab === 'month' ? 'on' : ''}" data-act="goal-tab" data-tab="month">Aylık</button>
      </span>
    </h3>
    <div class="period">
      <button class="icon-btn" data-act="goal-shift" data-d="-1" aria-label="Önceki">‹</button>
      <span>${per.label}${list.length ? ` · ${done}/${list.length}` : ''}</span>
      <button class="icon-btn" data-act="goal-shift" data-d="1" aria-label="Sonraki">›</button>
    </div>
    <ul class="items">
      ${list.length ? list.map(g => `
        <li class="${g.done ? 'done' : ''}">
          <input type="checkbox" ${g.done ? 'checked' : ''} data-act="goal-check" data-id="${g.id}">
          <span class="txt">${esc(g.text)}</span>
          <button class="del" data-act="goal-del" data-id="${g.id}" aria-label="Sil">×</button>
        </li>`).join('') : `<li class="empty-note" style="background:none;border:none">Henüz hedef yok. Örn: “${per.bucket === 'week' ? 'Mülk suresini oku' : 'Bir kitap bitir'}”</li>`}
    </ul>
    <form class="add-row" data-form="goal">
      <input name="text" placeholder="${per.bucket === 'week' ? 'Bu haftanın hedefi…' : 'Bu ayın hedefi…'}" maxlength="140" autocomplete="off">
      <button class="pill-btn primary" type="submit">Ekle</button>
    </form>`;
}

function streak() {
  let n = 0;
  let d = new Date();
  if (dayScore(keyOf(d)) < TOTAL) d = addDays(d, -1); // bugün henüz bitmediyse dünden say
  while (dayScore(keyOf(d)) >= TOTAL) { n++; d = addDays(d, -1); }
  return n;
}

function renderStats() {
  const y = ui.viewYear, m = ui.viewMonth;
  const count = new Date(y, m + 1, 0).getDate();
  const tk = todayKey();
  let full = 0, half = 0, prayers = 0, sports = 0, elapsed = 0;
  for (let day = 1; day <= count; day++) {
    const key = `${y}-${pad(m + 1)}-${pad(day)}`;
    if (key > tk) break;
    elapsed++;
    const sc = dayScore(key);
    if (sc >= TOTAL) full++; else if (sc >= TOTAL / 2) half++;
    const d = state.days[key];
    if (d) { prayers += d.p.filter(Boolean).length; sports += d.s.filter(Boolean).length; }
  }
  const pr = elapsed ? Math.round(prayers / (elapsed * 5) * 100) : 0;
  document.getElementById('statsCard').innerHTML = `
    <h3><span>${MONTHS[m]} özeti</span></h3>
    <div class="stats">
      <div class="stat"><b>${full}</b><span>tam gün ⭐</span></div>
      <div class="stat"><b>${streak()}</b><span>gün üst üste tam</span></div>
      <div class="stat"><b>%${pr}</b><span>namaz (${prayers}/${elapsed * 5})</span></div>
      <div class="stat"><b>${sports}</b><span>spor seti (${half} yarım gün)</span></div>
    </div>`;
}

function renderDayModal() {
  const key = ui.openDay;
  const modal = document.getElementById('dayModal');
  if (!key) { modal.hidden = true; return; }
  const date = parseKey(key);
  const d = getDay(key) || { events: [], note: '' };
  const events = [...(d.events || [])].sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
  const h = hijri(date);
  document.getElementById('daySheet').innerHTML = `
    <div class="sheet-head">
      <div>
        <h2>${longDate(date)}</h2>
        <div class="muted">${h}${key === todayKey() ? ' · Bugün' : ''}</div>
      </div>
      <div class="sheet-nav">
        <button class="icon-btn" data-act="day-shift" data-d="-1" aria-label="Önceki gün">‹</button>
        <button class="icon-btn" data-act="day-shift" data-d="1" aria-label="Sonraki gün">›</button>
        <button class="icon-btn" data-act="close" aria-label="Kapat">×</button>
      </div>
    </div>
    ${checklistHTML(key)}
    <div class="sec-title"><span>Program</span><span>${events.length || ''}</span></div>
    <ul class="items">
      ${events.length ? events.map(e => `
        <li>
          <span class="time">${e.time ? esc(e.time) : '—'}</span>
          <span class="txt">${esc(e.title)}</span>
          <button class="del" data-act="event-del" data-id="${e.id}" aria-label="Sil">×</button>
        </li>`).join('') : '<li class="empty-note" style="background:none;border:none">Bu gün için program yok.</li>'}
    </ul>
    <form class="add-row" data-form="event">
      <input type="time" name="time">
      <input name="title" placeholder="Program ekle (örn. Diş hekimi)" maxlength="120" autocomplete="off">
      <button class="pill-btn primary" type="submit">Ekle</button>
    </form>
    <div class="sec-title"><span>Not</span></div>
    <textarea class="field" id="dayNote" placeholder="Bu güne dair notun…">${esc(d.note || '')}</textarea>`;
  modal.hidden = false;
}

function renderSettings() {
  const s = state.settings;
  const known = CITIES.some(c => c[0] === s.city);
  const perm = typeof Notification === 'undefined' ? 'desteklenmiyor' :
    Notification.permission === 'granted' ? 'izin verildi' : Notification.permission === 'denied' ? 'engellendi' : 'izin istenmedi';
  document.getElementById('settingsSheet').innerHTML = `
    <div class="sheet-head"><h2>Ayarlar</h2><button class="icon-btn" data-act="close" aria-label="Kapat">×</button></div>
    <div class="form-grid">
      <label>Şehir (namaz vakitleri)
        <select class="field" id="setCity">
          ${CITIES.map(c => `<option ${c[0] === s.city ? 'selected' : ''}>${c[0]}</option>`).join('')}
          ${known ? '' : `<option selected>${esc(s.city)}</option>`}
        </select>
      </label>
      <div class="form-row">
        <button class="pill-btn" data-act="geo">📍 Konumumu kullan</button>
        <span class="hint">Şu an: ${Number(s.lat).toFixed(3)}, ${Number(s.lng).toFixed(3)}</span>
      </div>
      <hr class="sep">
      <div class="switch"><span>Namaz vakti bildirimleri<br><span class="hint">Durum: ${perm}</span></span><input type="checkbox" id="setNotify" ${s.notify ? 'checked' : ''}></div>
      <label>Ne zaman hatırlatılsın?
        <select class="field" id="setBefore">
          ${[0, 5, 10, 15, 30].map(v => `<option value="${v}" ${Number(s.before) === v ? 'selected' : ''}>${v ? `Vakitten ${v} dk önce` : 'Vakit girince'}</option>`).join('')}
        </select>
      </label>
      <div class="switch"><span>Spor hatırlatmaları</span><input type="checkbox" id="setSportNotify" ${s.sportNotify ? 'checked' : ''}></div>
      <div class="form-row">
        <span class="hint">1. set</span><input type="time" class="field" id="setSport0" value="${esc(s.sportTimes[0])}">
        <span class="hint">2. set</span><input type="time" class="field" id="setSport1" value="${esc(s.sportTimes[1])}">
      </div>
      <label>Spor açıklaması
        <input class="field" id="setSportText" value="${esc(s.sportText)}" maxlength="60">
      </label>
      <div class="form-row"><button class="pill-btn" data-act="test-notify">🔔 Deneme bildirimi</button></div>
      <p class="hint" style="margin:0">Bildirimler uygulama açıkken ya da arka planda bir sekmede açık dururken gelir. Telefonda “Ana ekrana ekle” ile kurman önerilir (iPhone'da bildirim için şart).</p>
      <hr class="sep">
      <div class="form-row">
        <button class="pill-btn" data-act="export">⬇️ Yedeği indir</button>
        <label class="pill-btn" style="display:inline-block;font-weight:400">⬆️ Yedek yükle<input type="file" accept="application/json" id="importFile" hidden></label>
      </div>
      <p class="hint" style="margin:0">Veriler sadece bu cihazda/tarayıcıda saklanır. Ara sıra yedek almanı öneririm.</p>
    </div>`;
}

function renderAll() {
  renderHeader();
  renderCalendar();
  renderToday();
  renderGoals();
  renderStats();
  if (ui.openDay) renderDayModal();
}

/* ---------- Bildirimler ---------- */
let swReg = null;
let timers = [];

function toast(msg, kind) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast' + (kind ? ' ' + kind : '');
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.hidden = true; }, 3500);
}

function beep() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 660; g.gain.value = 0.08;
    o.start(); o.stop(ctx.currentTime + 0.35);
  } catch (e) { /* ses yoksa sorun değil */ }
}

function notify(title, body, tag) {
  toast(`🔔 ${title} — ${body}`);
  beep();
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const opts = { body, tag, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', renotify: true };
  try {
    if (swReg) swReg.showNotification(title, opts);
    else new Notification(title, opts);
  } catch (e) { /* yok say */ }
}

function scheduleNotifications() {
  timers.forEach(clearTimeout);
  timers = [];
  const s = state.settings;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tk = keyOf(today);
  const add = (at, fn) => { const ms = at - now; if (ms > 0 && ms < 864e5 * 2) timers.push(setTimeout(fn, ms)); };

  if (s.notify) {
    const t = Times.get(today);
    PRAYERS.forEach((p, i) => {
      const at = new Date(atTime(today, t[p.t]) - Number(s.before) * 60000);
      add(at, () => {
        const d = getDay(tk);
        if (d && d.p[i]) return; // zaten kılındıysa hatırlatma
        notify(`${p.name} namazı`, Number(s.before) ? `${s.before} dk sonra vakit giriyor (${t[p.t]})` : `Vakit girdi · ${t[p.t]}`, 'namaz-' + i);
      });
    });
  }
  if (s.sportNotify) {
    s.sportTimes.forEach((time, i) => {
      if (!time) return;
      add(atTime(today, time), () => {
        const d = getDay(tk);
        if (d && d.s[i]) return;
        notify(`Spor · ${SPORTS[i].name}`, s.sportText, 'spor-' + i);
      });
    });
  }
}

async function enableNotifications() {
  if (typeof Notification === 'undefined') {
    toast('Bu tarayıcı bildirimleri desteklemiyor. Uygulama içi uyarı kullanılacak.');
    return;
  }
  try {
    const p = await Notification.requestPermission();
    if (p !== 'granted') toast('Bildirim izni verilmedi. Uygulama açıkken ekranda uyarı gösterilir.');
    else toast('Bildirimler açık ✅');
  } catch (e) {
    toast('Bildirim izni alınamadı.');
  }
}

/* ---------- Olaylar ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  const pop = document.getElementById('timesPopover');
  if (!e.target.closest('#prayerWidget') && !e.target.closest('#timesPopover')) pop.hidden = true;
  if (!el) {
    if (e.target.classList.contains('overlay')) closeModals();
    return;
  }
  const act = el.dataset.act;
  switch (act) {
    case 'toggle': toggleItem(el.dataset.key, el.dataset.kind, Number(el.dataset.i)); break;
    case 'open-day': ui.openDay = el.dataset.key; renderDayModal(); break;
    case 'day-shift': ui.openDay = keyOf(addDays(parseKey(ui.openDay), Number(el.dataset.d))); renderDayModal(); break;
    case 'close': closeModals(); break;
    case 'goal-tab': ui.goalTab = el.dataset.tab; renderGoals(); break;
    case 'goal-shift':
      if (ui.goalTab === 'week') ui.weekOffset += Number(el.dataset.d); else ui.monthOffset += Number(el.dataset.d);
      renderGoals(); break;
    case 'goal-del': {
      const per = goalPeriod();
      state.goals[per.bucket][per.key] = (state.goals[per.bucket][per.key] || []).filter(g => g.id !== el.dataset.id);
      save(); renderGoals(); break;
    }
    case 'event-del': {
      const d = getDay(ui.openDay);
      if (d) d.events = d.events.filter(x => x.id !== el.dataset.id);
      save(); renderAll(); break;
    }
    case 'geo': useLocation(); break;
    case 'test-notify': notify('Deneme', 'Bildirimler çalışıyor 🎉', 'test'); break;
    case 'export': exportData(); break;
  }
});

document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.act === 'goal-check') {
    const per = goalPeriod();
    const g = (state.goals[per.bucket][per.key] || []).find(x => x.id === t.dataset.id);
    if (g) { g.done = t.checked; save(); renderGoals(); if (g.done) toast('Hedef tamamlandı 🎯'); }
    return;
  }
  const s = state.settings;
  switch (t.id) {
    case 'setCity': {
      const c = CITIES.find(x => x[0] === t.value);
      if (c) { s.city = c[0]; s.lat = c[1]; s.lng = c[2]; }
      save(); onTimesUpdated(); renderSettings(); break;
    }
    case 'setNotify':
      s.notify = t.checked; save();
      if (t.checked) enableNotifications().then(() => { renderSettings(); scheduleNotifications(); });
      else scheduleNotifications();
      break;
    case 'setBefore': s.before = Number(t.value); save(); scheduleNotifications(); break;
    case 'setSportNotify':
      s.sportNotify = t.checked; save();
      if (t.checked && typeof Notification !== 'undefined' && Notification.permission === 'default') enableNotifications();
      scheduleNotifications(); break;
    case 'setSport0': case 'setSport1':
      s.sportTimes[t.id === 'setSport0' ? 0 : 1] = t.value; save(); scheduleNotifications(); break;
    case 'setSportText': s.sportText = t.value.trim() || '10 dk barfiks + şınav'; save(); renderAll(); break;
    case 'importFile': importData(t.files && t.files[0]); break;
  }
});

let noteTimer = null;
document.addEventListener('input', e => {
  if (e.target.id !== 'dayNote' || !ui.openDay) return;
  const val = e.target.value;
  const key = ui.openDay;
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => { getDay(key, true).note = val; save(); }, 300);
});

document.addEventListener('submit', e => {
  const f = e.target;
  e.preventDefault();
  if (f.dataset.form === 'goal') {
    const text = f.text.value.trim();
    if (!text) return;
    const per = goalPeriod();
    (state.goals[per.bucket][per.key] = state.goals[per.bucket][per.key] || []).push({ id: uid(), text, done: false });
    save(); renderGoals();
    const inp = document.querySelector('[data-form="goal"] input');
    if (inp) inp.focus();
  } else if (f.dataset.form === 'event') {
    const title = f.title.value.trim();
    if (!title) return;
    getDay(ui.openDay, true).events.push({ id: uid(), time: f.time.value || '', title });
    save(); renderAll();
    const inp = document.querySelector('[data-form="event"] input[name=title]');
    if (inp) inp.focus();
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModals(); document.getElementById('timesPopover').hidden = true; }
});

function closeModals() {
  ui.openDay = null;
  document.getElementById('dayModal').hidden = true;
  document.getElementById('settingsModal').hidden = true;
}

function useLocation() {
  if (!navigator.geolocation) { toast('Konum desteklenmiyor.'); return; }
  navigator.geolocation.getCurrentPosition(pos => {
    const s = state.settings;
    s.lat = +pos.coords.latitude.toFixed(4);
    s.lng = +pos.coords.longitude.toFixed(4);
    s.city = 'Konumum';
    save(); onTimesUpdated(); renderSettings();
    toast('Konum alındı 📍');
  }, () => toast('Konum alınamadı. Listeden şehir seçebilirsin.'), { timeout: 10000 });
}

function exportData() {
  try {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gelisim-takip-yedek-${todayKey()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  } catch (e) { toast('Yedek indirilemedi.'); }
}

function importData(file) {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const s = JSON.parse(r.result);
      if (!s || typeof s.days !== 'object') throw new Error('geçersiz');
      store.set(STORE_KEY, JSON.stringify(s));
      state = loadState();
      save(); renderAll(); renderSettings(); scheduleNotifications();
      toast('Yedek yüklendi ✅');
    } catch (e) { toast('Bu dosya geçerli bir yedek değil.'); }
  };
  r.readAsText(file);
}

/* ---------- Başlangıç ---------- */
document.getElementById('prevMonth').onclick = () => { const d = new Date(ui.viewYear, ui.viewMonth - 1, 1); ui.viewYear = d.getFullYear(); ui.viewMonth = d.getMonth(); renderCalendar(); renderStats(); };
document.getElementById('nextMonth').onclick = () => { const d = new Date(ui.viewYear, ui.viewMonth + 1, 1); ui.viewYear = d.getFullYear(); ui.viewMonth = d.getMonth(); renderCalendar(); renderStats(); };
document.getElementById('todayBtn').onclick = () => { const n = new Date(); ui.viewYear = n.getFullYear(); ui.viewMonth = n.getMonth(); renderCalendar(); renderStats(); };
document.getElementById('settingsBtn').onclick = () => { renderSettings(); document.getElementById('settingsModal').hidden = false; };
document.getElementById('prayerWidget').onclick = () => {
  const pop = document.getElementById('timesPopover');
  pop.hidden = !pop.hidden;
  if (!pop.hidden) renderPopover();
};

let lastDayKey = todayKey();
setInterval(() => {
  renderWidget();
  const k = todayKey();
  if (k !== lastDayKey) { lastDayKey = k; renderAll(); scheduleNotifications(); }
}, 1000);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) { renderAll(); renderWidget(); scheduleNotifications(); }
});

if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  navigator.serviceWorker.register('sw.js').then(reg => { swReg = reg; }).catch(() => { /* önizlemede SW yok */ });
}

renderAll();
renderWidget();
scheduleNotifications();
