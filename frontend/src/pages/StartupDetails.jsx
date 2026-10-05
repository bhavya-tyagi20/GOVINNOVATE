import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getStartups } from "../services/api";

function StartupDetails() {
  const { id } = useParams();

  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStartups()
      .then((data) => {
        const foundStartup = data.find(
          (item) => item.startup_id === id
        );

        setStartup(foundStartup);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <p className="text-slate-500">
        Loading startup...
      </p>
    );
  }

  if (!startup) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Startup Not Found
        </h1>

        <Link
          to="/startups"
          className="mt-4 inline-block text-indigo-600 hover:underline"
        >
          ← Back to Startups
        </Link>
      </div>
    );
  }

  const capabilities = String(
    startup.capabilities || ""
  )
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <div>
      <Link
        to="/startups"
        className="text-sm text-indigo-600 hover:underline"
      >
        ← Back to Startups
      </Link>

      <div className="mt-6 rounded-xl border bg-white p-8 shadow-sm">

        <div className="flex flex-col justify-between gap-5 md:flex-row">

          <div>
            <p className="text-sm font-medium text-indigo-600">
              {startup.startup_id}
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-800">
              {startup.startup_name}
            </h1>

            <p className="mt-2 text-slate-500">
              {startup.industry}
            </p>
          </div>

          <span className="h-fit rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
            {startup.stage}
          </span>

        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">

          <div className="rounded-lg bg-slate-50 p-5">
            <p className="text-sm text-slate-500">
              Sector
            </p>

            <p className="mt-2 font-semibold text-slate-800">
              {startup.sector}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-5">
            <p className="text-sm text-slate-500">
              Location
            </p>

            <p className="mt-2 font-semibold text-slate-800">
              {startup.city}, {startup.state}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-5">
            <p className="text-sm text-slate-500">
              Data Status
            </p>

            <p className="mt-2 font-semibold text-slate-800">
              {startup.data_status || "Available"}
            </p>
          </div>

        </div>

        <div className="mt-8">

          <h2 className="text-lg font-semibold text-slate-800">
            Solution
          </h2>

          <p className="mt-3 leading-7 text-slate-600">
            {startup.solution_description}
          </p>

        </div>

        <div className="mt-8">

          <h2 className="text-lg font-semibold text-slate-800">
            Capabilities
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">

            {capabilities.map((capability) => (
              <span
                key={capability}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700"
              >
                {capability}
              </span>
            ))}

          </div>

        </div>

        <div className="mt-8 border-t pt-6">

          <h2 className="text-lg font-semibold text-slate-800">
            Procurement Readiness
          </h2>

          <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">

            <p className="text-sm text-slate-600">
              Procurement readiness will be calculated using application,
              evaluation, pilot and validation data.
            </p>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-0 rounded-full bg-indigo-600"></div>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Match this startup against all government challenges.
            </p>

            <Link
              to={`/startups/${startup.startup_id}/matching`}
              className="mt-4 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Find Matching Challenges
            </Link>

          </div>

        </div>

      </div>
    </div>
  );
}

export default StartupDetails;