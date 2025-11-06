<template>
  <div class="dashboard">
    <header class="header">
      <h1>Real-Time Cash Flow Dasboard</h1>
      <p class="subtitle">Live stream from ksqlDB — shop {{ shopId }}</p>
    </header>

    <div class="chart-card">
      <Line :data="chartData" :options="chartOptions" />
    </div>

    <div class="data-list">
      <transition-group name="fade" tag="div">
        <div v-for="(row, index) in latestRows" :key="index" class="data-item">
          <div class="data-shop">{{ row.shop }}</div>
          <div class="data-amount">€ {{ row.amount.toFixed(2).toString().split('.').join(',') }}</div>
          <div class="data-time">{{ formatTime(row.start) }} - {{ formatTime(row.end) }}</div>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script>
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
} from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale);

export default {
  components: { Line },
  data() {
    return {
      shopId: 'S0001',
      streamData: {},
      chartData: {
        labels: [],
        datasets: [
          {
            label: 'Cash Amount ($)',
            borderColor: '#00bfa6',
            backgroundColor: 'rgba(0,191,166,0.2)',
            borderWidth: 2,
            pointRadius: 4,
            fill: true,
            data: [],
          },
        ],
      },
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          x: {
            ticks: { color: '#999' },
            grid: { color: '#333' },
          },
          y: {
            ticks: { color: '#999' },
            grid: { color: '#333' },
          },
        },
        plugins: {
          legend: { labels: { color: '#fff' } },
          title: {
            display: true,
            text: 'Hourly Cash Flow',
            color: '#fff',
          },
        },
      },
    };
  },
  computed: {
    latestRows() {
      let rows = []
      for (const key of Object.keys(this.streamData)) {
        rows.push(this.streamData[key])
      }
      return rows
    },
  },
  methods: {
    startStreaming() {
      const eventSource = new EventSource('http://localhost:3000/hourly_cash_per_shop');
      eventSource.onmessage = (event) => {
        try {
          const json = JSON.parse(event.data);
          if (!json.row?.columns) return;
          const [shop, start, end, , , amount] = json.row.columns;
          const row = { shop, start, end, amount };
          let key = start.toString() + '-' + end.toString()
          this.streamData[key] = row

          // Convert the start time to a readable label (e.g., "10:00")
          const timeLabel = new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          // Check if this hour already exists in the chart
          const labelIndex = this.chartData.labels.indexOf(timeLabel);

          let newLabels = [...this.chartData.labels];
          let newData = [...this.chartData.datasets[0].data];

          if (labelIndex !== -1) {
            // Update existing data point
            newData[labelIndex] = amount;
          } else {
            // Add a new hour
            newLabels.push(timeLabel);
            newData.push(amount);
          }

          // Keep only last 24 hours, for example
          if (newLabels.length > 24) {
            newLabels.shift();
            newData.shift();
          }

          // Create new chartData (immutable pattern)
          this.chartData = {
            ...this.chartData,
            labels: newLabels,
            datasets: [
              {
                ...this.chartData.datasets[0],
                data: newData,
              },
            ],
          };
        } catch (err) {
          console.error('Bad SSE data:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE error:', err);
        eventSource.close();
      };
    },
    formatTime(ts) {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
  },
  mounted() {
    this.startStreaming();
  },
};
</script>

<style>
html,
body {
  padding: 0;
  margin: 0;
}

.dashboard {
  background: #0f172a;
  color: #f1f5f9;
  font-family: 'Inter', sans-serif;
  min-height: 100vh;
  padding: 2rem;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2rem;
  margin: 0;
  color: #00bfa6;
}

.subtitle {
  color: #94a3b8;
  font-size: 1rem;
}

.chart-card {
  background: #1e293b;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  height: 400px;
  margin-bottom: 2rem;
}

.data-list {
  display: grid;
  gap: 0.5rem;
}

.data-item {
  display: flex;
  justify-content: space-between;
  background: #1e293b;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease, background 0.3s ease;
  margin: 1rem;
}

.data-item:hover {
  background: #334155;
  transform: translateY(-2px);
}

.data-shop {
  font-weight: 600;
  color: #00bfa6;
}

.data-amount {
  font-weight: bold;
  color: #facc15;
}

.data-time {
  font-size: 0.85rem;
  color: #94a3b8;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
