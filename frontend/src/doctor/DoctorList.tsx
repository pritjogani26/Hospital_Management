import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/axios";
import "./css/ViewPatients.css";
import ToastService from "../utils/toastService";

type DoctorListProps = {
  doctor_id: number;
  full_name: string;
  email: string | null;
  gender: string | null;
  qualifications: string | null;
  consultation_fee: string | null;
};

type GenderProps = {
    gender_id : number;
    genderva
}

const debounce = (func: Function, delay: number) => {
  let timeout: any;

  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

const ViewPatients = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<DoctorListProps[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [genders, setGenders] = useState<string>();
  const [qualifications, setQualifications] = useState<string>("all");
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(5);
  const [totalCount, setTotalCount] = useState<number>(0);

  const debounceRef = useRef<
    ((search: string, gender: string, qualifications: string) => void) | null
  >(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const fetchDoctorsList = async () => {
    try {
      console.log("Fetching Doctore details.");
      const res = await api.get("/doctor/display/");
      setDoctors(res.data.data || []);
    } catch (error: any) {
      const msg = error?.response?.data?.error ?? "Failed to load doctors";
      console.log(msg);
      ToastService.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const appy_filter = async (s: string, g: number, q: number) => {

  }

  useEffect(() => {
    setLoading(true);
    fetchDoctorsList();
  }, []);

  useEffect(() => {
    debounceRef.current = debounce((s: string, g: string, q: string ) => {
      setPage(1);
      appy_filter(s, g, q);
    }, 500);
  }, []);

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debounceRef.current?.(value, category);
  };

  const onCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    console.log("Category changed to:", value);
    setCategory(value);
    debounceRef.current?.(query, value);
  };

  const gotoPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    fetchPatientsList(query, category, p);
  };

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
        <h2>Patients List</h2>
        <div className="search-filter-row">
          <div className="searchBar">
            <input
              type="search"
              placeholder="Search Patients By ID, Name, or Email"
              name="searchValue"
              id="searchValue"
              value={query}
              onChange={onSearchChange}
            />
          </div>
          <div className="filter-category">
            <select
              name="categoryValue"
              id="categoryValue"
              value={category}
              onChange={onCategoryChange}
            >
              <option value="all" defaultChecked>
                All
              </option>
              <option value="A">Active</option>
              <option value="D">Deleted</option>
            </select>
          </div>
        </div>

        {patients.length === 0 ? (
          <p className="no-patients">No Patient Found</p>
        ) : (
          <div className="table-wrapper">
            <table className="patients-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Gender</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.patient_id}>
                    <td>{patient.patient_id}</td>
                    <td>{patient.patient_name}</td>
                    <td>{patient.email ?? "N/A"}</td>
                    <td>{patient.mobile ?? "N/A"}</td>
                    <td>
                      {patient.gender === "M"
                        ? "Male"
                        : patient.gender === "F"
                          ? "Female"
                          : (patient.gender ?? "N/A")}
                    </td>
                    <td>
                      <div className="patient-actions">
                        <button
                          type="button"
                          className="btn btn-details"
                          onClick={() =>
                            navigate(`/patients/details/${patient.patient_id}`)
                          }
                        >
                          Details
                        </button>
                        {(patient.status === "A" && (
                          <>
                            <button
                              type="button"
                              className="btn btn-update1"
                              onClick={() =>
                                navigate(
                                  `/patients/update/${patient.patient_id}`,
                                )
                              }
                            >
                              Update
                            </button>
                            <button
                              type="button"
                              className="btn btn-delete1"
                              onClick={() =>
                                navigate(
                                  `/patients/delete/${patient.patient_id}`,
                                )
                              }
                            >
                              Delete
                            </button>
                          </>
                        )) || (
                          <>
                            <button
                              type="button"
                              className="btn btn-update1"
                              disabled
                              onClick={() =>
                                navigate(
                                  `/patients/update/${patient.patient_id}`,
                                )
                              }
                            >
                              Update
                            </button>
                            <button
                              type="button"
                              className="btn btn-delete1"
                              disabled
                              onClick={() =>
                                navigate(
                                  `/patients/delete/${patient.patient_id}`,
                                )
                              }
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="pagination-meta">
          <p>
            Showing {patients.length} of {totalCount} (Page {page} of{" "}
            {totalPages})
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
              if (totalPages <= 5) {
                start = 1;
              }
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
};

export default ViewPatients;
