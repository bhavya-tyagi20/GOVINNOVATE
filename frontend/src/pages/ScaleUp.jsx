import { useEffect, useState } from "react";
import { getScaleups } from "../services/api";

function ScaleUp() {
  const [scaleups, setScaleups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getScaleups()
      .then((data) => {
        setScaleups(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="text-slate-500">Loading scale-up plans...</p>;
  }

  return (
    <div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Scale-up
        </h1>

        <p className="mt-2 text-slate-500">
          Track expansion from successful pilots to wider government deployment.
        </p>
      </div>

      <div className="space-y-5">

        {scaleups.map((scaleup) => (

          <div
            key={scaleup.scaleup_id}
            className="rounded-xl border bg-white p-6 shadow-sm"
          >

            <div className="flex justify-between gap-4">

              <div>
                <p className="text-sm font-medium text-indigo-600">
                  {scaleup.scaleup_id}
                </p>

                <h2 className="mt-2 text-xl font-semibold text-slate-800">
                  Scale-up Plan
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Procurement Decision: {scaleup.decision_id}
                </p>
              </div>

              <span className="h-fit rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
                {scaleup.status}
              </span>

            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">

              <Phase
                title="Phase 1"
                value={scaleup.phase_1}
              />

              <Phase
                title="Phase 2"
                value={scaleup.phase_2}
              />

              <Phase
                title="Target Scale"
                value={scaleup.target_scale}
              />

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}

function Phase({ title, value }) {
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

export default ScaleUp;