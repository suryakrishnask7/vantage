const STORAGE_KEY = "yearly-habit-tracker-v3";
const daysInMonth = 31;

const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

let currentMonth = 0;
let data = loadFromStorage() || createDefaultData();

// DOM
const monthTabs = document.getElementById("monthTabs");
const tableHead = document.getElementById("tableHead");
const tableBody = document.getElementById("habitTable");
const goalText = document.getElementById("goalText");
const goalCheck = document.getElementById("goalCheck");
const weeklyTracker = document.getElementById("weeklyTracker");

// Month tabs
months.forEach((m, i) => {
  const li = document.createElement("li");
  li.className = "nav-item";
  li.innerHTML = `<button class="nav-link ${i === 0 ? "active" : ""}">${m.slice(0,3)}</button>`;
  li.onclick = () => switchMonth(i);
  monthTabs.appendChild(li);
});

// Chart
const chart = new Chart(document.getElementById("habitChart"), {
  type: "line",
  data: {
    labels: Array.from({ length: daysInMonth }, (_, i) => `Day ${i+1}`),
    datasets: [{
      data: [],
      borderColor: "#22c55e",
      pointRadius: 5,
      tension: 0.3
    }]
  },
  options: {
    scales: { y: { beginAtZero: true } }
  }
});

// Render
function render() {
  const m = data[currentMonth];

  // Goal
  goalText.value = m.goal.text;
  goalCheck.checked = m.goal.done;

  // Weekly
  weeklyTracker.innerHTML = "";
  m.weeks.forEach((w, i) => {
    const div = document.createElement("div");
    div.className = "week-box";
    div.innerHTML = `
      <input type="checkbox" class="form-check-input"
        ${w.done ? "checked" : ""}
        onchange="toggleWeek(${i}, this.checked)">
      <span class="week-label" contenteditable
        onblur="renameWeek(${i}, this.innerText)">
        ${w.label}
      </span>
    `;
    weeklyTracker.appendChild(div);
  });

  // Table header
  tableHead.innerHTML = `
    <tr>
      <th>Day</th>
      ${m.habits.map((h, i) =>
        `<th contenteditable onblur="renameHabit(${i}, this.innerText)">${h}</th>`
      ).join("")}
      <th>Total</th>
    </tr>`;

  // Table body
  tableBody.innerHTML = "";
  m.checks.forEach((row, d) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td class="muted">Day ${d+1}</td>`;
    m.habits.forEach((_, h) => {
      tr.innerHTML += `
        <td>
          <input type="checkbox" class="form-check-input"
            ${row[h] ? "checked" : ""}
            onchange="toggle(${d},${h},this.checked)">
        </td>`;
    });
    tr.innerHTML += `<td class="total">${row.filter(Boolean).length}</td>`;
    tableBody.appendChild(tr);
  });

  updateChart();
  saveToStorage();
}

// Actions
function toggle(day, habit, val) {
  data[currentMonth].checks[day][habit] = val;
  render();
}

function renameHabit(i, name) {
  data[currentMonth].habits[i] = name || `Habit ${i+1}`;
  saveToStorage();
}

function toggleWeek(i, val) {
  data[currentMonth].weeks[i].done = val;
  saveToStorage();
}

function renameWeek(i, name) {
  data[currentMonth].weeks[i].label = name || `Week ${i+1}`;
  saveToStorage();
}

goalText.oninput = () => {
  data[currentMonth].goal.text = goalText.value;
  saveToStorage();
};

goalCheck.onchange = () => {
  data[currentMonth].goal.done = goalCheck.checked;
  saveToStorage();
};

// Habit controls
document.getElementById("addHabit").onclick = () => {
  const m = data[currentMonth];
  m.habits.push(`Habit ${m.habits.length + 1}`);
  m.checks.forEach(r => r.push(false));
  render();
};

document.getElementById("removeHabit").onclick = () => {
  const m = data[currentMonth];
  if (m.habits.length === 1) return;
  m.habits.pop();
  m.checks.forEach(r => r.pop());
  render();
};

// Chart
function updateChart() {
  const totals = data[currentMonth].checks.map(r => r.filter(Boolean).length);
  chart.data.datasets[0].data = totals;
  chart.options.scales.y.max = data[currentMonth].habits.length;
  chart.update();
}

// Storage
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

// Export
document.getElementById("exportJSON").onclick = () => {
  const blob = new Blob(
    [JSON.stringify({ exportedAt: new Date(), data }, null, 2)],
    { type: "application/json" }
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "habit-tracker-backup.json";
  a.click();
};

// Import
document.getElementById("importJSON").onchange = function () {
  const reader = new FileReader();
  reader.onload = e => {
    const parsed = JSON.parse(e.target.result);
    if (parsed.data) {
      data = parsed.data;
      saveToStorage();
      switchMonth(0);
    }
  };
  reader.readAsText(this.files[0]);
};

// Default data
function createDefaultData() {
  return months.map(() => ({
    habits: ["Habit 1", "Habit 2", "Habit 3"],
    checks: Array.from({ length: daysInMonth }, () => [false,false,false]),
    goal: { text: "", done: false },
    weeks: Array.from({ length: 5 }, (_, i) => ({
      label: `Week ${i + 1}`,
      done: false
    }))
  }));
}

function switchMonth(i) {
  currentMonth = i;
  document.querySelectorAll(".nav-link").forEach((t, idx) =>
    t.classList.toggle("active", idx === i)
  );
  render();
}

// Init
render();
