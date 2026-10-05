import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStartups } from "../services/api";

function Startups() {
  const [startups, setStartups] = useState([]);
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStartups()
      .then((data) => {
        setStartups(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, []);

  const sectors = [
    "All",
    ...new Set(
      startups
        .map((startup) => startup.sector)
        .filter(Boolean)
    ),
  ];

  const filteredStartups = startups.filter((startup) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      startup.startup_name
        ?.toLowerCase()
        .includes(searchText) ||
      startup.industry
        ?.toLowerCase()
        .includes(searchText) ||
      startup.capabilities
        ?.toLowerCase()
        .includes(searchText);

    const matchesSector =
      sector === "All" ||
      startup.sector === sector;

    return matchesSearch && matchesSector;
  });

  if (loading) {
    return (
      <p className="text-slate-500">
        Loading startups...
      </p>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Startups
        </h1>

        <p className="mt-2 text-slate-500">
          Discover startups that can provide innovative government solutions.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <input
          type="text"
          placeholder="Search startups..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="rounded-lg border bg-white px-4 py-3 outline-none focus:border-indigo-500"
        />

        <select
          value={sector}
          onChange={(event) => setSector(event.target.value)}
          className="rounded-lg border bg-white px-4 py-3 outline-none focus:border-indigo-500"
        >
          {sectors.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <p className="mb-4 text-sm text-slate-500">
        Showing {filteredStartups.length} of {startups.length} startups
      </p>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {filteredStartups.map((startup) => (
          <div
            key={startup.startup_id}
            className="rounded-xl border bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {startup.startup_name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {startup.startup_id}
                </p>
              </div>

              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                {startup.sector}
              </span>
            </div>

            <div className="mt-5 space-y-2 text-sm text-slate-600">
              <p>
                <strong>Location:</strong>{" "}
                {startup.city}, {startup.state}
              </p>

              <p>
                <strong>Industry:</strong>{" "}
                {startup.industry}
              </p>

              <p>
                <strong>Stage:</strong>{" "}
                {startup.stage}
              </p>
            </div>

            <p className="mt-5 text-sm leading-6 text-slate-600">
              {startup.solution_description}
            </p>

            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-slate-700">
                Capabilities
              </p>

              <div className="flex flex-wrap gap-2">
                {String(startup.capabilities)
                  .split(",")
                  .map((capability) => (
                    <span
                      key={capability}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                    >
                      {capability.trim()}
                    </span>
                  ))}
              </div>
            </div>

           <Link
  to={`/startups/${startup.startup_id}`}
  className="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
>
  View Startup
</Link>
          </div>
        ))}
      </div>

      {filteredStartups.length === 0 && (
        <div className="rounded-xl border bg-white p-10 text-center">
          <p className="text-slate-500">
            No startups found.
          </p>
        </div>
      )}
    </div>
  );
}

export default Startups;