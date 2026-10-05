import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { getEarlyWarnings } from "../services/api";

export default function EarlyWarningWidget() {
  const [warnings, setWarnings] = useState([]);
  useEffect(() => { getEarlyWarnings().then(setWarnings).catch(console.error); }, []);
  const active = warnings.filter(x => x.level !== "GREEN");
  return <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Early Warning & SLA Monitor</h2><p className="mt-1 text-xs text-slate-500">Pilot execution, milestone and payment-risk signals.</p></div><AlertTriangle className={active.length ? "text-amber-500" : "text-green-600"} size={22}/></div><div className="mt-4 space-y-2">{warnings.slice(0,5).map(x=><div key={x.pilot_id} className="flex items-start justify-between rounded-lg border p-3"><div><p className="text-sm font-semibold">{x.pilot_id}</p><p className="text-xs text-slate-500">{x.reasons.join(" · ")}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${x.level === "RED" ? "bg-red-100 text-red-700" : x.level === "AMBER" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>{x.level}</span></div>)}{!warnings.length && <div className="flex items-center gap-2 text-sm text-slate-500"><CheckCircle2 size={17}/> No warnings.</div>}</div></div>;
}
