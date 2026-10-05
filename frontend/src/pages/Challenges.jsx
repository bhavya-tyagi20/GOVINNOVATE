import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getChallenges } from "../services/api";

function Challenges() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getChallenges()
      .then((data) => {
        setChallenges(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Government Challenges
        </h1>

        <p className="mt-4 text-slate-500">
          Loading challenges...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Government Challenges
        </h1>

        <p className="mt-4 text-red-600">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-700">
          Government Innovation
        </p>

        <h1 className="mt-2 text-[28px] font-bold tracking-tight text-slate-900">
          Government Challenges
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Browse active government problem statements and view the potential startup pool for each challenge.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {challenges.map((challenge) => (
          <div
            key={challenge.challenge_id}
            className="rounded-xl border bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {challenge.title}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Challenge ID: {challenge.challenge_id}
                </p>
              </div>

              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                {challenge.sector}
              </span>
            </div>

            <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
              {challenge.problem_statement}
            </p>

            <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4">
              <div className="rounded-lg bg-purple-50 px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-purple-600">
                  Potential startup pool
                </p>
                <p className="mt-0.5 text-sm font-semibold text-purple-800">
                  {challenge.sector_aligned_startups ?? 0} relevant startups
                </p>
              </div>

              <Link
                to={`/challenges/${challenge.challenge_id}`}
                className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                View Challenge
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Challenges;