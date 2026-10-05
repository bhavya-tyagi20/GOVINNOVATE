import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getPilots,
  getChallenges,
  getStartups,
  getPilotMetrics,
  getMilestones,
} from "../services/api";


function PilotDetails() {

  const { id } = useParams();

  const [pilot, setPilot] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [startup, setStartup] = useState(null);

  const [metrics, setMetrics] = useState([]);
  const [milestones, setMilestones] = useState([]);

  const [loading, setLoading] = useState(true);


  useEffect(() => {

    Promise.all([
      getPilots(),
      getChallenges(),
      getStartups(),
      getPilotMetrics(),
      getMilestones(),
    ])
      .then(
        ([
          pilotData,
          challengeData,
          startupData,
          metricData,
          milestoneData,
        ]) => {

          const foundPilot = pilotData.find(
            (item) => item.pilot_id === id
          );

          setPilot(foundPilot);

          if (foundPilot) {

            const foundChallenge =
              challengeData.find(
                (item) =>
                  item.challenge_id ===
                  foundPilot.challenge_id
              );

            const foundStartup =
              startupData.find(
                (item) =>
                  item.startup_id ===
                  foundPilot.startup_id
              );

            setChallenge(foundChallenge);
            setStartup(foundStartup);

            setMetrics(
              metricData.filter(
                (item) =>
                  item.pilot_id === id
              )
            );

            setMilestones(
              milestoneData.filter(
                (item) =>
                  item.pilot_id === id
              )
            );
          }

          setLoading(false);
        }
      )
      .catch((error) => {

        console.error(error);
        setLoading(false);

      });

  }, [id]);


  if (loading) {
    return (
      <p className="text-slate-500">
        Loading pilot...
      </p>
    );
  }


  if (!pilot) {
    return (
      <div>

        <h1 className="text-2xl font-bold text-slate-800">
          Pilot Not Found
        </h1>

        <Link
          to="/pilots"
          className="mt-4 inline-block text-indigo-600 hover:underline"
        >
          ← Back to Pilots
        </Link>

      </div>
    );
  }


  return (
    <div>

      <Link
        to="/pilots"
        className="text-sm text-indigo-600 hover:underline"
      >
        ← Back to Pilots
      </Link>


      {/* Header */}

      <div className="mt-6 rounded-xl border bg-white p-8 shadow-sm">

        <div className="flex flex-col justify-between gap-5 md:flex-row">

          <div>

            <p className="text-sm font-medium text-indigo-600">
              {pilot.pilot_id}
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-800">
              {startup?.startup_name ||
                pilot.startup_id}
            </h1>

            <p className="mt-2 text-slate-500">
              {challenge?.title ||
                pilot.challenge_id}
            </p>

          </div>

          <span className="h-fit rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
            {pilot.status}
          </span>

        </div>


        {/* Basic information */}

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">

          <InfoCard
            title="Pilot Location"
            value={pilot.location}
          />

          <InfoCard
            title="Duration"
            value={`${pilot.duration_days} days`}
          />

          <InfoCard
            title="Startup"
            value={startup?.startup_name || pilot.startup_id}
          />

        </div>

      </div>


      {/* Pilot Health */}

      <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">

        <h2 className="text-lg font-semibold text-slate-800">
          Pilot Health
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Current status based on pilot progress and performance.
        </p>

        <div className="mt-5 flex items-center gap-4">

          <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-200">

            <div
              className="h-full rounded-full bg-indigo-600"
              style={{
                width:
                  pilot.status?.toLowerCase() === "completed"
                    ? "100%"
                    : "65%",
              }}
            ></div>

          </div>

          <span className="font-semibold text-indigo-600">
            {pilot.status?.toLowerCase() === "completed"
              ? "100%"
              : "65%"}
          </span>

        </div>

      </div>


      {/* Metrics */}

      <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">

        <h2 className="text-lg font-semibold text-slate-800">
          Pilot Performance
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Target performance compared with actual results.
        </p>

        <div className="mt-5 space-y-5">

          {metrics.map((metric) => (

            <div
              key={metric.metric_id}
              className="rounded-lg bg-slate-50 p-5"
            >

              <div className="flex justify-between">

                <div>
                  <p className="font-medium text-slate-800">
                    {metric.metric_name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Target: {metric.target} {metric.unit}
                  </p>
                </div>

                <div className="text-right">

                  <p className="text-xl font-bold text-indigo-600">
                    {metric.actual}
                  </p>

                  <p className="text-xs text-slate-500">
                    {metric.unit}
                  </p>

                </div>

              </div>

              <div className="mt-4 h-2 rounded-full bg-slate-200">

                <div
                  className="h-2 rounded-full bg-indigo-600"
                  style={{
                    width: `${Math.min(
                      Number(metric.performance) || 0,
                      100
                    )}%`,
                  }}
                ></div>

              </div>

              <p className="mt-2 text-xs text-slate-500">
                Performance: {metric.performance}
              </p>

            </div>

          ))}

        </div>

      </div>


      {/* Milestones */}

      <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">

        <h2 className="text-lg font-semibold text-slate-800">
          Pilot Milestones
        </h2>

        <div className="mt-5 space-y-5">

          {milestones.map((milestone) => (

            <div key={milestone.milestone_id}>

              <div className="flex justify-between">

                <div>

                  <p className="font-medium text-slate-800">
                    {milestone.milestone_name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Status: {milestone.status}
                  </p>

                </div>

                <span className="font-semibold text-slate-700">
                  {milestone.completion_percent}%
                </span>

              </div>

              <div className="mt-2 h-2 rounded-full bg-slate-200">

                <div
                  className="h-2 rounded-full bg-indigo-600"
                  style={{
                    width: `${milestone.completion_percent}%`,
                  }}
                ></div>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}


function InfoCard({ title, value }) {

  return (
    <div className="rounded-lg bg-slate-50 p-5">

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-2 font-semibold text-slate-800">
        {value}
      </p>

    </div>
  );
}


export default PilotDetails;