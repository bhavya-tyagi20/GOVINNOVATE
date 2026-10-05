const API = "/api";

async function request(path, options = {}) {
  const token = sessionStorage.getItem("govinnovate_access_token");
  const response = await fetch(API + path, {
    ...options,
    headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
  });
  let data = null;
  try { data = await response.json(); } catch { data = null; }
  if (!response.ok) throw new Error(data?.detail || data?.message || `API error ${response.status}`);
  return data;
}

const get = path => request(path);
const post = (path, body) => request(path, { method: "POST", body: JSON.stringify(body) });

export const getStatistics = () => get("/statistics");
export const getStates = () => get("/states");
export const getDepartments = () => get("/departments");
export const getChallenges = () => get("/challenges");
export const getStartups = () => get("/startups");
export const getApplications = () => get("/applications");
export const getEvaluations = () => get("/evaluations");
export const getPilots = () => get("/pilots");
export const getPilotKpis = () => get("/pilot-kpis");
export const getValidations = () => get("/validations");
export const getProcurement = () => get("/procurement");
export const getScaleups = () => get("/scaleups");
export const getExperts = () => get("/experts");
export const getGrievances = () => get("/grievances");
export const getAuditLogs = () => get("/audit-logs");
export const getAuditIntegrity = () => get("/audit-logs/integrity");
export const getCurrentUser = () => get("/auth/me");
export const getDemandRadar = () => get("/demand-radar");
export const getProvenSolutions = () => get("/proven-solutions");
export const getFederatedPilots = () => get("/federated-pilots");
export const getPolicyWhatIf = () => get("/policy-what-if");
export const getSecurityChecks = () => get("/security-checks");
export const getTrustScores = () => get("/trust-scores");
export const getMilestones = () => get("/milestones");
export const login = data => post("/auth/login", data);
export const getNotifications = (role, startupId="") => get(`/notifications?role=${encodeURIComponent(role)}&startup_id=${encodeURIComponent(startupId)}`);
export const getPilotRisk = id => get(`/pilots/${id}/risk`);

export const getChallenge = id => get(`/challenges/${id}`);
export const getStartup = id => get(`/startups/${id}`);
export const getPilot = id => get(`/pilots/${id}`);
export const getApplication = id => get(`/applications/${id}`);
export const getStartupTrust = id => get(`/startups/${id}/trust-score`);
export const getStartupRecommendations = id => get(`/startups/${id}/recommendations`);

export async function getMatchingStartups(id) {
  const data = await get(`/challenges/${id}/matches`);
  return data.matches || data;
}

export async function getMatchingChallenges(id) {
  const data = await get(`/startups/${id}/matches`);
  return Array.isArray(data) ? data : (Array.isArray(data?.matches) ? data.matches : []);
}

export const addStartup = data => post("/startups", data);
export const registerStartup = data => post("/startups/register", data);
export const addChallenge = data => post("/challenges", data);
export const updateChallenge = (id, data) => request(`/challenges/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const addApplication = data => post("/applications", data);
export const addEvaluation = data => post("/evaluations", data);
export const verifyIdentity = (id, data = { mode: "prototype", liveness: true }) => post(`/startups/${id}/verify-identity`, data);
export const runSecurityCheck = (id, data = {}) => post(`/pilots/${id}/security-check`, data);
export const approveMilestone = (id, data) => post(`/milestones/${id}/approve`, data);
export const addValidation = data => post("/validations", data);
export const addPilotKpi = (pilotId, data) => post(`/pilots/${pilotId}/kpis`, data);
export const addGrievance = data => post("/grievances", data);
export const runPolicyScenario = data => post("/lab/scenario", data);

export const generateProcurementDossier = pilotId => post(`/procurement/generate-dossier/${pilotId}`, {});
export const getSimilarSolutions = challengeId => get(`/challenges/${challengeId}/similar-solutions`);
export const getEarlyWarnings = () => get("/pilots/early-warnings");
export const reusePilotFramework = pilotId => post(`/pilots/${pilotId}/reuse-framework`, {});
export const getPassport = pilotId => get(`/pilots/${pilotId}/passport`);
export const passportPublicUrl = passportId => `${window.location.origin}/passport/${passportId}`;
export const passportQrUrl = passportId => `${API}/passports/${passportId}/qr`;

export const askGovAssist = (message, role = "government", startupId = "") => post("/chat", { message, role, startup_id: startupId });
export const askChatbot = askGovAssist;
export const runLabTool = tool => get(`/lab/${tool}`);
export const procurementReportUrl = id => `${API}/procurement/${id}/report`;
