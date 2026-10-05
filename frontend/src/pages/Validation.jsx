import { useEffect, useState } from "react";
import { getValidations, getPilots, getStartups } from "../services/api";

function Validation() {
  const [validations, setValidations] = useState([]);
  const [pilots, setPilots] = useState([]);
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getValidations(),
      getPilots(),
      getStartups(),
    ])
      .then(([validationData, pilotData, startupData]) => {
        setValidations(validationData);
        setPilots(pilotData);
        setStartups(startupData);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, []);

  function getPilot(pilotId) {
    return pilots.find(
      (pilot) => pilot.pilot_id === pilotId
    );
  }

  function getStartup(pilotId) {
    const pilot = getPilot(pilotId);

    if (!pilot) return null;

    return startups.find(
      (startup) => startup.startup_id === pilot.startup_id
    );
  }

  if (loading) {
    return <p className="text-slate-500">Loading validations...</p>;
  }

  return (
    <div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Validation
        </h1>

        <p className="mt-2 text-slate-500">
          Verify pilot claims against independently recorded performance.
        </p>
      </div>

      <div className="space-y-5">

        {validations.map((validation) => {

          const startup = getStartup(validation.pilot_id);

          const passed =
            String(validation.result).toLowerCase().includes("pass") ||
            String(validation.result).toLowerCase().includes("verified");

          return (
            <div
              key={validation.validation_id}
              className="rounded-xl border bg-white p-6 shadow-sm"
            >

              <div className="flex flex-col justify-between gap-4 md:flex-row">

                <div>
                  <p className="text-sm font-medium text-indigo-600">
                    {validation.validation_id}
                  </p>

                  <h2 className="mt-2 text-xl font-semibold text-slate-800">
                    {startup?.startup_name || validation.pilot_id}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Validator: {validation.validator}
                  </p>
                </div>

                <span
                  className={`h-fit rounded-full px-4 py-2 text-sm font-medium ${
                    passed
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {validation.result}
                </span>

              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">

                <div className="rounded-lg bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">
                    Startup Claim
                  </p>

                  <p className="mt-2 font-semibold text-slate-800">
                    {validation.startup_claim}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">
                    Verified Performance
                  </p>

                  <p className="mt-2 font-semibold text-slate-800">
                    {validation.verified_performance}
                  </p>
                </div>

              </div>

              <div className="mt-5 rounded-lg border p-4">
                <p className="text-sm text-slate-500">
                  Data Status
                </p>

                <p className="mt-1 font-medium text-slate-800">
                  {validation.data_status}
                </p>
              </div>

            </div>
          );
        })}

      </div>
    </div>
  );
}

export default Validation;