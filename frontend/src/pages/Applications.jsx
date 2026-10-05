import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getApplications, getStartups, getChallenges } from "../services/api";

function Applications() {
  const [applications, setApplications] = useState([]);
  const [startups, setStartups] = useState([]);
  const [challenges, setChallenges] = useState([]);

  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getApplications(),
      getStartups(),
      getChallenges(),
    ])
      .then(([applicationData, startupData, challengeData]) => {
        setApplications(applicationData);
        setStartups(startupData);
        setChallenges(challengeData);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, []);

  function getStartup(startupId) {
    return startups.find(
      (startup) => startup.startup_id === startupId
    );
  }

  function getChallenge(challengeId) {
    return challenges.find(
      (challenge) => challenge.challenge_id === challengeId
    );
  }

  const statuses = [
    "All",
    ...new Set(
      applications
        .map((application) => application.status)
        .filter(Boolean)
    ),
  ];

  const filteredApplications = applications.filter((application) => {
    return (
      status === "All" ||
      application.status === status
    );
  });

  if (loading) {
    return (
      <p className="text-slate-500">
        Loading applications...
      </p>
    );
  }

  return (
    <div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Applications
        </h1>

        <p className="mt-2 text-slate-500">
          Review startup applications submitted against government challenges.
        </p>
      </div>

      {/* Filter */}

      <div className="mb-6 rounded-xl border bg-white p-5 shadow-sm">

        <label className="text-sm font-medium text-slate-700">
          Filter by status
        </label>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="mt-2 block w-full rounded-lg border px-4 py-3 outline-none focus:border-indigo-500 md:w-72"
        >
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

      </div>

      <p className="mb-4 text-sm text-slate-500">
        Showing {filteredApplications.length} of{" "}
        {applications.length} applications
      </p>

      {/* Applications */}

      <div className="space-y-4">

        {filteredApplications.map((application) => {

          const startup = getStartup(
            application.startup_id
          );

          const challenge = getChallenge(
            application.challenge_id
          );

          return (
            <div
              key={application.application_id}
              className="rounded-xl border bg-white p-6 shadow-sm"
            >

              <div className="flex flex-col justify-between gap-5 md:flex-row">

                <div>

                  <p className="text-sm font-medium text-indigo-600">
                    {application.application_id}
                  </p>

                  <h2 className="mt-2 text-xl font-semibold text-slate-800">
                    {startup?.startup_name || application.startup_id}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Challenge:{" "}
                    {challenge?.title || application.challenge_id}
                  </p>

                </div>

                <span className="h-fit rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
                  {application.status}
                </span>

              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Startup ID
                  </p>

                  <p className="mt-1 font-medium text-slate-800">
                    {application.startup_id}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Challenge ID
                  </p>

                  <p className="mt-1 font-medium text-slate-800">
                    {application.challenge_id}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Application Status
                  </p>

                  <p className="mt-1 font-medium text-slate-800">
                    {application.status}
                  </p>
                </div>

              </div>

              <div className="mt-5 flex gap-3">

                <Link
                  to={`/startups/${application.startup_id}`}
                  className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  View Startup
                </Link>

                <Link
                  to="/evaluations"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Evaluate
                </Link>

              </div>

            </div>
          );
        })}

      </div>

      {filteredApplications.length === 0 && (
        <div className="rounded-xl border bg-white p-10 text-center">
          <p className="text-slate-500">
            No applications found.
          </p>
        </div>
      )}

    </div>
  );
}

export default Applications;