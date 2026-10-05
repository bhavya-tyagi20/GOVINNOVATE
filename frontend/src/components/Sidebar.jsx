import {
  LayoutDashboard,
  ClipboardList,
  Building2,
  FileCheck,
  FlaskConical,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  BarChart3,
} from "lucide-react";

import { NavLink } from "react-router-dom";

function Sidebar() {
  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Challenges", path: "/challenges", icon: ClipboardList },
    { name: "Startups", path: "/startups", icon: Building2 },
    { name: "Applications", path: "/applications", icon: FileCheck },
    { name: "Evaluations", path: "/evaluations", icon: ShieldCheck },
    { name: "Pilots", path: "/pilots", icon: FlaskConical },
    { name: "Validation", path: "/validation", icon: ShieldCheck },
    { name: "Procurement", path: "/procurement", icon: ShoppingCart },
    { name: "Scale-up", path: "/scale-up", icon: TrendingUp },
    { name: "Analytics", path: "/analytics", icon: BarChart3 },
  ];

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r bg-white">

      {/* Logo */}

      <div className="border-b px-6 py-6">

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-700 text-white">
            <Building2 size={24} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-purple-800">
              GovInnovate
            </h1>

            <p className="text-xs text-slate-500">
              Public Innovation Platform
            </p>
          </div>

        </div>

      </div>


      {/* Navigation */}

      <nav className="flex-1 overflow-y-auto px-3 py-5">

        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Main Menu
        </p>

        {menuItems.map((item) => {

          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `mb-1 flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-purple-700 text-white shadow-sm"
                    : "text-slate-600 hover:bg-purple-50 hover:text-purple-700"
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


      {/* Government footer */}

      <div className="border-t p-5">

        <div className="rounded-xl bg-purple-50 p-4">

          <p className="text-xs font-semibold text-purple-800">
            Government Innovation
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Turning innovative solutions into measurable public value.
          </p>

        </div>

      </div>

    </aside>
  );
}

export default Sidebar;