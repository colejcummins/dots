"use strict";

const STORE_KEY = "dots.v1";
const COLORS = ["red", "orange", "yellow", "green", "blue", "purple"];
const MONTHS = ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];
const DAYS = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

let state = load();
let editing = false;
let pickedColor = COLORS[0];
// month being viewed in the calendar
let view = { y: new Date().getFullYear(), m: new Date().getMonth() };

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (Array.isArray(s.habits) && s.log && typeof s.log === "object") return s;
    }
  } catch (_) {}
  return { habits: [], log: {} };
}

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function dateKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function todayKey() {
  const n = new Date();
  return dateKey(n.getFullYear(), n.getMonth(), n.getDate());
}

function doneToday(id) {
  return (state.log[todayKey()] || []).includes(id);
}

function toggle(id) {
  const k = todayKey();
  const day = state.log[k] || [];
  state.log[k] = day.includes(id) ? day.filter(x => x !== id) : [...day, id];
  if (state.log[k].length === 0) delete state.log[k];
  save();
  render();
}

function addHabit(name, color) {
  state.habits.push({ id: crypto.randomUUID(), name, color });
  save();
}

function removeHabit(id) {
  state.habits = state.habits.filter(h => h.id !== id);
  for (const k of Object.keys(state.log)) {
    state.log[k] = state.log[k].filter(x => x !== id);
    if (state.log[k].length === 0) delete state.log[k];
  }
  save();
}

/* ---------- render ---------- */

const $ = id => document.getElementById(id);

function render() {
  renderHeader();
  renderHabits();
  renderCalendar();
}

function renderHeader() {
  const n = new Date();
  $("today-label").textContent = `${DAYS[n.getDay()]} ${MONTHS[n.getMonth()].slice(0, 3)} ${n.getDate()}`;
  $("edit-toggle").textContent = editing ? "DONE" : "EDIT";
  $("add-form").hidden = !editing;
}

function renderHabits() {
  const list = $("habit-list");
  list.replaceChildren();

  if (state.habits.length === 0 && !editing) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = "NO HABITS YET — TAP EDIT";
    list.append(p);
    return;
  }

  for (const h of state.habits) {
    const row = document.createElement("button");
    row.className = "habit" + (doneToday(h.id) ? " done" : "");
    row.style.setProperty("--hc", `var(--c-${h.color})`);
    row.setAttribute("aria-pressed", doneToday(h.id));

    const dot = document.createElement("span");
    dot.className = "dot";
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = h.name;
    row.append(dot, name);

    if (editing) {
      const rm = document.createElement("span");
      rm.className = "remove";
      rm.innerHTML = '<svg class="ph" viewBox="0 0 256 256" aria-hidden="true"><path d="M200 56 56 200M56 56l144 144"/></svg>';
      rm.onclick = e => {
        e.stopPropagation();
        if (confirm(`Delete "${h.name}" and its history?`)) {
          removeHabit(h.id);
          render();
        }
      };
      row.append(rm);
      row.onclick = null;
    } else {
      const mark = document.createElement("span");
      mark.className = "mark";
      mark.textContent = "✓";
      row.append(mark);
      row.onclick = () => toggle(h.id);
    }
    list.append(row);
  }
}

function renderSwatches() {
  const box = $("swatches");
  box.replaceChildren();
  for (const c of COLORS) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "swatch";
    b.style.setProperty("--hc", `var(--c-${c})`);
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", c === pickedColor);
    b.setAttribute("aria-label", c);
    b.onclick = () => { pickedColor = c; renderSwatches(); };
    box.append(b);
  }
}

function renderCalendar() {
  const { y, m } = view;
  $("cal-label").textContent = `${MONTHS[m]} ${y}`;

  const grid = $("cal-grid");
  grid.replaceChildren();

  const first = new Date(y, m, 1).getDay();
  const total = new Date(y, m + 1, 0).getDate();
  const tk = todayKey();

  for (let i = 0; i < first; i++) grid.append(document.createElement("span"));

  for (let d = 1; d <= total; d++) {
    const k = dateKey(y, m, d);
    const cell = document.createElement("div");
    cell.className = "day" + (k === tk ? " today" : "");

    const num = document.createElement("span");
    num.className = "num";
    num.textContent = d;
    cell.append(num);

    const ids = state.log[k] || [];
    if (ids.length) {
      const dots = document.createElement("div");
      dots.className = "dots";
      for (const h of state.habits) {
        if (!ids.includes(h.id)) continue;
        const i = document.createElement("i");
        i.style.setProperty("--hc", `var(--c-${h.color})`);
        dots.append(i);
      }
      cell.append(dots);
    }
    grid.append(cell);
  }

  const sum = $("cal-summary");
  sum.replaceChildren();
  for (const h of state.habits) {
    let count = 0;
    for (let d = 1; d <= total; d++) {
      if ((state.log[dateKey(y, m, d)] || []).includes(h.id)) count++;
    }
    const row = document.createElement("div");
    row.className = "row";
    row.style.setProperty("--hc", `var(--c-${h.color})`);
    row.innerHTML = `<span class="dot"></span><span class="name"></span><span class="frac">${count}/${total}</span>`;
    row.querySelector(".name").textContent = h.name;
    sum.append(row);
  }
}

/* ---------- events ---------- */

$("edit-toggle").onclick = () => {
  editing = !editing;
  if (editing) {
    const used = new Set(state.habits.map(h => h.color));
    pickedColor = COLORS.find(c => !used.has(c)) || COLORS[0];
    renderSwatches();
  }
  render();
};

$("add-form").onsubmit = e => {
  e.preventDefault();
  const name = $("add-name").value.trim();
  if (!name) return;
  addHabit(name, pickedColor);
  $("add-name").value = "";
  const used = new Set(state.habits.map(h => h.color));
  pickedColor = COLORS.find(c => !used.has(c)) || COLORS[0];
  renderSwatches();
  render();
};

$("cal-prev").onclick = () => {
  view.m--;
  if (view.m < 0) { view.m = 11; view.y--; }
  renderCalendar();
};

$("cal-next").onclick = () => {
  view.m++;
  if (view.m > 11) { view.m = 0; view.y++; }
  renderCalendar();
};

// day may roll over while the app stays open on the home screen
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    const n = new Date();
    view = { y: n.getFullYear(), m: n.getMonth() };
    render();
  }
});

render();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}
