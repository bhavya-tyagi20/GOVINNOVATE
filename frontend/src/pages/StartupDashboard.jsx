import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Building2, CheckCircle2, ClipboardList, FlaskConical, Plus, Rocket, Search, WalletCards } from "lucide-react";
import { getMatchingChallenges, getApplications, getPilots, getEarlyWarnings, getStartups } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function StartupDashboard() {
  const { user, selectStartup } = useAuth();
  const [startups, setStartups] = useState([]);
  const [startup, setStartup] = useState(null);
  const [data, setData] = useState({ matches: [], applications: [], pilots: [], warnings: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => { getStartups().then(setStartups).catch(console.error); }, []);

  useEffect(() => {
    if (!user?.startup_id) return;
    const found = startups.find(s => String(s.startup_id) === String(user.startup_id));
    if (found) setStartup(found);
    setLoading(true);
    Promise.all([getMatchingChallenges(user.startup_id), getApplications(), getPilots(), getEarlyWarnings()])
      .then(([m,a,p,w]) => setData({
        matches: m.matches || [],
        applications: a.filter(x => String(x.startup_id) === String(user.startup_id)),
        pilots: p.filter(x => String(x.startup_id) === String(user.startup_id)),
        warnings: w.filter(x => String(x.startup_id) === String(user.startup_id)),
      })).catch(console.error).finally(() => setLoading(false));
  }, [user?.startup_id, startups]);

  const riskCount = useMemo(() => data.warnings.filter(x => x.level !== "GREEN").length, [data.warnings]);

  return <div className="p-8">
    <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-purple-700">Startup Workspace</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Startup Innovation Dashboard</h1><p className="mt-2 text-slate-500">Discover government demand, submit applications and monitor pilot/payment health.</p></div>
      <div className="flex flex-wrap gap-2"><Link to="/startup/register" className="inline-flex items-center gap-2 rounded-lg bg-purple-700 px-4 py-2.5 text-sm font-semibold text-white"><Plus size={17}/> Add / Register Startup</Link><Link to="/startup/challenges" className="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-white px-4 py-2.5 text-sm font-semibold text-purple-700"><Search size={17}/> Browse Challenges</Link></div>
    </div>

    <div className="rounded-xl border border-purple-200 bg-purple-50 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-wide text-purple-600">Active startup profile</p><p className="mt-1 text-xl font-bold text-purple-900">{startup?.startup_name || user?.startup_id || "Select a startup"}</p><p className="text-sm text-purple-700">{startup?.startup_id || user?.startup_id} · {startup?.sector || ""}</p></div>
        <select value={user?.startup_id || ""} onChange={e => { const s=startups.find(x=>String(x.startup_id)===e.target.value); selectStartup(s); }} className="rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm outline-none">
          {startups.map(s => <option key={s.startup_id} value={s.startup_id}>{s.startup_id} — {s.startup_name}</option>)}
        </select>
      </div>
    </div>

    <div className="mt-6 grid gap-5 md:grid-cols-5">
      {[["Recommended Challenges",data.matches.length,Rocket], ["My Applications",data.applications.length,ClipboardList], ["My Pilots",data.pilots.length,FlaskConical], ["Payment / SLA Alerts",riskCount,WalletCards], ["Profile Status",startup ? "Active" : "Add",Building2]].map(([t,v,I]) => <div key={t} className="rounded-xl border bg-white p-5 shadow-sm"><I className="text-purple-700" size={22}/><p className="mt-4 text-sm text-slate-500">{t}</p><p className="text-2xl font-bold text-slate-900">{v}</p></div>)}
    </div>

    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Best government opportunities</h2><Link to="/startup/challenges" className="text-sm font-semibold text-purple-700">View all</Link></div><div className="mt-4 space-y-3">{data.matches.slice(0,5).map(x=><div key={x.challenge_id} className="rounded-lg border bg-slate-50 p-4"><div className="flex justify-between gap-3"><div><p className="font-semibold">{x.title}</p><p className="text-xs text-slate-500">{x.sector} · {x.challenge_id}</p></div><span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">{x.match_score ?? x.score}%</span></div><Link to={`/startup/challenges`} className="mt-3 inline-block text-xs font-semibold text-indigo-700">Review opportunity →</Link></div>)}{!data.matches.length && <p className="text-sm text-slate-500">No matches found yet.</p>}</div></div>
      <div className="rounded-xl border bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold">Early Warning & SLA Monitor</h2><p className="mt-1 text-sm text-slate-500">Issues are filtered to your selected startup.</p><div className="mt-4 space-y-3">{data.warnings.map(w=><div key={w.pilot_id} className="rounded-lg border p-4"><div className="flex justify-between"><div><p className="font-semibold">{w.pilot_id}</p><p className="text-xs text-slate-500">{w.status}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${w.level === "RED" ? "bg-red-100 text-red-700" : w.level === "AMBER" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{w.level}</span></div><ul className="mt-2 list-disc pl-5 text-sm text-slate-600">{w.reasons.map(r=><li key={r}>{r}</li>)}</ul></div>)}{!data.warnings.length && <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700"><CheckCircle2 className="mr-2 inline" size={17}/>No warning records for this startup.</div>}</div></div>
    </div>
    {loading && <p className="mt-4 text-xs text-slate-400">Refreshing startup data...</p>}
  </div>;
}
