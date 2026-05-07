import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import api from "../api/client";
import { fmtVND } from "../utils/format";

const NAV = [
  { to: "/dashboard", icon: "/icons/dashboard.png", label: "Dashboard" },
  { to: "/accounts", icon: "/icons/accounts.png", label: "Accounts" },
  { to: "/transactions", icon: "/icons/transactions.png", label: "Transactions"},
  { to: "/budget", icon: "/icons/budget.png", label: "Budget" },
  { to: "/goals", icon: "/icons/goals.png", label: "Goals" },
  { to: "/analytics", icon: "/icons/analytics.png", label: "Analytics" },
  { to: "/settings", icon: "/icons/settings.png", label: "Settings" },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    api
      .get("/accounts/summary")
      .then((r) => setBalance(r.data.netWorth))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-[280px] flex-shrink-0 bg-sidebar flex flex-col">
        {/* Brand */}
        <div className="px-6 pt-8 pb-7">
          <h1 className="text-white text-3xl font-semibold tracking-tight">
            FinTrack
          </h1>
          <p className="text-white text-sm opacity-80 mt-3">Manage your finances</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  isActive
                    ? "bg-sidebar_primary text-white font-medium"
                    : "text-[#B8A8E0] hover:bg-sidebar_accent/60 hover:text-white"
                }`
              }
            >
              <img src={icon} alt="" className="w-5 h-5 opacity-80" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Balance card */}
        <div className="mx-3 mb-4 rounded-xl bg-[#2D2A52] px-4 py-4">
          <p className="text-[#B8A8E0] text-xs mb-1">Current Balance</p>
          <p className="text-white text-xl font-semibold">
            {balance !== null ? fmtVND(balance) : "—"}
          </p>
        </div>

        {/* User + logout */}
        <div className="border-t border-white/10 mx-3 mb-4 pt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-full bg-[#9F86C0] flex items-center justify-center text-white text-xs font-bold">
              {(user?.UserName || "U")
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <p className="text-white text-xs font-medium truncate max-w-[120px]">
                {user?.UserName}
              </p>
              <p className="text-[#B8A8E0] text-[10px] truncate max-w-[120px]">
                {user?.Email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-[#B8A8E0] hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
            title="Logout"
          >
            ⏻
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
