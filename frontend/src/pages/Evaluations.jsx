import { useEffect, useState } from "react";
import { getEvaluations, getApplications, getStartups } from "../services/api";

function Evaluations() {
  const [evaluations, setEvaluations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [startups, setStartups] = useState([]);

  const [decision, setDecision] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getEvaluations(),
      getApplications(),
      getStartups(),
    ])
      .then(([evaluationData, applicationData, startupData]) => {
        setEvaluations(evaluationData);
        setApplications(applicationData);
        setStartups(startupData);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, []);

  function getApplication(applicationId) {
    return applications.find(
      (application) =>
        application.application_id === applicationId
    );
  }

  function getStartup(applicationId) {
    const application = getApplication(applicationId);

    if (!application) {
      return null;
    }

    return startups.find(
      (startup) =>
        startup.startup_id === application.startup_id
    );
  }

  const decisions = [
    "All",
    ...new Set(
      evaluations
        .map((evaluation) => evaluation.decision)
        .filter(Boolean)
    ),
  ];

  const filteredEvaluations = evaluations.filter(
    (evaluation) =>
      decision === "All" ||
      evaluation.decision === decision
  );

  if (loading) {
    return (
      <p className="text-slate-500">
        Loading evaluations...
      </p>
    );
  }

  return (
    <div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Evaluations
        </h1>

        <p className="mt-2 text-slate-500">
          Compare technical, innovation, scalability and security scores.
        </p>
      </div>

      {/* Filter */}

      <div className="mb-6 rounded-xl border bg-white p-5 shadow-sm">

        <label className="text-sm font-medium text-slate-700">
          Filter by decision
        </label>

        <select
          value={decision}
          onChange={(event) =>
            setDecision(event.target.value)
          }
          className="mt-2 block w-full rounded-lg border px-4 py-3 outline-none focus:border-indigo-500 md:w-72"
        >
          {decisions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

      </div>

      <div className="space-y-5">

        {filteredEvaluations.map((evaluation) => {

          const startup = getStartup(
            evaluation.application_id
          );

          return (
            <div
              key={evaluation.evaluation_id}
              className="rounded-xl border bg-white p-6 shadow-sm"
            >

              <div className="flex flex-col justify-between gap-4 md:flex-row">

                <div>

                  <p className="text-sm font-medium text-indigo-600">
                    {evaluation.evaluation_id}
                  </p>

                  <h2 className="mt-2 text-xl font-semibold text-slate-800">
                    {startup?.startup_name ||
                      evaluation.application_id}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Application:{" "}
                    {evaluation.application_id}
                  </p>

                </div>

                <div className="text-left md:text-right">

                  <p className="text-sm text-slate-500">
                    Overall Score
                  </p>

                  <p className="text-3xl font-bold text-indigo-600">
                    {evaluation.overall_score}
                  </p>

                </div>

              </div>

              {/* Score cards */}

              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">

                <ScoreCard
                  title="Technical"
                  value={evaluation.technical_score}
                />

                <ScoreCard
                  title="Innovation"
                  value={evaluation.innovation_score}
                />

                <ScoreCard
                  title="Scalability"
                  value={evaluation.scalability_score}
                />

                <ScoreCard
                  title="Security"
                  value={evaluation.security_score}
                />

              </div>

              {/* Decision */}

              <div className="mt-6 flex flex-col justify-between gap-4 rounded-lg bg-slate-50 p-5 md:flex-row md:items-center">

                <div>
                  <p className="text-sm text-slate-500">
                    Evaluation Decision
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {evaluation.decision}
                  </p>
                </div>

                <button
                  onClick={() =>
                    alert(
                      `Evaluation ${evaluation.evaluation_id} selected.`
                    )
                  }
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  View Evaluation
                </button>

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}


function ScoreCard({ title, value }) {
  return (
    <div className="rounded-lg border p-4">

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-800">
        {value}
      </p>

      <div className="mt-3 h-2 rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full bg-indigo-600"
          style={{
            width: `${Math.min(
              Number(value) || 0,
              100
            )}%`,
          }}
        ></div>
      </div>

    </div>
  );
}

export default Evaluations;