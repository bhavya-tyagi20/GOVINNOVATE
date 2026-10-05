import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Chatbot from "./Chatbot";

import {
  LayoutDashboard,
  FileText,
  Building2,
  ClipboardList,
  CheckSquare,
  FlaskConical,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  Bell,
  Search,
  LogOut,
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Challenges",
    path: "/challenges",
    icon: FileText,
  },
  {
    name: "Startups",
    path: "/startups",
    icon: Building2,
  },
  {
    name: "Applications",
    path: "/applications",
    icon: ClipboardList,
  },
  {
    name: "Evaluations",
    path: "/evaluations",
    icon: CheckSquare,
  },
  {
    name: "Pilots",
    path: "/pilots",
    icon: FlaskConical,
  },
  {
    name: "Validation",
    path: "/validation",
    icon: ShieldCheck,
  },
  {
    name: "Procurement",
    path: "/procurement",
    icon: ShoppingCart,
  },
  {
    name: "Scale-up",
    path: "/scale-up",
    icon: TrendingUp,
  },
  {
    name: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
];

export default function Layout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isStartup = user?.role === "startup";
  const items = isStartup ? [
    { name: "Startup Dashboard", path: "/startup-dashboard", icon: LayoutDashboard },
    { name: "Challenges", path: "/startup/challenges", icon: FileText },
    { name: "Applications", path: "/startup/applications", icon: ClipboardList },
    { name: "Pilots", path: "/startup/pilots", icon: FlaskConical },
  ] : menuItems;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* SIDEBAR */}
      <aside className="flex w-[268px] shrink-0 flex-col border-r border-slate-200 bg-white">

        {/* LOGO */}
        <div className="flex h-[104px] items-center border-b border-slate-200 px-5">

          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-600">
            <Building2
              size={30}
              className="text-white"
            />
          </div>

          <div className="ml-4">
            <h1 className="text-2xl font-bold text-purple-700">
              GovInnovate
            </h1>

            <p className="text-sm text-slate-500">
              Public Innovation Platform
            </p>
          </div>

        </div>


        {/* NAVIGATION */}
        <div className="flex-1 overflow-y-auto px-3 py-6">

          <p className="mb-4 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Main Menu
          </p>

          <nav className="space-y-1">

            {items.map((item) => {

              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-purple-600 text-white"
                        : "text-slate-700 hover:bg-purple-50 hover:text-purple-700"
                    }`
                  }
                >

                  <Icon size={19} />

                  <span>
                    {item.name}
                  </span>

                </NavLink>
              );

            })}

          </nav>

        </div>


        {/* SIDEBAR FOOTER */}
        <div className="border-t border-slate-200 p-4">

          <div className="rounded-xl bg-purple-50 p-4">

            <p className="text-sm font-semibold text-purple-700">
              {isStartup ? "Startup Workspace" : "Government Innovation"}
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Turning innovative solutions into
              measurable public value.
            </p>

          </div>

        </div>

      </aside>


      {/* RIGHT SIDE */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* TOP HEADER */}
        <header className="flex h-[88px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-10">

          <div>

            <p className="text-lg text-slate-500">
              Government of Maharashtra
            </p>

            <h2 className="text-2xl font-bold text-slate-900">
              Innovation & Public Procurement
            </h2>

          </div>


          <div className="flex items-center gap-6">

            {/* SEARCH */}
            <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 md:flex">

              <Search
                size={17}
                className="text-slate-400"
              />

              <input
                type="text"
                placeholder="Search..."
                className="w-40 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />

            </div>


            {/* NOTIFICATION */}
            <button
              type="button"
              className="relative text-slate-500 hover:text-purple-600"
            >

              <Bell size={23} />

              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-purple-600 px-1 text-[10px] font-bold text-white">
                3
              </span>

            </button>


            <div className="hidden text-right md:block">
              <p className="text-sm font-semibold text-slate-700">{user?.name || "Government User"}</p>
              <p className="text-xs text-slate-400">{isStartup ? "Startup" : "Government"}</p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 font-semibold text-purple-700">
              {(user?.name || "G").charAt(0).toUpperCase()}
            </div>

            <button onClick={() => { logout(); navigate("/login"); }} className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
              <LogOut size={17} /> Logout
            </button>

          </div>

        </header>


        {/* PAGE CONTENT */}
        <main className="min-w-0 flex-1 overflow-y-auto">

          <Outlet />

        </main>

      </div>
      <Chatbot />
    </div>
  );
}