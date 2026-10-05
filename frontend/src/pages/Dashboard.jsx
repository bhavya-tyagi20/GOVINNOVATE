import { useEffect, useState } from "react";

import {
  ClipboardList,
  Building2,
  FileCheck,
  FlaskConical,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  ArrowUpRight,
  AlertTriangle,
} from "lucide-react";

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
import EarlyWarningWidget from "../components/EarlyWarningWidget";


function Dashboard() {

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
      .then(([
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

      })
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
            Loading government innovation data...
          </p>

        </div>

      </div>
    );
  }


  const stats = [
    {
      title: "Government Challenges",
      value: data.challenges.length,
      icon: ClipboardList,
      description: "Active problem statements",
    },
    {
      title: "Registered Startups",
      value: data.startups.length,
      icon: Building2,
      description: "Innovation solution providers",
    },
    {
      title: "Applications",
      value: data.applications.length,
      icon: FileCheck,
      description: "Submitted proposals",
    },
    {
      title: "Active Pilots",
      value: data.pilots.length,
      icon: FlaskConical,
      description: "Pilot programs",
    },
    {
      title: "Validated",
      value: data.validations.length,
      icon: ShieldCheck,
      description: "Solutions validated",
    },
    {
      title: "Procurement",
      value: data.procurement.length,
      icon: ShoppingCart,
      description: "Decision records",
    },
  ];


  return (
    <div>

      {/* Page heading */}

      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">

        <div>

          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-700">
            Innovation Procurement Command Center
          </p>

          <h1 className="mt-2 text-[30px] font-bold leading-tight tracking-tight text-slate-900">
            Government Innovation Dashboard
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Monitor government challenges, startup participation,
            pilots and procurement decisions from a single platform.
          </p>

        </div>


        <div className="flex items-center gap-3">

          <div className="rounded-lg border bg-white px-4 py-2">

            <p className="text-xs text-slate-400">
              System Status
            </p>

            <div className="mt-1 flex items-center gap-2">

              <span className="h-2 w-2 rounded-full bg-green-500" />

              <span className="text-sm font-medium text-slate-700">
                Operational
              </span>

            </div>

          </div>

        </div>

      </div>


      {/* KPI Cards */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">

        {stats.map((stat) => {

          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="group rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >

              <div className="flex items-start justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-700">

                  <Icon size={22} />

                </div>

                <ArrowUpRight
                  size={18}
                  className="text-slate-300 transition group-hover:text-purple-600"
                />

              </div>

              <p className="mt-5 text-sm text-slate-500">
                {stat.title}
              </p>

              <p className="mt-1 text-3xl font-bold text-slate-900">
                {stat.value}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {stat.description}
              </p>

            </div>
          );

        })}

      </div>


      <EarlyWarningWidget />

      {/* Main dashboard grid */}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Innovation pipeline */}

        <div className="rounded-xl border bg-white p-6 shadow-sm xl:col-span-2">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-[17px] font-semibold tracking-tight text-slate-900">
                Innovation Procurement Pipeline
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Solutions progressing through the government lifecycle
              </p>

            </div>

            <TrendingUp
              size={20}
              className="text-purple-700"
            />

          </div>


          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">

            <PipelineItem
              title="Challenges"
              value={data.challenges.length}
              icon={ClipboardList}
            />

            <PipelineItem
              title="Applications"
              value={data.applications.length}
              icon={FileCheck}
            />

            <PipelineItem
              title="Pilots"
              value={data.pilots.length}
              icon={FlaskConical}
            />

            <PipelineItem
              title="Scale-ups"
              value={data.scaleups.length}
              icon={TrendingUp}
            />

          </div>


          <div className="mt-8">

            <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">

              <div className="w-1/4 bg-purple-300" />
              <div className="w-1/4 bg-purple-400" />
              <div className="w-1/4 bg-purple-600" />
              <div className="w-1/4 bg-purple-800" />

            </div>

            <div className="mt-3 flex justify-between text-xs text-slate-400">

              <span>Discovery</span>
              <span>Evaluation</span>
              <span>Pilot</span>
              <span>Scale</span>

            </div>

          </div>

        </div>


        {/* Alerts */}

        <div className="rounded-xl border bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-[17px] font-semibold tracking-tight text-slate-900">
                Key Alerts
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Items requiring attention
              </p>

            </div>

            <AlertTriangle
              size={20}
              className="text-purple-700"
            />

          </div>


          <div className="mt-6 space-y-4">

            <AlertItem
              title="Pilot monitoring"
              value={`${data.pilots.length} active pilot records`}
            />

            <AlertItem
              title="Validation review"
              value={`${data.validations.length} validation records`}
            />

            <AlertItem
              title="Procurement decisions"
              value={`${data.procurement.length} decisions recorded`}
            />

            <AlertItem
              title="Scale-up pipeline"
              value={`${data.scaleups.length} scale-up plans`}
            />

          </div>

        </div>

      </div>


      {/* Lower section */}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">


        {/* Evaluation summary */}

        <div className="rounded-xl border bg-white p-6 shadow-sm">

          <h2 className="text-[17px] font-semibold tracking-tight text-slate-900">
            Evaluation Overview
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Current startup evaluation records
          </p>


          <div className="mt-6 grid grid-cols-3 gap-4">

            <SummaryBox
              label="Evaluations"
              value={data.evaluations.length}
            />

            <SummaryBox
              label="Applications"
              value={data.applications.length}
            />

            <SummaryBox
              label="Startups"
              value={data.startups.length}
            />

          </div>


          <div className="mt-6 rounded-lg bg-purple-50 p-4">

            <p className="text-sm font-semibold text-purple-800">
              Explainable Decision Support
            </p>

            <p className="mt-1 text-xs leading-5 text-purple-700">
              Startup recommendations are generated using technology,
              capability, sector and location matching.
            </p>

          </div>

        </div>


        {/* Public value */}

        <div className="rounded-xl bg-purple-800 p-6 text-white shadow-sm">

          <p className="text-xs font-semibold uppercase tracking-wider text-purple-200">
            Public Value
          </p>

          <h2 className="mt-3 text-[23px] font-bold leading-tight tracking-tight">
            From innovation to measurable impact.
          </h2>

          <p className="mt-3 text-sm leading-6 text-purple-100">
            GovInnovate creates a transparent workflow for discovering
            startups, testing solutions through pilots, validating
            outcomes and supporting evidence-based procurement decisions.
          </p>


          <div className="mt-7 grid grid-cols-3 gap-3">

            <ImpactItem
              title="Discover"
              text="Find"
            />

            <ImpactItem
              title="Validate"
              text="Test"
            />

            <ImpactItem
              title="Scale"
              text="Deploy"
            />

          </div>

        </div>

      </div>


      {/* Footer */}

      <div className="mt-8 border-t pt-5">

        <p className="text-xs text-slate-400">
          GovInnovate • Startup Friendly Public Procurement • SIH 26136 Prototype
        </p>

      </div>

    </div>
  );
}


/* ---------------- Components ---------------- */


function PipelineItem({
  title,
  value,
  icon: Icon,
}) {
  return (
    <div className="rounded-lg border bg-slate-50 p-4">

      <div className="flex items-center justify-between">

        <Icon
          size={18}
          className="text-purple-700"
        />

        <span className="text-xl font-bold text-slate-900">
          {value}
        </span>

      </div>

      <p className="mt-3 text-xs text-slate-500">
        {title}
      </p>

    </div>
  );
}


function AlertItem({ title, value }) {
  return (
    <div className="border-b pb-4 last:border-0">

      <div className="flex items-start gap-3">

        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-purple-600" />

        <div>

          <p className="text-sm font-medium text-slate-700">
            {title}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {value}
          </p>

        </div>

      </div>

    </div>
  );
}


function SummaryBox({ label, value }) {
  return (
    <div className="rounded-lg border p-4 text-center">

      <p className="text-2xl font-bold text-purple-700">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {label}
      </p>

    </div>
  );
}


function ImpactItem({ title, text }) {
  return (
    <div className="rounded-lg bg-white/10 p-3">

      <p className="text-xs text-purple-200">
        {title}
      </p>

      <p className="mt-1 font-semibold">
        {text}
      </p>

    </div>
  );
}


export default Dashboard;