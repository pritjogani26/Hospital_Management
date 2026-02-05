import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/axios";
import { Doctor, Gender, Qualification } from "./types";
import queryString from "query-string";
import "./css/ViewPatients.css";

const PAGE_SIZE = 5;
const MAX_FETCH_LIMIT = 1000000;

export default function DoctorListPage() {
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [genders, setGenders] = useState<Gender[]>([]);
  const [qualifications, setQualifications] = useState<Qualification[]>([]);

  const [search, setSearch] = useState("");
  const [genderId, setGenderId] = useState<number | null>(null);
  const [qualificationId, setQualificationId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);

  const debounceRef = useRef<number | null>(null);
  const [pendingSearch, setPendingSearch] = useState("");

  /* ---------------- FETCH DATA ONLY ON LOAD ---------------- */

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true);

        const doctors = await api.get<Doctor[]>("/doctor/list/", {
          params: { limit: MAX_FETCH_LIMIT, offset: 0 },
        });

        const gendersRes = await api.get<Gender[]>("/doctor/genders/");
        const qualRes =
          await api.get<Qualification[]>("/doctor/qualifications/");

        setAllDoctors(doctors.data || []);
        setGenders(gendersRes.data || []);
        setQualifications(qualRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  /* ---------------- SEARCH DEBOUNCE ---------------- */

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      setSearch(pendingSearch);
      setPage(1);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [pendingSearch]);

  /* ---------------- FILTER + SORT ---------------- */

  const filtered = useMemo(() => {
    const searchLower = search.toLowerCase();

    return allDoctors.filter((d) => {
      if (
        searchLower &&
        !(
          d.full_name.toLowerCase().includes(searchLower) ||
          (d.email ?? "").toLowerCase().includes(searchLower)
        )
      )
        return false;

      if (genderId) {
        const g = genders.find((x) => x.gender_id === genderId);
        if (g && d.gender !== g.gender_value) return false;
      }

      if (qualificationId) {
        const q = qualifications.find(
          (x) => x.qualification_id === qualificationId,
        );
        if (q && !d.qualifications?.includes(q.qualification_code))
          return false;
      }

      return true;
    });
  }, [allDoctors, search, genderId, qualificationId, genders, qualifications]);

  /* ---------------- PAGINATION ---------------- */

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const gotoPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  /* ---------------- UI ---------------- */

  if (loading)
    return (
      <div className="loading-container">
        <div className="loading-content">
          <h1>Loading...</h1>
        </div>
      </div>
    );

  return (
    <div className="view-patients-container">
      <div className="view-patients-content">
        <h2>Doctors List</h2>

        {/* SEARCH + FILTER */}
        <div className="search-filter-row">
          <div className="searchBar">
            <input
              type="search"
              placeholder="Search Doctors"
              value={pendingSearch}
              onChange={(e) => setPendingSearch(e.target.value)}
            />
          </div>

          <div className="filter-category">
            <select
              value={genderId ?? ""}
              onChange={(e) =>
                setGenderId(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">All Genders</option>
              {genders.map((g) => (
                <option key={g.gender_id} value={g.gender_id}>
                  {g.gender_value}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-category">
            <select
              value={qualificationId ?? ""}
              onChange={(e) =>
                setQualificationId(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            >
              <option value="">All Qualifications</option>
              {qualifications.map((q) => (
                <option key={q.qualification_id} value={q.qualification_id}>
                  {q.qualification_code}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TABLE */}
        {paginated.length === 0 ? (
          <p className="no-patients">No Doctor Found</p>
        ) : (
          <div className="table-wrapper">
            <table className="patients-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Gender</th>
                  <th>Fee</th>
                  <th>Qualifications</th>
                </tr>
              </thead>

              <tbody>
                {paginated.map((doc) => (
                  <tr key={doc.doctor_id}>
                    <td>{doc.doctor_id}</td>
                    <td>{doc.full_name}</td>
                    <td>{doc.email ?? "N/A"}</td>
                    <td>{doc.gender ?? "N/A"}</td>
                    <td>{doc.consultation_fee ?? "N/A"}</td>
                    <td>{doc.qualifications?.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        <div className="pagination-meta">
          <p>
            Showing {paginated.length} of {total} (Page {page} of {totalPages})
          </p>

          <div className="pagination-controls">
            <button
              className="btn btn-page"
              onClick={() => gotoPage(page - 1)}
              disabled={page <= 1}
            >
              Prev
            </button>

            {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
              let start = Math.max(1, Math.min(page - 2, totalPages - 4));
              if (totalPages <= 5) start = 1;

              const pnum = start + idx;

              return (
                <button
                  key={pnum}
                  className={`btn btn-page ${pnum === page ? "active" : ""}`}
                  onClick={() => gotoPage(pnum)}
                >
                  {pnum}
                </button>
              );
            })}

            <button
              className="btn btn-page"
              onClick={() => gotoPage(page + 1)}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
