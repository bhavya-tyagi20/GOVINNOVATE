import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, LockKeyhole, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState("government");
  const [email, setEmail] = useState("government@govinnovate.local");
  const [password, setPassword] = useState("gov123");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!login(email, password, role)) { setError("Invalid demo credentials."); return; }
    navigate(role === "startup" ? "/startup-dashboard" : "/dashboard");
  }

  return <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
    <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl md:grid-cols-2">
      <div className="hidden bg-purple-700 p-10 text-white md:block">
        <Building2 size={42} />
        <h1 className="mt-8 text-4xl font-bold">GovInnovate</h1>
        <p className="mt-3 text-purple-100">Maharashtra Startup Procurement Platform</p>
        <div className="mt-12 rounded-xl bg-white/10 p-5 text-sm leading-6">From government problem identification to startup discovery, pilot evidence, validation, procurement and scale-up.</div>
      </div>
      <form onSubmit={submit} className="p-8 md:p-10">
        <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
        <p className="mt-2 text-sm text-slate-500">Choose the workspace you want to enter.</p>
        <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
          <button type="button" onClick={() => {setRole("government");setEmail("government@govinnovate.local");setPassword("gov123")}} className={`rounded-md px-3 py-2 text-sm font-medium ${role === "government" ? "bg-white shadow text-purple-700" : "text-slate-500"}`}>Government</button>
          <button type="button" onClick={() => {setRole("startup");setEmail("startup@govinnovate.local");setPassword("startup123")}} className={`rounded-md px-3 py-2 text-sm font-medium ${role === "startup" ? "bg-white shadow text-purple-700" : "text-slate-500"}`}>Startup</button>
        </div>
        <label className="mt-6 block text-sm font-medium text-slate-700">Email</label>
        <div className="mt-2 flex items-center gap-2 rounded-lg border px-3 py-2"><Mail size={17} className="text-slate-400"/><input className="w-full outline-none" value={email} onChange={e=>setEmail(e.target.value)} /></div>
        <label className="mt-4 block text-sm font-medium text-slate-700">Password</label>
        <div className="mt-2 flex items-center gap-2 rounded-lg border px-3 py-2"><LockKeyhole size={17} className="text-slate-400"/><input type="password" className="w-full outline-none" value={password} onChange={e=>setPassword(e.target.value)} /></div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button className="mt-6 w-full rounded-lg bg-purple-700 py-3 font-semibold text-white hover:bg-purple-800">Enter {role === "government" ? "Government" : "Startup"} Workspace</button>
        <p className="mt-4 text-xs text-slate-400">Demo: Government / government@govinnovate.local / gov123 · Startup / startup@govinnovate.local / startup123</p>
      </form>
    </div>
  </div>;
}
