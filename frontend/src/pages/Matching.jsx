import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
} from "lucide-react";

import { getChallenges } from "../services/api";

const API_URL = "http://127.0.0.1:8000/api";

function getScoreClass(score) {
  if (score >= 70) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (score >= 40) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  return "bg-slate-50 text-slate-600 border-slate-200";
}

function ScoreBar({ label, score, maximum }) {
  const percentage =
    maximum > 0 ? Math.min((score / maximum) * 100, 100) : 0;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-500">{label}</span>

        <span className="font-semibold text-slate-700">
          {score}/{maximum}
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-slate-100">
        <div
          className="h-1.5 rounded-full bg-indigo-500 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function Matching() {
  const { id } = useParams();

  const [challenge, setChallenge] = useState(null);
  const [matches, setMatches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [minimumScore, setMinimumScore] = useState("0");
  const [sectorFilter, setSectorFilter] = useState("All");

  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    async function loadMatchingData() {
      try {
        setLoading(true);
        setError("");

        const [challengeData, matchResponse] = await Promise.all([
          getChallenges(),
          fetch(`${API_URL}/challenges/${id}/matches`).then(
            async (response) => {
              if (!response.ok) {
                throw new Error("Unable to load startup matches");
              }

              return response.json();
            }
          ),
        ]);

        const foundChallenge = challengeData.find(
          (item) =>
            String(item.challenge_id) === String(id)
        );

        setChallenge(foundChallenge);
        setMatches(matchResponse.matches || []);
      } catch (err) {
        console.error(err);
        setError(
          "Unable to load startup matching results."
        );
      } finally {
        setLoading(false);
      }
    }

    loadMatchingData();
  }, [id]);

  const sectors = [
    "All",
    ...Array.from(
      new Set(
        matches
          .map((startup) => startup.sector)
          .filter(Boolean)
      )
    ).sort(),
  ];

  const filteredMatches = matches.filter((startup) => {
    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      !searchText ||
      String(startup.startup_name || "")
        .toLowerCase()
        .includes(searchText) ||
      String(startup.city || "")
        .toLowerCase()
        .includes(searchText) ||
      String(startup.state || "")
        .toLowerCase()
        .includes(searchText) ||
      String(startup.industry || "")
        .toLowerCase()
        .includes(searchText);

    const matchesScore =
      startup.score >= Number(minimumScore);

    const matchesSector =
      sectorFilter === "All" ||
      startup.sector === sectorFilter;

    return (
      matchesSearch &&
      matchesScore &&
      matchesSector
    );
  });

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />

          <p className="mt-3 text-sm text-slate-500">
            Analysing startup matches...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <h2 className="font-semibold text-red-800">
          Matching service unavailable
        </h2>

        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>

        <Link
          to={`/challenges/${id}`}
          className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-indigo-600"
        >
          <ArrowLeft size={16} />
          Back to Challenge
        </Link>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h2 className="text-xl font-bold text-slate-800">
          Challenge not found
        </h2>

        <Link
          to="/challenges"
          className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-600"
        >
          <ArrowLeft size={16} />
          Back to Challenges
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* BACK */}
      <Link
        to={`/challenges/${id}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600"
      >
        <ArrowLeft size={16} />
        Back to Challenge
      </Link>

      {/* HEADER */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-purple-50 p-7">

          <div className="flex flex-col justify-between gap-5 lg:flex-row">

            <div>
              <div className="flex flex-wrap items-center gap-2">

                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                  {challenge.challenge_id}
                </span>

                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
                  Startup Intelligence
                </span>

              </div>

              <h1 className="mt-3 text-2xl font-bold text-slate-900 lg:text-3xl">
                Matching Startups
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                {challenge.title}
              </p>
            </div>

            <div className="flex h-fit items-center gap-3 rounded-xl border border-indigo-100 bg-white px-5 py-4 shadow-sm">

              <div className="rounded-lg bg-indigo-50 p-2.5">
                <Target
                  size={21}
                  className="text-indigo-600"
                />
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Startups Analysed
                </p>

                <p className="mt-1 text-xl font-bold text-slate-800">
                  {matches.length}
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* INTELLIGENCE SUMMARY */}
        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">

          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
            <div className="flex items-center gap-3">
              <Sparkles
                size={19}
                className="text-indigo-600"
              />

              <div>
                <p className="text-xs text-slate-500">
                  Matching Model
                </p>

                <p className="font-semibold text-slate-800">
                  Explainable scoring
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck
                size={19}
                className="text-emerald-600"
              />

              <div>
                <p className="text-xs text-slate-500">
                  Evidence
                </p>

                <p className="font-semibold text-slate-800">
                  Profile completeness tracked
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4">
            <div className="flex items-center gap-3">
              <SlidersHorizontal
                size={19}
                className="text-purple-600"
              />

              <div>
                <p className="text-xs text-slate-500">
                  Scoring Weights
                </p>

                <p className="font-semibold text-slate-800">
                  40 / 30 / 20 / 10
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* FILTER BAR */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

          {/* SEARCH */}
          <div className="relative flex-1">

            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search startup, city, state or industry..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
            />

          </div>

          {/* SECTOR */}
          <select
            value={sectorFilter}
            onChange={(event) =>
              setSectorFilter(event.target.value)
            }
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400"
          >
            {sectors.map((sector) => (
              <option
                key={sector}
                value={sector}
              >
                {sector === "All"
                  ? "All sectors"
                  : sector}
              </option>
            ))}
          </select>

          {/* SCORE */}
          <select
            value={minimumScore}
            onChange={(event) =>
              setMinimumScore(event.target.value)
            }
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400"
          >
            <option value="0">
              Any score
            </option>

            <option value="25">
              25+ score
            </option>

            <option value="40">
              40+ score
            </option>

            <option value="60">
              60+ score
            </option>

            <option value="75">
              75+ score
            </option>
          </select>

        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">

          <span>
            Showing {filteredMatches.length} of{" "}
            {matches.length} startups
          </span>

          <span>
            Ranked by procurement fit
          </span>

        </div>

      </div>

      {/* RESULTS */}
      <div className="space-y-4">

        {filteredMatches.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <Search
              size={30}
              className="mx-auto text-slate-300"
            />

            <h3 className="mt-3 font-semibold text-slate-700">
              No matching startups found
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Try changing the search or filters.
            </p>
          </div>
        ) : (
          filteredMatches.map((startup) => {

            const isExpanded =
              expandedId === startup.startup_id;

            return (
              <div
                key={startup.startup_id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-indigo-200"
              >

                {/* MAIN ROW */}
                <div className="p-5">

                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center">

                    {/* RANK */}
                    <div className="flex items-center gap-4 xl:w-14 xl:flex-col xl:gap-1">

                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                        #{startup.rank}
                      </span>

                      <span className="text-xs text-slate-400 xl:hidden">
                        Rank
                      </span>

                    </div>

                    {/* STARTUP */}
                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-center gap-2">

                        <h2 className="text-lg font-bold text-slate-800">
                          {startup.startup_name}
                        </h2>

                        {startup.rank <= 3 && (
                          <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-600">
                            Top candidate
                          </span>
                        )}

                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">

                        <span className="inline-flex items-center gap-1">
                          <Building2 size={14} />
                          {startup.industry || "Industry unavailable"}
                        </span>

                        <span className="inline-flex items-center gap-1">
                          <MapPin size={14} />
                          {startup.city || "City unavailable"},{" "}
                          {startup.state || "State unavailable"}
                        </span>

                      </div>

                    </div>

                    {/* SCORE */}
                    <div className="flex items-center gap-3">

                      <div
                        className={`rounded-xl border px-4 py-2 text-center ${getScoreClass(
                          startup.score
                        )}`}
                      >
                        <p className="text-2xl font-bold">
                          {startup.score}
                        </p>

                        <p className="text-[10px] font-semibold uppercase tracking-wide">
                          Fit Score
                        </p>
                      </div>

                      <div className="hidden text-right sm:block">

                        <p className="text-[10px] uppercase tracking-wide text-slate-400">
                          Evidence
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-700">
                          {startup.evidence_confidence}%
                        </p>

                      </div>

                    </div>

                    {/* EXPAND */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(
                          isExpanded
                            ? null
                            : startup.startup_id
                        )
                      }
                      className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      {isExpanded ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </button>

                  </div>

                  {/* SCORE BARS */}
                  <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">

                    <ScoreBar
                      label="Technology"
                      score={startup.technology_score}
                      maximum={40}
                    />

                    <ScoreBar
                      label="Capability"
                      score={startup.capability_score}
                      maximum={30}
                    />

                    <ScoreBar
                      label="Sector"
                      score={startup.sector_score}
                      maximum={20}
                    />

                    <ScoreBar
                      label="Location"
                      score={startup.location_score}
                      maximum={10}
                    />

                  </div>

                </div>

                {/* EXPANDED DETAILS */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/70 p-5">

                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

                      {/* WHY MATCH */}
                      <div className="rounded-xl border border-emerald-100 bg-white p-5">

                        <div className="flex items-center gap-2">

                          <div className="rounded-lg bg-emerald-50 p-2">
                            <Target
                              size={17}
                              className="text-emerald-600"
                            />
                          </div>

                          <h3 className="font-semibold text-slate-800">
                            Why this startup?
                          </h3>

                        </div>

                        <div className="mt-4 space-y-3 text-sm">

                          {startup.technology_score > 0 && (
                            <p className="text-slate-600">
                              Technology signals match the
                              challenge requirements.
                            </p>
                          )}

                          {startup.sector_score > 0 && (
                            <p className="text-slate-600">
                              The startup operates in a
                              relevant sector.
                            </p>
                          )}

                          {startup.location_score > 0 && (
                            <p className="text-slate-600">
                              The startup has a location
                              advantage for the pilot.
                            </p>
                          )}

                          {startup.score === 0 && (
                            <p className="text-slate-500">
                              No strong matching signals
                              were identified.
                            </p>
                          )}

                        </div>

                      </div>

                      {/* EVIDENCE */}
                      <div className="rounded-xl border border-indigo-100 bg-white p-5">

                        <div className="flex items-center gap-2">

                          <div className="rounded-lg bg-indigo-50 p-2">
                            <ShieldCheck
                              size={17}
                              className="text-indigo-600"
                            />
                          </div>

                          <h3 className="font-semibold text-slate-800">
                            Evidence quality
                          </h3>

                        </div>

                        <div className="mt-4">

                          <div className="flex items-end justify-between">

                            <span className="text-sm text-slate-500">
                              Profile evidence
                            </span>

                            <span className="text-lg font-bold text-slate-800">
                              {startup.evidence_confidence}%
                            </span>

                          </div>

                          <div className="mt-2 h-2 rounded-full bg-slate-100">

                            <div
                              className="h-2 rounded-full bg-indigo-500"
                              style={{
                                width: `${startup.evidence_confidence}%`,
                              }}
                            />

                          </div>

                          <p className="mt-3 text-xs leading-5 text-slate-400">
                            Missing startup information is
                            not treated as confirmed capability
                            or solution evidence.
                          </p>

                        </div>

                      </div>

                      {/* ACTIONS */}
                      <div className="rounded-xl border border-slate-200 bg-white p-5">

                        <h3 className="font-semibold text-slate-800">
                          Decision actions
                        </h3>

                        <div className="mt-4 space-y-2">

                          <Link
                            to={`/startups/${startup.startup_id}`}
                            className="block rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-indigo-700"
                          >
                            View Startup Profile
                          </Link>

                          <Link
                            to="/applications"
                            className="block rounded-lg border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Review Application
                          </Link>

                        </div>

                      </div>

                    </div>

                  </div>
                )}

              </div>
            );
          })
        )}

      </div>

      {/* FOOTNOTE */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">

        <div className="flex items-start gap-3">

          <ShieldCheck
            size={17}
            className="mt-0.5 shrink-0 text-slate-400"
          />

          <p className="text-xs leading-5 text-slate-500">
            GovInnovate's matching score is a decision-support
            signal, not a procurement award decision. Scores are
            calculated from available startup and challenge
            information. Government officials should verify
            eligibility, technical capability, financial capacity
            and applicable procurement requirements before
            proceeding.
          </p>

        </div>

      </div>

    </div>
  );
}

export default Matching;