import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- 1. Type Definitions ---

interface MonthlyCountAPI {
  _id: {
    year: number;
    month: number;
  };
  count: number;
}

interface ChartData {
  name: string;     // Month short name
  Requests: number; // Request count
}

const monthNames: { [key: number]: string } = {
  1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun',
  7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec',
};

// --- Data formatting ---

const formatChartData = (apiData: MonthlyCountAPI[]): ChartData[] => {
  const requestMap = new Map<number, number>();

  apiData.forEach(item => {
    requestMap.set(item._id.month, item.count);
  });

  const formattedData: ChartData[] = [];

  for (let i = 1; i <= 12; i++) {
    formattedData.push({
      name: monthNames[i],
      Requests: requestMap.get(i) ?? 0,
    });
  }

  return formattedData;
};

// --- Component ---

export default function RequestChart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/requests/byMonth');
        if (!response.ok) throw new Error('Failed to fetch');

        const apiResult: MonthlyCountAPI[] = await response.json();
        setChartData(formatChartData(apiResult));
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div style={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        Loading monthly data...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <XAxis dataKey="name" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Bar dataKey="Requests" fill="#14532d" name="Requests" />
      </BarChart>
    </ResponsiveContainer>
  );
}
