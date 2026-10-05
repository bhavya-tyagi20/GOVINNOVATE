import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  MapPin,
  Database,
  Cpu,
  AlertCircle,
  Sparkles,
} from "lucide-react";

import {
  getChallenge,
  getDepartments,
  getSimilarSolutions, reusePilotFramework,
} from "../services/api";

export default function ChallengeDetails() {
  const { challengeId } = useParams();

  const [challenge, setChallenge] = useState(null);
  const [department, setDepartment] = useState(null);
  const [similarSolutions, setSimilarSolutions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadChallenge() {
      try {
        setLoading(true);
        setError("");

        console.log(
          "Loading challenge:",
          challengeId
        );

        const challengeData =
          await getChallenge(challengeId);

        console.log(
          "Challenge response:",
          challengeData
        );

        setChallenge(challengeData);
        getSimilarSolutions(challengeId).then((data) => setSimilarSolutions(data.matches || [])).catch(() => setSimilarSolutions([]));

        // Load department information
        try {
          const departments =
            await getDepartments();

          const foundDepartment =
            departments.find(
              (item) =>
                item.department_id ===
                challengeData.department_id
            );

          setDepartment(foundDepartment || null);
        } catch (departmentError) {
          console.warn(
            "Department information unavailable:",
            departmentError
          );
        }

      } catch (err) {
        console.error(
          "Challenge loading error:",
          err
        );

        setError(
          "The requested government challenge could not be found."
        );
      } finally {
        setLoading(false);
      }
    }

    if (challengeId) {
      loadChallenge();
    } else {
      setError(
        "Challenge ID is missing from the URL."
      );
      setLoading(false);
    }
  }, [challengeId]);


  /* ---------------- LOADING ---------------- */

  if (loading) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-slate-200 bg-white p-8">
          <p className="text-sm text-slate-500">
            Loading challenge...
          </p>
        </div>
      </div>
    );
  }


  /* ---------------- ERROR ---------------- */

  if (error || !challenge) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">

          <AlertCircle
            size={42}
            className="mx-auto text-red-500"
          />

          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Challenge Not Found
          </h1>

          <p className="mt-2 text-slate-500">
            {error ||
              "The requested government challenge could not be found."}
          </p>

          <Link
            to="/challenges"
            className="mt-6 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800"
          >
            <ArrowLeft size={17} />
            Back to Challenges
          </Link>

        </div>
      </div>
    );
  }


  /* ---------------- MAIN PAGE ---------------- */

  return (
    <div className="p-8">

      {/* BACK */}

      <Link
        to="/challenges"
        className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600"
      >
        <ArrowLeft size={16} />
        Back to Challenges
      </Link>


      {/* HEADER */}

      <div className="mb-6">

        <div className="flex items-center gap-2">

          <span className="rounded-md bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
            {challenge.challenge_id}
          </span>

          <span className="rounded-md bg-slate-100 px-3 py-1 text-xs text-slate-600">
            {challenge.data_status}
          </span>

        </div>

        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          {challenge.title}
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          {challenge.problem_statement}
        </p>

      </div>


      {/* MAIN GRID */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* LEFT CONTENT */}

        <div className="space-y-6 lg:col-span-2">

          {/* Challenge information */}

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-semibold text-slate-900">
              Challenge Information
            </h2>


            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">

              <InfoItem
                icon={Building2}
                label="Department"
                value={
                  department?.department_name ||
                  challenge.department_id
                }
              />

              <InfoItem
                icon={Building2}
                label="Sector"
                value={challenge.sector}
              />

              <InfoItem
                icon={MapPin}
                label="Pilot Location"
                value={challenge.pilot_location}
              />

              <InfoItem
                icon={CalendarDays}
                label="Pilot Duration"
                value={`${challenge.duration_days} days`}
              />

              <InfoItem
                icon={Database}
                label="Data Status"
                value={challenge.data_status}
              />

            </div>

          </div>


          {/* Required Technologies */}

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-2">

              <Cpu
                size={20}
                className="text-indigo-600"
              />

              <h2 className="text-lg font-semibold text-slate-900">
                Required Technologies
              </h2>

            </div>


            <div className="mt-4 flex flex-wrap gap-2">

              {String(
                challenge.required_technologies || ""
              )
                .split(";")
                .map((technology) =>
                  technology.trim()
                )
                .filter(Boolean)
                .map((technology) => (

                  <span
                    key={technology}
                    className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700"
                  >
                    {technology}
                  </span>

                ))}

            </div>

          </div>


          {/* Proven solutions */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-emerald-700" />
              <h2 className="text-lg font-semibold text-slate-900">Proven Solutions from Other Departments</h2>
            </div>
            <p className="mt-2 text-sm text-slate-500">Semantic similarity helps identify completed pilots that may be reusable instead of repeating discovery work.</p>
            <div className="mt-4 space-y-3">
              {similarSolutions.length ? similarSolutions.map((item) => (
                <div key={item.pilot_id} className="rounded-lg border bg-white p-4">
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div><p className="font-semibold text-slate-800">{item.challenge_title}</p><p className="text-xs text-slate-500">{item.department_name} · {item.location} · {item.pilot_id}</p></div>
                    <div className="flex items-center gap-2"><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{item.similarity_score}% similar</span>{item.efficacy_score !== "" && <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">Efficacy {item.efficacy_score}</span>}</div>
                  </div>
                  <button type="button" onClick={async () => { try { const result = await reusePilotFramework(item.pilot_id); const text = `Reusable framework created from ${result.source_pilot_id}.

Title: ${result.draft.title}
Technologies: ${result.draft.required_technologies}
Duration: ${result.draft.duration_days} days

Open the government Challenges workflow to review and publish this draft.`; window.alert(text); } catch (e) { window.alert(e.message); } }} className="mt-3 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white">Re-use Pilot Framework</button>
                </div>
              )) : <p className="text-sm text-slate-500">No completed similar pilot found yet.</p>}
            </div>
          </div>

          {/* Problem Statement */}

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-semibold text-slate-900">
              Government Problem
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-600">
              {challenge.problem_statement}
            </p>

          </div>

        </div>


        {/* RIGHT SIDE */}

        <div>

          <div className="sticky top-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="rounded-lg bg-indigo-50 p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                Procurement Workflow
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Discover startups that can address this
                government challenge using explainable
                technology, sector, capability and
                location matching.
              </p>

            </div>


            {/* Matching button */}

            <Link
              to={`/challenges/${challenge.challenge_id}/matching`}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Find Matching Startups

              <ArrowRight size={17} />

            </Link>


            {/* Details */}

            <div className="mt-6 border-t border-slate-200 pt-5">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Challenge ID
              </p>

              <p className="mt-1 text-sm font-medium text-slate-800">
                {challenge.challenge_id}
              </p>


              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Sector
              </p>

              <p className="mt-1 text-sm font-medium text-slate-800">
                {challenge.sector}
              </p>


              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Pilot Location
              </p>

              <p className="mt-1 text-sm font-medium text-slate-800">
                {challenge.pilot_location}
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}


/* =====================================================
   INFORMATION ITEM
===================================================== */

function InfoItem({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">

      <div className="flex items-center gap-2">

        <Icon
          size={17}
          className="text-indigo-600"
        />

        <p className="text-xs font-medium text-slate-500">
          {label}
        </p>

      </div>

      <p className="mt-2 text-sm font-semibold text-slate-900">
        {value || "Not available"}
      </p>

    </div>
  );
}