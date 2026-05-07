import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import api from "../api/client";
import { fmtVND, fmtVNDShort } from "../utils/format";
import { PageHeader, Card, Spinner, StatCard } from "../components/ui";

const PIE_COLORS = [
  "#231942",
  "#5E548E",
  "#9F86C0",
  "#BE95C4",
  "#E0B1CB",
  "#818CF8",
  "#DDD6FE",
  "#7C3AED",
];
const MONTH_OPTS = [3, 6, 12, 24];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {fmtVND(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function Analytics() {
  const [trendData, setTrendData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [months, setMonths] = useState(12);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, [months]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [trendRes, catRes] = await Promise.all([
        api.get("/analytics/trend", { params: { months } }),
        api.get("/analytics/categories"),
      ]);
      setTrendData(trendRes.data.data);
      setSummary(trendRes.data.summary);
      setCategories(catRes.data.categories);
    } catch {}
    setLoading(false);
  };

  if (loading) return <Spinner />;

  const totalCatSpent = categories.reduce((s, c) => s + c.totalSpent, 0);

  return (
    <div className="p-7 space-y-5">
      <PageHeader
        title="Analytics"
        subtitle="Deep dive into your financial patterns"
        action={
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {MONTH_OPTS.map((m) => (
              <button
                key={m}
                onClick={() => setMonths(m)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  months === m
                    ? "bg-[#5E548E] text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {m}M
              </button>
            ))}
          </div>
        }
      />

      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Avg Monthly Income"
            value={fmtVND(summary.avgIncome)}
            sub={`Over ${summary.months} months`}
            subColor="text-green-600"
          />
          <StatCard
            label="Avg Monthly Expense"
            value={fmtVND(summary.avgExpense)}
            sub={`Over ${summary.months} months`}
            subColor="text-red-500"
          />
          <StatCard
            label="Avg Monthly Savings"
            value={fmtVND(summary.avgSavings)}
            sub={`Over ${summary.months} months`}
            subColor="text-[#6B52C8]"
          />
        </div>
      )}

      {/* Trend line chart */}
      <Card>
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-base font-semibold text-gray-800">
            Income vs Expense Trend
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Monthly comparison over the last {months} months
          </p>
        </div>
        <div className="px-2 pb-5">
          {trendData.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">
              No data available.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={trendData}
                margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis
                  tickFormatter={fmtVNDShort}
                  tick={{ fontSize: 11 }}
                  width={62}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="#9F86C0"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  name="Expense"
                  stroke="#E0B1CB"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="savings"
                  name="Savings"
                  stroke="#04b775"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  strokeDasharray="5 3"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Category breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Bar chart */}
        <Card>
          <div className="px-5 pt-5 pb-3">
            <h3 className="text-base font-semibold text-gray-800">
              Spending by Category
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              All-time total per category
            </p>
          </div>
          <div className="px-2 pb-4">
            {categories.length === 0 ? (
              <p className="text-center text-gray-400 py-12 text-sm">
                No data available.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={categories}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tickFormatter={fmtVNDShort}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="CategoryName"
                    tick={{ fontSize: 11 }}
                    width={90}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="totalSpent" name="Spent" radius={[0, 4, 4, 0]}>
                    {categories.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Category rank list */}
        <Card>
          <div className="px-5 pt-5 pb-3">
            <h3 className="text-base font-semibold text-gray-800">
              Category Rankings
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Sorted by total spending
            </p>
          </div>
          <div className="divide-y divide-gray-50 pb-3">
            {categories.length === 0 ? (
              <p className="text-center text-gray-400 py-12 text-sm">
                No data available.
              </p>
            ) : (
              categories.map((c, i) => {
                const pct =
                  totalCatSpent > 0 ? (c.totalSpent / totalCatSpent) * 100 : 0;
                return (
                  <div key={c.CategoryName} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                          style={{
                            backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                          }}
                        >
                          {i + 1}
                        </span>
                        <span className="text-sm font-semibold text-gray-700">
                          {c.CategoryName}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-800">
                          {fmtVND(c.totalSpent)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {pct.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
