import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

function loadUser() {
  try { return JSON.parse(localStorage.getItem("govinnovate_user")) || null; }
  catch { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser);

  function login(email, password, role) {
    const government = email.trim().toLowerCase() === "government@govinnovate.local" && password === "gov123" && role === "government";
    const startup = email.trim().toLowerCase() === "startup@govinnovate.local" && password === "startup123" && role === "startup";
    if (!government && !startup) return false;
    const old = loadUser();
    const data = government
      ? { name: "Government Officer", role: "government", email: email.trim() }
      : { name: "Startup User", role: "startup", email: email.trim(), startup_id: old?.startup_id || "ST001" };
    localStorage.setItem("govinnovate_user", JSON.stringify(data));
    setUser(data);
    return true;
  }

  function selectStartup(startup) {
    if (!startup) return;
    const next = { ...(user || {}), name: startup.startup_name, startup_id: startup.startup_id, role: "startup" };
    localStorage.setItem("govinnovate_user", JSON.stringify(next));
    setUser(next);
  }

  function logout() {
    localStorage.removeItem("govinnovate_user");
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, logout, selectStartup }}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
