/***********************
 * CONFIG & CONSTANTS
 ***********************/
const STORAGE_KEY = "yearly-habit-tracker-v4";
const daysInMonth = 31;

const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

/***********************
 * STATE
 ***********************/
let currentMonth = 0;
let data = loadFromStorage() || createDefaultData();

/***********************
 * DOM REFERENCES
 ***********************/
const monthTabs = document.getElementById("monthTabs");
const tableHead = document.getElementById("tableHead");
const tableBody = document.getElementById("habitTable");

const goalText = document.getElementById("goalText");
const goalCheck = document.getElementById("goalCheck");

const weeklyTracker = document.getElementById("weeklyTracker");

const copyFromSelect = document.getElementById("copyFromMonth");

/***********************
 * MONTH TABS
 ***********************/
months.forEach((m, i) => {
  const li = document.createElement("li");
  li.className = "nav-item";
  li.innerHTML = `
    <button class="nav-link ${i === 0 ? "active" : ""}">
      ${m.slice(0,3)}
    </button>`;
  li.onclick = () => switchMonth(i);
  monthTabs.appendChild(li);
});

/***********************
 * CHART
 ***********************/
const chart = new Chart(document.getElementById("habitChart"), {
  type: "line",
  data: {
    labels: Array.from({ length: daysInMonth }, (_, i) => `Day ${i + 1}`),
    datasets: [{
      data: [],
      borderColor: "#22c55e",
      pointRadius: 5,
      tension: 0.3
    }]
  },
  options: {
    responsive: true,
    scales: {
      y: { beginAtZero: true }
    }
  }
});

/***********************
 * RENDER
 ***********************/
function render() {
  const m = data[currentMonth];

  /* Monthly goal */
  goalText.value = m.goal.text;
  goalCheck.checked = m.goal.done;

  /* Weekly tracker */
  weeklyTracker.innerHTML = "";
  m.weeks.forEach((w, i) => {
    const div = document.createElement("div");
    div.className = "week-box";
    div.innerHTML = `
      <input type="checkbox"
        class="form-check-input"
        ${w.done ? "checked" : ""}
        onchange="toggleWeek(${i}, this.checked)">
      <span class="week-label"
        contenteditable
        onblur="renameWeek(${i}, this.innerText)">
        ${w.label}
      </span>
    `;
    weeklyTracker.appendChild(div);
  });

  /* Table header */
  tableHead.innerHTML = `
    <tr>
      <th>Day</th>
      ${m.habits.map((h, i) =>
        `<th contenteditable onblur="renameHabit(${i}, this.innerText)">${h}</th>`
      ).join("")}
      <th>Total</th>
    </tr>`;

  /* Table body */
  tableBody.innerHTML = "";
  m.checks.forEach((row, d) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td class="muted">Day ${d + 1}</td>`;

    m.habits.forEach((_, h) => {
      tr.innerHTML += `
        <td>
          <input type="checkbox"
            class="form-check-input"
            ${row[h] ? "checked" : ""}
            onchange="toggle(${d}, ${h}, this.checked)">
        </td>`;
    });

    tr.innerHTML += `<td class="total">${row.filter(Boolean).length}</td>`;
    tableBody.appendChild(tr);
  });

  updateChart();
  populateCopyDropdown();
  saveToStorage();
}

/***********************
 * DAILY HABITS
 ***********************/
function toggle(day, habit, val) {
  data[currentMonth].checks[day][habit] = val;
  render();
}

function renameHabit(i, name) {
  data[currentMonth].habits[i] = name || `Habit ${i + 1}`;
  saveToStorage();
}

/***********************
 * WEEKLY
 ***********************/
function toggleWeek(i, val) {
  data[currentMonth].weeks[i].done = val;
  saveToStorage();
}

function renameWeek(i, name) {
  data[currentMonth].weeks[i].label = name || `Week ${i + 1}`;
  saveToStorage();
}

/***********************
 * MONTHLY GOAL
 ***********************/
goalText.oninput = () => {
  data[currentMonth].goal.text = goalText.value;
  saveToStorage();
};

goalCheck.onchange = () => {
  data[currentMonth].goal.done = goalCheck.checked;
  saveToStorage();
};

/***********************
 * HABIT CONTROLS
 ***********************/
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

/***********************
 * COPY HABITS BETWEEN MONTHS
 ***********************/
function populateCopyDropdown() {
  copyFromSelect.innerHTML = "";
  months.forEach((m, i) => {
    if (i !== currentMonth) {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = m;
      copyFromSelect.appendChild(opt);
    }
  });
}

document.getElementById("copyHabits").onclick = () => {
  const fromIndex = parseInt(copyFromSelect.value);
  if (isNaN(fromIndex)) return;

  if (!confirm(
    `Copy habits from ${months[fromIndex]} to ${months[currentMonth]}?\n` +
    `Daily progress will be reset.`
  )) return;

  const source = data[fromIndex];
  const target = data[currentMonth];

  target.habits = [...source.habits];
  target.checks = Array.from({ length: daysInMonth }, () =>
    Array(target.habits.length).fill(false)
  );

  saveToStorage();
  render();
};

/***********************
 * CHART
 ***********************/
function updateChart() {
  const totals = data[currentMonth].checks.map(r => r.filter(Boolean).length);
  chart.data.datasets[0].data = totals;
  chart.options.scales.y.max = data[currentMonth].habits.length;
  chart.update();
}

/***********************
 * STORAGE
 ***********************/
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

/***********************
 * EXPORT JSON
 ***********************/
document.getElementById("exportJSON").onclick = () => {
  const blob = new Blob(
    [JSON.stringify({ exportedAt: new Date().toISOString(), data }, null, 2)],
    { type: "application/json" }
  );

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "habit-tracker-backup.json";
  a.click();
  URL.revokeObjectURL(a.href);
};

/***********************
 * IMPORT JSON
 ***********************/
document.getElementById("importJSON").onchange = function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!parsed.data) throw "Invalid";

      data = parsed.data;
      saveToStorage();
      switchMonth(0);
    } catch {
      alert("Invalid JSON file");
    }
  };
  reader.readAsText(file);
  this.value = "";
};

/***********************
 * DEFAULT DATA
 ***********************/
function createDefaultData() {
  return months.map(() => ({
    habits: ["Habit 1", "Habit 2", "Habit 3"],
    checks: Array.from({ length: daysInMonth }, () => [false, false, false]),
    goal: { text: "", done: false },
    weeks: Array.from({ length: 5 }, (_, i) => ({
      label: `Week ${i + 1}`,
      done: false
    }))
  }));
}

/***********************
 * MONTH SWITCH
 ***********************/
function switchMonth(i) {
  currentMonth = i;
  document.querySelectorAll(".nav-link").forEach((t, idx) =>
    t.classList.toggle("active", idx === i)
  );
  render();
}

/***********************
 * INIT
 ***********************/
populateCopyDropdown();
render();
