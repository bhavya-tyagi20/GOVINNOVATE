import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Target, AlertCircle } from "lucide-react";
import { getMatchingChallenges } from "../services/api";

export default function StartupMatching() {
  const { startupId } = useParams();
  const [startup, setStartup] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = await getMatchingChallenges(startupId);
        setStartup(data?.startup || null);
        setMatches(Array.isArray(data?.matches) ? data.matches : []);
      } catch (err) {
        console.error(err);
        setError(err?.message || "Unable to load matching challenges.");
      } finally {
        setLoading(false);
      }
    }

    if (startupId) load();
  }, [startupId]);

  if (loading) {
    return <div className="p-8 text-slate-500">Loading matching challenges...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <Link to={`/startups/${startupId}`} className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500">
          <ArrowLeft size={16} /> Back to Startup
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
          <AlertCircle className="mx-auto mb-3" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Link to={`/startups/${startupId}`} className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600">
        <ArrowLeft size={16} /> Back to Startup
      </Link>

      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">STARTUP–CHALLENGE MATCHING</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">{startup?.startup_name || startupId}</h1>
        <p className="mt-2 text-slate-500">Government challenges ranked by technical, sector and location fit.</p>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-xs text-slate-400">STARTUP ID</p>
            <p className="mt-1 font-semibold">{startup?.startup_id || startupId}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">SECTOR</p>
            <p className="mt-1 font-semibold">{startup?.sector || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">LOCATION</p>
            <p className="mt-1 flex items-center gap-1 font-semibold"><MapPin size={15} />{startup?.city || "—"}, {startup?.state || "—"}</p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900">Potential Government Challenges</h2>
        <p className="mt-1 text-sm text-slate-500">{matches.length} challenge records ranked by match score</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {matches.map((match) => (
          <div key={match.challenge_id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-400">{match.challenge_id}</p>
                <h3 className="mt-1 text-lg font-bold text-slate-900">{match.title}</h3>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-700">
                {Number(match.match_score || 0).toFixed(1)}%
              </span>
            </div>

            <p className="mt-3 text-sm text-slate-600">{match.problem_statement}</p>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-slate-50 p-3"><span className="text-slate-400">Sector</span><div className="mt-1 font-medium">{match.sector || "—"}</div></div>
              <div className="rounded-lg bg-slate-50 p-3"><span className="text-slate-400">Pilot</span><div className="mt-1 font-medium">{match.pilot_location || "—"}</div></div>
            </div>

            <Link to={`/challenges/${match.challenge_id}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
              <Target size={16} /> View Challenge
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
