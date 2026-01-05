const STORAGE_KEY = "yearly-habit-tracker";
const daysInMonth = 31;

const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

let currentMonth = 0;

// ---------- DATA ----------
let data = loadFromStorage() || createDefaultData();

// ---------- DOM ----------
const monthTabs = document.getElementById("monthTabs");
const tableHead = document.getElementById("tableHead");
const tableBody = document.getElementById("habitTable");

// ---------- MONTH TABS ----------
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

// ---------- CHART ----------
const ctx = document.getElementById("habitChart");
const chart = new Chart(ctx, {
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
    responsive: true,
    scales: {
      y: { beginAtZero: true }
    }
  }
});

// ---------- RENDER ----------
function render() {
  const month = data[currentMonth];

  tableHead.innerHTML = `
    <tr>
      <th>Day</th>
      ${month.habits.map((h, i) =>
        `<th contenteditable onblur="renameHabit(${i}, this.innerText)">${h}</th>`
      ).join("")}
      <th>Total</th>
    </tr>`;

  tableBody.innerHTML = "";

  month.checks.forEach((row, d) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td class="muted">Day ${d+1}</td>`;

    month.habits.forEach((_, h) => {
      tr.innerHTML += `
        <td>
          <input type="checkbox"
            class="form-check-input"
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

// ---------- ACTIONS ----------
function toggle(day, habit, val) {
  data[currentMonth].checks[day][habit] = val;
  render();
}

function renameHabit(i, name) {
  data[currentMonth].habits[i] = name || `Habit ${i+1}`;
  saveToStorage();
}

function switchMonth(i) {
  currentMonth = i;
  document.querySelectorAll(".nav-link").forEach((t, idx) =>
    t.classList.toggle("active", idx === i)
  );
  render();
}

// ---------- HABIT CONTROLS ----------
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

// ---------- CHART ----------
function updateChart() {
  const totals = data[currentMonth].checks.map(r => r.filter(Boolean).length);
  chart.data.datasets[0].data = totals;
  chart.options.scales.y.max = data[currentMonth].habits.length;
  chart.update();
}

// ---------- LOCAL STORAGE ----------
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

// ---------- EXPORT JSON ----------
document.getElementById("exportJSON").onclick = () => {
  const payload = {
    app: "Yearly Habit Tracker",
    exportedAt: new Date().toISOString(),
    data
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json"
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "habit-tracker-backup.json";
  a.click();
  URL.revokeObjectURL(a.href);
};

// ---------- IMPORT JSON ----------
document.getElementById("importJSON").addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported.data)) throw "Invalid";

      data = imported.data;
      saveToStorage();
      switchMonth(0);
      alert("Data imported successfully ✔");
    } catch {
      alert("Invalid JSON file");
    }
  };

  reader.readAsText(file);
  this.value = "";
});

// ---------- DEFAULT DATA ----------
function createDefaultData() {
  return months.map(() => ({
    habits: ["Habit 1", "Habit 2", "Habit 3"],
    checks: Array.from({ length: daysInMonth }, () => [false,false,false])
  }));
}

// ---------- INIT ----------
render();
