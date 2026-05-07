import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
} from "recharts";
import api from "../api/client";
import { fmtVND, fmtVNDShort } from "../utils/format";
import {
  StatCard,
  PageHeader,
  Card,
  Spinner,
  PrimaryBtn,
  SecondaryBtn,
} from "../components/ui";

const PERIOD_TABS = ["Daily", "Monthly", "Yearly"];
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

function ActivePieShape(props) {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
  } = props;
  return (
    <g>
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        fill="#1f2937"
        className="text-sm font-bold"
        style={{ fontSize: 13, fontWeight: 700 }}
      >
        {payload.name}
      </text>
      <text
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        fill="#6b7280"
        style={{ fontSize: 11 }}
      >
        {(percent * 100).toFixed(1)}%
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 9}
        outerRadius={outerRadius + 12}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
}

export default function Overview() {
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [period, setPeriod] = useState("Monthly");
  const [selAcc, setSelAcc] = useState("");
  const [activePie, setActivePie] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);
  useEffect(() => {
    loadChart();
  }, [period, selAcc]);
  useEffect(() => {
    loadPie();
  }, []);

  const loadSummary = async () => {
    try {
      const [s, a] = await Promise.all([
        api.get("/overview/summary"),
        api.get("/accounts"),
      ]);
      setSummary(s.data);
      setAccounts(a.data);
    } catch {}
    setLoading(false);
  };

  const loadChart = async () => {
    const params = selAcc ? { accountID: selAcc } : {};
    try {
      if (period === "Monthly") {
        const r = await api.get("/overview/monthly", { params });
        setChartData(
          r.data.map((d) => ({
            name: d.month,
            income: d.income,
            expense: d.expense,
          })),
        );
      } else if (period === "Yearly") {
        const r = await api.get("/overview/yearly", { params });
        setChartData(
          r.data.map((d) => ({
            name: String(d.year),
            income: d.income,
            expense: d.expense,
          })),
        );
      } else {
        const r = await api.get("/overview/daily", { params });
        setChartData(
          r.data.map((d) => ({
            name: String(d.day),
            income: d.income,
            expense: d.expense,
          })),
        );
      }
    } catch {}
  };

  const loadPie = async () => {
    try {
      const r = await api.get("/overview/expense-breakdown");
      setPieData(
        r.data.categories.map((c) => ({
          name: c.categoryName || c.CategoryName,
          value: c.totalSpent,
        })),
      );
    } catch {}
  };

  const handleExport = async () => {
    try {
      const [txRes, monthlyRes, catRes] = await Promise.all([
        api.get("/overview/export"),
        api.get("/overview/monthly"),
        api.get("/overview/expense-breakdown"),
      ]);

      // Sheet 1: Transactions
      const txHeaders = [
        "Type",
        "Date",
        "Description",
        "Category",
        "Amount (VND)",
      ];
      const txRows = txRes.data.map((r) => [
        r.type,
        r.date,
        r.Description || r.description || "",
        r.category,
        r.amount, // lowercase — đúng với backend trả về
      ]);

      // Sheet 2: Monthly Summary
      const monthHeaders = [
        "Month",
        "Income (VND)",
        "Expense (VND)",
        "Net (VND)",
      ];
      const monthRows = monthlyRes.data.map((r) => [
        r.month,
        r.income,
        r.expense,
        r.income - r.expense,
      ]);

      // Sheet 3: Category Breakdown
      const catHeaders = ["Category", "Total Spent (VND)", "Share (%)"];
      const catRows = catRes.data.categories.map((r) => [
        r.CategoryName || r.categoryName,
        r.totalSpent,
        r.pct ? r.pct.toFixed(1) : "0.0",
      ]);

      // Gộp thành 1 CSV với tiêu đề phân tách từng section
      const buildSection = (title, headers, rows) => {
        const lines = [`=== ${title} ===`, headers.join(",")];
        rows.forEach((row) =>
          lines.push(row.map((v) => JSON.stringify(v ?? "")).join(",")),
        );
        return lines.join("\n");
      };

      const csv = [
        buildSection("Transactions", txHeaders, txRows),
        "",
        buildSection("Monthly Summary", monthHeaders, monthRows),
        "",
        buildSection("Category Breakdown", catHeaders, catRows),
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `fintrack_export_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="p-7 space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your financial health"
        action={
          <SecondaryBtn
            onClick={handleExport}
          >
            Export CSV
          </SecondaryBtn>
        }
      />

      {/* KPI cards */}
      {summary && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Total Balance"
            value={fmtVND(summary.totalBalance)}
            sub="All accounts"
            subColor="text-green-600"
          />
          <StatCard
            label="Total Income"
            value={fmtVND(summary.totalIncome)}
            sub="This year"
            subColor="text-green-600"
          />
          <StatCard
            label="Total Expenses"
            value={fmtVND(summary.totalExpense)}
            sub="This year"
            subColor="text-red-500"
          />
          <StatCard
            label="Net Savings"
            value={fmtVND(summary.netSavings)}
            sub={summary.budgetStatus}
            subColor={
              summary.budgetStatus === "Saving"
                ? "text-green-600"
                : "text-red-500"
            }
          />
        </div>
      )}

      {/* Bar chart */}
      <Card>
        <div className="flex flex-wrap items-center justify-between px-5 pt-5 pb-3 gap-3">
          <h3 className="text-base font-bold text-gray-800">
            Income vs Expenses
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Account filter */}
            <select
              value={selAcc}
              onChange={(e) => setSelAcc(e.target.value)}
              className="h-8 px-3 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-700 focus:outline-none focus:border-[#6B52C8]"
            >
              <option value="">All Accounts</option>
              {accounts.map((a) => (
                <option key={a.AccountID} value={a.AccountID}>
                  {a.AccountName}
                </option>
              ))}
            </select>
            {/* Period toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {PERIOD_TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setPeriod(t)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    period === t
                      ? "bg-[#5E548E] text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-2 pb-4">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis
                tickFormatter={fmtVNDShort}
                tick={{ fontSize: 11 }}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="income"
                name="Income"
                fill="#9F86C0"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expense"
                name="Expenses"
                fill="#E0B1CB"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Pie chart */}
      <Card>
        <h3 className="px-5 pt-5 text-base font-bold text-gray-800">
          Expense Breakdown
        </h3>
        {pieData.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">
            No expense data yet.
          </p>
        ) : (
          <div className="pb-4">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  dataKey="value"
                  activeIndex={activePie}
                  activeShape={ActivePieShape}
                  onMouseEnter={(_, index) => setActivePie(index)}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => fmtVND(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
