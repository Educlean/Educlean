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

const formatChartData = (apiData: MonthlyCountAPI[] | unknown): ChartData[] => {
  if (!Array.isArray(apiData)) return [];

  const requestMap = new Map<number, number>();

  apiData.forEach(item => {
    // defensively check structure
    if (!item || typeof item !== 'object' || !('_id' in item)) return;
    const month = (item as MonthlyCountAPI)._id?.month;
    const count = (item as MonthlyCountAPI).count ?? 0;
    if (typeof month === 'number') requestMap.set(month, count);
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
        if (!response.ok) {
          console.error('Fetch /api/requests/byMonth failed', response.status);
          throw new Error('Failed to fetch monthly requests');
        }

        const raw = await response.json();
        // Log the raw response so we can see its shape during development.
        // Remove or reduce logging in production.
        console.debug('byMonth raw response:', raw);

        // Normalize: API may return an array, or { data: [...] }, or { months: [...] }
        let apiResult: MonthlyCountAPI[] = [];
        if (Array.isArray(raw)) {
          apiResult = raw as MonthlyCountAPI[];
        } else if (raw && typeof raw === 'object') {
          const obj = raw as Record<string, unknown>;
          if (Array.isArray(obj.data)) apiResult = obj.data as MonthlyCountAPI[];
          else if (Array.isArray(obj.months)) apiResult = obj.months as MonthlyCountAPI[];
        }

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
