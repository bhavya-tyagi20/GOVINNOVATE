import { useEffect, useState } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

import {
  getChallenges,
  getStartups,
  getApplications,
  getEvaluations,
  getPilots,
  getValidations,
  getProcurement,
  getScaleups,
} from "../services/api";


function Analytics() {
  const [data, setData] = useState({
    challenges: [],
    startups: [],
    applications: [],
    evaluations: [],
    pilots: [],
    validations: [],
    procurement: [],
    scaleups: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getChallenges(),
      getStartups(),
      getApplications(),
      getEvaluations(),
      getPilots(),
      getValidations(),
      getProcurement(),
      getScaleups(),
    ])
      .then(
        ([
          challenges,
          startups,
          applications,
          evaluations,
          pilots,
          validations,
          procurement,
          scaleups,
        ]) => {
          setData({
            challenges,
            startups,
            applications,
            evaluations,
            pilots,
            validations,
            procurement,
            scaleups,
          });

          setLoading(false);
        }
      )
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, []);


  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-purple-200 border-t-purple-700" />

          <p className="mt-4 text-sm text-slate-500">
            Preparing analytics...
          </p>

        </div>
      </div>
    );
  }


  // --------------------------------
  // Applications by sector
  // --------------------------------

  const sectorData = {};

  data.challenges.forEach((challenge) => {
    const sector = challenge.sector || "Other";

    if (!sectorData[sector]) {
      sectorData[sector] = 0;
    }

    sectorData[sector]++;
  });

  const sectorChart = Object.entries(sectorData).map(
    ([name, value]) => ({
      name,
      value,
    })
  );


  // --------------------------------
  // Evaluation scores
  // --------------------------------

  const evaluationChart = data.evaluations.map(
    (evaluation) => ({
      name: evaluation.evaluation_id,
      score: Number(evaluation.overall_score) || 0,
    })
  );


  // --------------------------------
  // Pilot performance
  // --------------------------------

  const pilotPerformance = data.pilots.map((pilot) => {

    const pilotMetrics = [];

    // Metrics are loaded separately below
    // and will be represented through pilot status.

    return {
      name: pilot.pilot_id,
      performance:
        pilot.status?.toLowerCase() === "completed"
          ? 100
          : 65,
    };
  });


  // --------------------------------
  // Pipeline
  // --------------------------------

  const pipelineData = [
    {
      stage: "Challenges",
      count: data.challenges.length,
    },
    {
      stage: "Applications",
      count: data.applications.length,
    },
    {
      stage: "Evaluations",
      count: data.evaluations.length,
    },
    {
      stage: "Pilots",
      count: data.pilots.length,
    },
    {
      stage: "Validation",
      count: data.validations.length,
    },
    {
      stage: "Procurement",
      count: data.procurement.length,
    },
    {
      stage: "Scale-up",
      count: data.scaleups.length,
    },
  ];


  // --------------------------------
  // Procurement conversion
  // --------------------------------

  const procurementRate =
    data.pilots.length > 0
      ? Math.round(
          (data.procurement.length /
            data.pilots.length) *
            100
        )
      : 0;


  // --------------------------------
  // Average evaluation score
  // --------------------------------

  const averageScore =
    data.evaluations.length > 0
      ? Math.round(
          data.evaluations.reduce(
            (total, item) =>
              total +
              (Number(item.overall_score) || 0),
            0
          ) / data.evaluations.length
        )
      : 0;


  return (
    <div>

      {/* Header */}

      <div className="mb-8">

        <p className="text-sm font-medium text-purple-700">
          DECISION INTELLIGENCE
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Analytics
        </h1>

        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Monitor participation, evaluation outcomes, pilot activity
          and procurement progression across the innovation ecosystem.
        </p>

      </div>


      {/* KPI cards */}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

        <AnalyticsCard
          title="Average Evaluation"
          value={`${averageScore}`}
          subtitle="Overall score"
        />

        <AnalyticsCard
          title="Procurement Conversion"
          value={`${procurementRate}%`}
          subtitle="Pilots reaching procurement"
        />

        <AnalyticsCard
          title="Validation Records"
          value={data.validations.length}
          subtitle="Solutions assessed"
        />

        <AnalyticsCard
          title="Scale-up Plans"
          value={data.scaleups.length}
          subtitle="Expansion initiatives"
        />

      </div>


      {/* Pipeline */}

      <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">

        <div className="mb-6">

          <h2 className="font-semibold text-slate-900">
            Innovation Pipeline
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Volume of records at each stage of the procurement lifecycle
          </p>

        </div>

        <div className="h-80">

          <ResponsiveContainer width="100%" height="100%">

            <BarChart data={pipelineData}>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="stage"
                tick={{ fontSize: 12 }}
              />

              <YAxis
                allowDecimals={false}
              />

              <Tooltip />

              <Bar
                dataKey="count"
                fill="#6d28d9"
                radius={[6, 6, 0, 0]}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </div>


      {/* Charts */}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">


        {/* Sector distribution */}

        <div className="rounded-xl border bg-white p-6 shadow-sm">

          <h2 className="font-semibold text-slate-900">
            Challenges by Sector
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Distribution of government problem statements
          </p>

          <div className="mt-5 h-72">

            <ResponsiveContainer width="100%" height="100%">

              <PieChart>

                <Pie
                  data={sectorChart}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >

                  {sectorChart.map(
                    (entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          [
                            "#5b21b6",
                            "#7c3aed",
                            "#8b5cf6",
                            "#a78bfa",
                            "#c4b5fd",
                            "#ddd6fe",
                          ][
                            index %
                              6
                          ]
                        }
                      />
                    )
                  )}

                </Pie>

                <Tooltip />

              </PieChart>

            </ResponsiveContainer>

          </div>

        </div>


        {/* Evaluation scores */}

        <div className="rounded-xl border bg-white p-6 shadow-sm">

          <h2 className="font-semibold text-slate-900">
            Evaluation Performance
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Overall scores recorded for startup evaluations
          </p>

          <div className="mt-5 h-72">

            <ResponsiveContainer width="100%" height="100%">

              <LineChart data={evaluationChart}>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                />

                <YAxis
                  domain={[0, 100]}
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#6d28d9"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

        </div>


      </div>


      {/* Pilot performance */}

      <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">

        <div className="mb-6">

          <h2 className="font-semibold text-slate-900">
            Pilot Performance
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Pilot progress indicator based on current pilot status
          </p>

        </div>

        <div className="h-72">

          <ResponsiveContainer width="100%" height="100%">

            <BarChart data={pilotPerformance}>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="name"
              />

              <YAxis
                domain={[0, 100]}
              />

              <Tooltip />

              <Bar
                dataKey="performance"
                fill="#8b5cf6"
                radius={[6, 6, 0, 0]}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </div>


      {/* Decision summary */}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">

        <DecisionCard
          title="Startup Ecosystem"
          value={data.startups.length}
          text="Registered solution providers available for government challenges."
        />

        <DecisionCard
          title="Pilot Portfolio"
          value={data.pilots.length}
          text="Solutions currently represented in the pilot pipeline."
        />

        <DecisionCard
          title="Scale Potential"
          value={data.scaleups.length}
          text="Solutions that have progressed into scale-up planning."
        />

      </div>


      {/* Disclaimer */}

      <div className="mt-8 rounded-xl border border-purple-200 bg-purple-50 p-5">

        <p className="text-sm font-semibold text-purple-800">
          Analytics note
        </p>

        <p className="mt-1 text-xs leading-5 text-purple-700">
          Analytics are generated from the prototype dataset and are
          intended for decision-support demonstration. They should not
          be interpreted as final procurement or administrative decisions.
        </p>

      </div>

    </div>
  );
}


/* ----------------------------- */


function AnalyticsCard({
  title,
  value,
  subtitle,
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-purple-700">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {subtitle}
      </p>

    </div>
  );
}


/* ----------------------------- */


function DecisionCard({
  title,
  value,
  text,
}) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">

      <p className="text-xs font-semibold uppercase tracking-wider text-purple-700">
        {title}
      </p>

      <p className="mt-3 text-3xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {text}
      </p>

    </div>
  );
}


export default Analytics;