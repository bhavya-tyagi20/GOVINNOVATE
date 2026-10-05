import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Award,
  MapPin,
  Building2,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Target,
  Cpu,
  Briefcase,
} from "lucide-react";

import { getMatchingStartups } from "../services/api";


/* =====================================================
   SAFE DISPLAY FUNCTIONS
===================================================== */

function textValue(value, fallback = "Not available") {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => textValue(item, ""))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, item]) => {
        return `${key}: ${textValue(item, "")}`;
      })
      .filter(Boolean)
      .join(" | ");
  }

  return fallback;
}


function numberValue(...values) {
  for (const value of values) {
    const number = Number(value);

    if (!Number.isNaN(number)) {
      return number;
    }
  }

  return 0;
}


function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (
    value !== null &&
    value !== undefined &&
    value !== ""
  ) {
    return [value];
  }

  return [];
}


/* =====================================================
   MAIN PAGE
===================================================== */

export default function MatchingStartups() {

  const { challengeId } = useParams();

  const [challenge, setChallenge] = useState(null);

  const [matches, setMatches] = useState([]);

  const [totalStartups, setTotalStartups] =
    useState(0);

  const [sectorCompatible, setSectorCompatible] =
    useState(0);

  const [technicalEvidenceAvailable, setTechnicalEvidenceAvailable] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  /* ===================================================
     LOAD MATCHES
  =================================================== */

  useEffect(() => {

    async function loadMatches() {

      try {

        setLoading(true);
        setError("");

        console.log(
          "Loading matches for challenge:",
          challengeId
        );


        const data =
          await getMatchingStartups(
            challengeId
          );


        console.log(
          "Matching data:",
          data
        );


        setChallenge(
          data?.challenge || null
        );


        setMatches(
          Array.isArray(data?.matches)
            ? data.matches
            : []
        );


        setTotalStartups(
          Number(
            data?.total_startups || 0
          )
        );

        setSectorCompatible(
          Number(
            data?.sector_compatible_startups || 0
          )
        );

        setTechnicalEvidenceAvailable(
          Number(
            data?.technical_evidence_available || 0
          )
        );


      } catch (err) {

        console.error(
          "Matching page error:",
          err
        );

        setError(
          err?.message ||
          "Unable to load startup matches."
        );

      } finally {

        setLoading(false);

      }

    }


    if (challengeId) {

      loadMatches();

    } else {

      setError(
        "Challenge ID is missing from the URL."
      );

      setLoading(false);

    }

  }, [challengeId]);


  /* ===================================================
     LOADING
  =================================================== */

  if (loading) {

    return (

      <div className="p-8">

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />

            <span className="text-sm text-slate-600">
              Loading startup matches...
            </span>

          </div>

        </div>

      </div>

    );

  }


  /* ===================================================
     ERROR
  =================================================== */

  if (error) {

    return (

      <div className="p-8">

        <Link
          to={`/challenges/${challengeId}`}
          className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600"
        >

          <ArrowLeft size={16} />

          Back to Challenge

        </Link>


        <div className="rounded-xl border border-red-200 bg-white p-8 shadow-sm">

          <div className="flex items-start gap-3">

            <AlertCircle
              size={24}
              className="mt-0.5 shrink-0 text-red-500"
            />

            <div>

              <h2 className="font-semibold text-slate-900">
                Unable to load startup matches
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {textValue(error)}
              </p>

            </div>

          </div>

        </div>

      </div>

    );

  }


  /* ===================================================
     PAGE
  =================================================== */

  return (

    <div className="p-8">

      {/* BACK */}

      <Link
        to={`/challenges/${challengeId}`}
        className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600"
      >

        <ArrowLeft size={16} />

        Back to Challenge

      </Link>


      {/* HEADER */}

      <div className="mb-6">

        <div className="flex flex-wrap items-center gap-2">

          <span className="rounded-md bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">

            {textValue(
              challenge?.challenge_id,
              challengeId
            )}

          </span>


          <span className="rounded-md bg-slate-100 px-3 py-1 text-xs text-slate-600">

            Startup Matching

          </span>

        </div>


        <h1 className="mt-3 text-2xl font-bold text-slate-900">
          Matching Startups
        </h1>


        <p className="mt-1 text-sm text-slate-500">
          Startups ranked according to their
          alignment with the government challenge.
        </p>

      </div>


      {/* CHALLENGE */}

      {challenge && (

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex gap-4">

            <div className="rounded-lg bg-indigo-50 p-3">

              <Building2
                size={24}
                className="text-indigo-600"
              />

            </div>


            <div className="min-w-0">

              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                Government Challenge
              </p>


              <h2 className="mt-1 text-lg font-semibold text-slate-900">

                {textValue(
                  challenge.title
                )}

              </h2>


              <p className="mt-2 text-sm leading-6 text-slate-500">

                {textValue(
                  challenge.problem_statement
                )}

              </p>


              <div className="mt-4 flex flex-wrap gap-2">

                <span className="rounded-md bg-slate-100 px-3 py-1.5 text-xs text-slate-600">

                  Sector:{" "}
                  {textValue(
                    challenge.sector
                  )}

                </span>


                <span className="rounded-md bg-slate-100 px-3 py-1.5 text-xs text-slate-600">

                  Location:{" "}
                  {textValue(
                    challenge.pilot_location
                  )}

                </span>


                <span className="rounded-md bg-slate-100 px-3 py-1.5 text-xs text-slate-600">

                  Duration:{" "}
                  {textValue(
                    challenge.duration_days
                  )}{" "}
                  days

                </span>

              </div>

            </div>

          </div>

        </div>

      )}


      {/* SUMMARY */}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">

        <SummaryCard
          title="Startups Evaluated"
          value={totalStartups}
          text="Verified startup records considered"
        />

        <SummaryCard
          title="Sector-Aligned"
          value={sectorCompatible}
          text="Startups in the challenge sector"
        />

        <SummaryCard
          title="Technical Evidence"
          value={technicalEvidenceAvailable}
          text="Profiles with public capability data"
        />

        <SummaryCard
          title="Top Candidate"
          value="#1"
          text={
            matches.length > 0
              ? textValue(
                  matches[0]?.startup_name,
                  "Startup"
                )
              : "No startup"
          }
        />

      </div>


      {/* RECOMMENDED STARTUP */}

      {matches.length > 0 && (

        <RecommendedStartup
          startup={matches[0]}
        />

      )}


      {/* ALL STARTUPS */}

      <div className="mb-4">

        <h2 className="text-lg font-semibold text-slate-900">
          All Matching Startups
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Compare all candidates considered by
          the matching engine.
        </p>

      </div>


      <div className="space-y-4">

        {matches.map(
          (startup, index) => (

            <StartupCard
              key={
                textValue(
                  startup?.startup_id,
                  `startup-${index}`
                )
              }
              startup={startup}
              rank={index + 1}
            />

          )
        )}


        {matches.length === 0 && (

          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">

            <Target
              size={35}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 font-medium text-slate-700">
              No startup matches found.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              No candidates were returned by
              the matching engine.
            </p>

          </div>

        )}

      </div>

    </div>

  );
}


/* =====================================================
   RECOMMENDED STARTUP
===================================================== */

function RecommendedStartup({
  startup,
}) {

  const score = numberValue(
    startup?.govinnovate_index,
    startup?.score
  );


  const technology = numberValue(
    startup?.technology_score
  );

  const capability = numberValue(
    startup?.capability_score
  );

  const sector = numberValue(
    startup?.sector_score
  );

  const location = numberValue(
    startup?.location_score
  );


  const matched =
    toArray(
      startup?.matched_requirements
    );


  const whyMatch =
    toArray(
      startup?.why_match
    );


  const whyNot =
    toArray(
      startup?.why_not
    );


  return (

    <div className="mb-8 overflow-hidden rounded-xl border-2 border-indigo-200 bg-white shadow-sm">

      {/* HEADER */}

      <div className="bg-indigo-50 p-6">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white">

              <Award size={14} />

              RECOMMENDED STARTUP

            </span>


            <h2 className="mt-3 text-2xl font-bold text-slate-900">

              {textValue(
                startup?.startup_name,
                "Unnamed Startup"
              )}

            </h2>


            <p className="mt-1 text-sm text-slate-600">
              Highest-ranked candidate for this
              government challenge.
            </p>

          </div>


          {/* SCORE */}

          <div className="rounded-xl bg-white px-7 py-5 text-center shadow-sm">

            <p className="text-xs font-medium text-slate-500">
              {textValue(
                startup?.score_type,
                "GovInnovate Index"
              )}
            </p>


            <p className="mt-1 text-4xl font-bold text-indigo-600">

              {score.toFixed(0)}%

            </p>


            <p className="mt-1 text-xs font-semibold text-slate-700">

              {textValue(
                startup?.recommendation,
                "Priority Candidate"
              )}

            </p>

          </div>

        </div>

      </div>


      {/* WHY CHOOSE */}

      <div className="p-6">

        <div className="flex gap-3">

          <div className="rounded-lg bg-green-50 p-2">

            <CheckCircle
              size={20}
              className="text-green-600"
            />

          </div>


          <div>

            <h3 className="text-lg font-semibold text-slate-900">
              Why choose this startup?
            </h3>


            <p className="mt-1 text-sm leading-6 text-slate-500">
              This startup is ranked first because
              it has the strongest overall alignment
              among the available startup records
              for this challenge.
            </p>

          </div>

        </div>


        {/* QUALITIES */}

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">

          <ReasonCard
            icon={Cpu}
            title="Technology"
            text={`${technology.toFixed(
              1
            )} / 40 technology score`}
          />


          <ReasonCard
            icon={Briefcase}
            title="Capability"
            text={`${capability.toFixed(
              1
            )} / 30 capability score`}
          />


          <ReasonCard
            icon={Target}
            title="Sector"
            text={`${sector.toFixed(
              1
            )} / 20 sector score`}
          />

          <ReasonCard
            icon={Briefcase}
            title="Industry"
            text={`${numberValue(
              startup?.industry_score
            ).toFixed(1)} / 10 industry alignment`}
          />

          <ReasonCard
            icon={ShieldCheck}
            title="Source"
            text={
              numberValue(startup?.verified_score) > 0
                ? "Verified SISFS portfolio record"
                : "Source verification unavailable"
            }
          />


          <ReasonCard
            icon={MapPin}
            title="Location"
            text={`${location.toFixed(
              1
            )} / 10 location score`}
          />


          <ReasonCard
            icon={ShieldCheck}
            title="Evidence"
            text={`Evidence confidence: ${numberValue(
              startup?.evidence_confidence
            ).toFixed(1)}%`}
          />


          <ReasonCard
            icon={Building2}
            title="Startup Location"
            text={`${textValue(
              startup?.city,
              "Location unavailable"
            )}${
              startup?.state
                ? `, ${textValue(
                    startup.state
                  )}`
                : ""
            }`}
          />

        </div>


        {/* MATCHED REQUIREMENTS */}

        {matched.length > 0 && (

          <div className="mt-6">

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Matched Requirements
            </p>


            <div className="mt-3 flex flex-wrap gap-2">

              {matched.map(
                (item, index) => (

                  <span
                    key={index}
                    className="rounded-md bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700"
                  >

                    ✓{" "}
                    {textValue(
                      item
                    )}

                  </span>

                )
              )}

            </div>

          </div>

        )}


        {/* WHY MATCH */}

        {whyMatch.length > 0 && (

          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">

            <p className="text-sm font-semibold text-green-800">
              Matching Evidence
            </p>


            <div className="mt-2 space-y-1">

              {whyMatch.map(
                (item, index) => (

                  <p
                    key={index}
                    className="text-sm text-green-700"
                  >

                    ✓{" "}
                    {textValue(
                      item
                    )}

                  </p>

                )
              )}

            </div>

          </div>

        )}


        {/* WHY NOT */}

        {whyNot.length > 0 && (

          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">

            <p className="text-sm font-semibold text-amber-800">
              Gaps / Validation Needed
            </p>


            <div className="mt-2 space-y-1">

              {whyNot.map(
                (item, index) => (

                  <p
                    key={index}
                    className="text-sm text-amber-700"
                  >

                    •{" "}
                    {textValue(
                      item
                    )}

                  </p>

                )
              )}

            </div>

          </div>

        )}


        {/* DECISION */}

        <div className="mt-6 rounded-lg border border-indigo-100 bg-indigo-50 p-4">

          <p className="text-sm font-semibold text-indigo-800">
            Procurement Decision Guidance
          </p>


          <p className="mt-1 text-sm leading-6 text-indigo-700">
            This recommendation supports decision-making
            but does not automatically select the startup.
            The candidate should undergo eligibility
            verification, expert evaluation and pilot
            validation before procurement.
          </p>

        </div>

      </div>

    </div>

  );
}


/* =====================================================
   STARTUP CARD
===================================================== */

function StartupCard({
  startup,
  rank,
}) {

  const score = numberValue(
    startup?.govinnovate_index,
    startup?.score
  );


  const matched =
    toArray(
      startup?.matched_requirements
    );


  const whyNot =
    toArray(
      startup?.why_not
    );


  return (

    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">

        {/* STARTUP */}

        <div className="flex gap-4">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600">

            #{rank}

          </div>


          <div className="min-w-0">

            <h3 className="text-lg font-semibold text-slate-900">

              {textValue(
                startup?.startup_name,
                "Unnamed Startup"
              )}

            </h3>


            <p className="mt-1 text-sm text-slate-500">

              {textValue(
                startup?.industry,
                "Industry not publicly listed"
              )}

            </p>


            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">

              <span className="flex items-center gap-1">

                <MapPin size={13} />

                {textValue(
                  startup?.city,
                  "Location unavailable"
                )}

                {startup?.state
                  ? `, ${textValue(
                      startup.state
                    )}`
                  : ""}

              </span>


              <span>

                Sector:{" "}
                {textValue(
                  startup?.sector,
                  "Not publicly listed"
                )}

              </span>

            </div>

          </div>

        </div>


        {/* SCORE */}

        <div className="rounded-lg bg-indigo-50 px-6 py-4 text-center">

          <p className="text-xs text-slate-500">
            {textValue(
              startup?.score_type,
              "GovInnovate Index"
            )}
          </p>


          <p className="text-3xl font-bold text-indigo-600">

            {score.toFixed(0)}%

          </p>


          <p className="text-xs font-semibold text-slate-700">

            {textValue(
              startup?.recommendation,
              "Not Assessed"
            )}

          </p>

        </div>

      </div>


      {/* SCORE BREAKDOWN */}

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">

        <ScoreBox
          title="Technology"
          value={startup?.technology_score}
          max={40}
        />


        <ScoreBox
          title="Capability"
          value={startup?.capability_score}
          max={30}
        />


        <ScoreBox
          title="Sector"
          value={startup?.sector_score}
          max={20}
        />


        <ScoreBox
          title="Location"
          value={startup?.location_score}
          max={10}
        />

      </div>


      {/* EVIDENCE */}

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">

        <InfoBox
          title="Evidence Confidence"
          value={`${numberValue(
            startup?.evidence_confidence
          ).toFixed(1)}%`}
        />


        <InfoBox
          title="Evidence Level"
          value={textValue(
            startup?.evidence_level,
            "Not Assessed"
          )}
        />


        <InfoBox
          title="Procurement Readiness"
          value={textValue(
            startup?.procurement_readiness?.level,
            "Not Assessed"
          )}
        />

        <InfoBox
          title="Technical Evidence"
          value={textValue(
            startup?.technical_match_status,
            "Not Assessed"
          )}
        />

      </div>


      {/* MATCHED */}

      {matched.length > 0 && (

        <div className="mt-4">

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Matched Requirements
          </p>


          <div className="mt-2 flex flex-wrap gap-2">

            {matched.map(
              (item, index) => (

                <span
                  key={index}
                  className="rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700"
                >

                  ✓{" "}
                  {textValue(
                    item
                  )}

                </span>

              )
            )}

          </div>

        </div>

      )}


      {/* GAPS */}

      {whyNot.length > 0 && (

        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">

          <p className="text-sm font-semibold text-amber-800">
            Gaps / Validation Needed
          </p>


          <div className="mt-2 space-y-1">

            {whyNot
              .slice(0, 4)
              .map(
                (item, index) => (

                  <p
                    key={index}
                    className="text-xs text-amber-700"
                  >

                    •{" "}
                    {textValue(
                      item
                    )}

                  </p>

                )
              )}

          </div>

        </div>

      )}

    </div>

  );
}


/* =====================================================
   REASON CARD
===================================================== */

function ReasonCard({
  icon: Icon,
  title,
  text,
}) {

  return (

    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">

      <div className="flex items-start gap-3">

        <div className="rounded-lg bg-white p-2 shadow-sm">

          <Icon
            size={17}
            className="text-indigo-600"
          />

        </div>


        <div>

          <p className="text-sm font-semibold text-slate-800">
            {textValue(title)}
          </p>


          <p className="mt-1 text-xs leading-5 text-slate-500">
            {textValue(text)}
          </p>

        </div>

      </div>

    </div>

  );
}


/* =====================================================
   SUMMARY CARD
===================================================== */

function SummaryCard({
  title,
  value,
  text,
}) {

  return (

    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

      <p className="text-sm text-slate-500">
        {textValue(title)}
      </p>


      <p className="mt-1 text-2xl font-bold text-slate-900">
        {textValue(value)}
      </p>


      <p className="mt-1 truncate text-xs text-slate-400">
        {textValue(text)}
      </p>

    </div>

  );
}


/* =====================================================
   SCORE BOX
===================================================== */

function ScoreBox({
  title,
  value,
  max,
}) {

  const score =
    numberValue(value);


  const percentage =
    max > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (score / max) * 100
          )
        )
      : 0;


  return (

    <div className="rounded-lg border border-slate-200 p-3">

      <p className="text-xs text-slate-500">
        {textValue(title)}
      </p>


      <p className="mt-1 text-sm font-semibold text-slate-900">

        {score.toFixed(1)}
        {" / "}
        {max}

      </p>


      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">

        <div
          className="h-full rounded-full bg-indigo-500"
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

    </div>

  );
}


/* =====================================================
   INFO BOX
===================================================== */

function InfoBox({
  title,
  value,
}) {

  return (

    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">

      <p className="text-xs text-slate-500">
        {textValue(title)}
      </p>


      <p className="mt-1 text-sm font-semibold text-slate-800">
        {textValue(value)}
      </p>

    </div>

  );

}