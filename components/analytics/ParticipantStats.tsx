'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ParticipantStat {
  name: string;
  speakingTime: number;
  messageCount: number;
  actionItems: number;
  sentimentScore: number;
}

interface ParticipantStatsProps {
  data: ParticipantStat[];
}

export function ParticipantStats({ data }: ParticipantStatsProps) {
  const chartData = {
    labels: data.map(participant => participant.name),
    datasets: [
      {
        label: 'Speaking Time (minutes)',
        data: data.map(participant => Math.round(participant.speakingTime / 60)),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Minutes',
        },
      },
    },
  };

  return (
    <div className="h-[300px]">
      <Bar data={chartData} options={options} />
    </div>
  );
}
