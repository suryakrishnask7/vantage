const days = 31;
const habits = 10;
const tableBody = document.getElementById("habitTable");

// Generate table
for (let d = 1; d <= days; d++) {
  const row = document.createElement("tr");
  row.innerHTML = `<td class="text-muted">Day ${d}</td>`;

  for (let h = 1; h <= habits; h++) {
    row.innerHTML += `
      <td>
        <input type="checkbox" class="form-check-input habit" data-day="${d}">
      </td>`;
  }

  row.innerHTML += `<td class="total" id="total-${d}">0</td>`;
  tableBody.appendChild(row);
}

// Line chart with dots
const ctx = document.getElementById("habitChart").getContext("2d");
const habitChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: Array.from({ length: days }, (_, i) => `Day ${i + 1}`),
    datasets: [{
      label: "Habits Completed",
      data: Array(days).fill(0),
      borderColor: "#22c55e",
      backgroundColor: "#22c55e",
      tension: 0.3,          // smooth curve
      fill: false,
      pointRadius: 5,        // visible dots
      pointHoverRadius: 7,
      pointBackgroundColor: "#22c55e",
      pointBorderColor: "#0f1115",
      pointBorderWidth: 2
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: "#9ca3af" }
      }
    },
    scales: {
      x: {
        ticks: { color: "#9ca3af" },
        grid: { color: "#1f2937" }
      },
      y: {
        beginAtZero: true,
        max: habits,
        ticks: {
          stepSize: 1,
          color: "#9ca3af"
        },
        grid: { color: "#1f2937" }
      }
    }
  }
});

// Update totals and chart
document.addEventListener("change", () => {
  const totals = Array(days).fill(0);

  document.querySelectorAll(".habit").forEach(cb => {
    if (cb.checked) totals[cb.dataset.day - 1]++;
  });

  totals.forEach((val, i) => {
    document.getElementById(`total-${i + 1}`).innerText = val;
  });

  habitChart.data.datasets[0].data = totals;
  habitChart.update();
});
