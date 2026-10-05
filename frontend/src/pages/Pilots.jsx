import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getPilots,
  getChallenges,
  getStartups,
} from "../services/api";

function Pilots() {
  const [pilots, setPilots] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [startups, setStartups] = useState([]);

  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPilots(),
      getChallenges(),
      getStartups(),
    ])
      .then(([pilotData, challengeData, startupData]) => {
        setPilots(pilotData);
        setChallenges(challengeData);
        setStartups(startupData);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, []);

  function getChallenge(challengeId) {
    return challenges.find(
      (challenge) =>
        challenge.challenge_id === challengeId
    );
  }

  function getStartup(startupId) {
    return startups.find(
      (startup) =>
        startup.startup_id === startupId
    );
  }

  const statuses = [
    "All",
    ...new Set(
      pilots
        .map((pilot) => pilot.status)
        .filter(Boolean)
    ),
  ];

  const filteredPilots = pilots.filter((pilot) => {
    return (
      status === "All" ||
      pilot.status === status
    );
  });

  if (loading) {
    return (
      <p className="text-slate-500">
        Loading pilots...
      </p>
    );
  }

  return (
    <div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Pilot Programs
        </h1>

        <p className="mt-2 text-slate-500">
          Monitor innovation pilots running across government departments.
        </p>
      </div>

      {/* Filter */}

      <div className="mb-6 rounded-xl border bg-white p-5 shadow-sm">

        <label className="text-sm font-medium text-slate-700">
          Filter by status
        </label>

        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value)
          }
          className="mt-2 block w-full rounded-lg border px-4 py-3 md:w-72"
        >
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

      </div>

      <p className="mb-4 text-sm text-slate-500">
        Showing {filteredPilots.length} of {pilots.length} pilots
      </p>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        {filteredPilots.map((pilot) => {

          const challenge = getChallenge(
            pilot.challenge_id
          );

          const startup = getStartup(
            pilot.startup_id
          );

          return (
            <div
              key={pilot.pilot_id}
              className="rounded-xl border bg-white p-6 shadow-sm"
            >

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p className="text-sm font-medium text-indigo-600">
                    {pilot.pilot_id}
                  </p>

                  <h2 className="mt-2 text-xl font-semibold text-slate-800">
                    {startup?.startup_name ||
                      pilot.startup_id}
                  </h2>

                </div>

                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                  {pilot.status}
                </span>

              </div>

              <div className="mt-5 space-y-3 text-sm text-slate-600">

                <p>
                  <strong>Challenge:</strong>{" "}
                  {challenge?.title ||
                    pilot.challenge_id}
                </p>

                <p>
                  <strong>Location:</strong>{" "}
                  {pilot.location}
                </p>

                <p>
                  <strong>Duration:</strong>{" "}
                  {pilot.duration_days} days
                </p>

              </div>

              <Link
                to={`/pilots/${pilot.pilot_id}`}
                className="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                View Pilot
              </Link>

            </div>
          );
        })}

      </div>

    </div>
  );
}

export default Pilots;