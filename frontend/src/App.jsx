import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Challenges from "./pages/Challenges";
import ChallengeDetails from "./pages/ChallengeDetails";
import MatchingStartups from "./pages/MatchingStartups";
import Startups from "./pages/Startups";
import Applications from "./pages/Applications";
import Evaluations from "./pages/Evaluations";
import Pilots from "./pages/Pilots";
import Validation from "./pages/Validation";
import Procurement from "./pages/Procurement";
import Scaleup from "./pages/Scaleup";
import Analytics from "./pages/Analytics";
import StartupMatching from "./pages/StartupMatching";
import Login from "./pages/Login";
import StartupDashboard from "./pages/StartupDashboard";
import StartupRegister from "./pages/StartupRegister";
import StartupChallenges from "./pages/StartupChallenges";
import StartupApplications from "./pages/StartupApplications";
import StartupPilots from "./pages/StartupPilots";
import { AuthProvider, useAuth } from "./context/AuthContext";

function Protected({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === "startup" ? "/startup-dashboard" : "/dashboard"} replace />;
  return children;
}

function App() {
  return <AuthProvider><BrowserRouter><Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/startup-dashboard" element={<Protected role="startup"><Layout /></Protected>}>
      <Route index element={<StartupDashboard />} />
    </Route>
    <Route path="/startup" element={<Protected role="startup"><Layout /></Protected>}>
      <Route path="register" element={<StartupRegister />} />
      <Route path="challenges" element={<StartupChallenges />} />
      <Route path="applications" element={<StartupApplications />} />
      <Route path="pilots" element={<StartupPilots />} />
    </Route>
    <Route path="/" element={<Protected role="government"><Layout /></Protected>}>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="challenges" element={<Challenges />} />
      <Route path="challenges/:challengeId" element={<ChallengeDetails />} />
      <Route path="challenges/:challengeId/matching" element={<MatchingStartups />} />
      <Route path="startups" element={<Startups />} />
      <Route path="startups/:startupId/matching" element={<StartupMatching />} />
      <Route path="applications" element={<Applications />} />
      <Route path="evaluations" element={<Evaluations />} />
      <Route path="pilots" element={<Pilots />} />
      <Route path="validation" element={<Validation />} />
      <Route path="procurement" element={<Procurement />} />
      <Route path="scale-up" element={<Scaleup />} />
      <Route path="analytics" element={<Analytics />} />
    </Route>
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes></BrowserRouter></AuthProvider>;
}
export default App;
