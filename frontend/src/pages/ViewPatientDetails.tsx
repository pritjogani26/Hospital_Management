// src/pages/ViewPatientDetails.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../api/axios";
import "./css/ViewPatientDetails.css";
import ToastService from "../utils/toastService";

type PatientDetails = {
  patient_id: number;
  patient_name: string;
  dob: string | null;
  email: string | null;
  mobile: string | null;
  gender: string | null;
  blood_group: string | null;
  address: string | null;
  profile_image: string | null;
  status: string | null;
  created_at: string | null;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
  update_reason: string | null;
};

const API_BASE_URL = "http://localhost:8000";
const DEFAULT_IMAGE = `${API_BASE_URL}/media/defaults/patient.png`;

const getImageUrl = (path: string | null) => {
  if (!path) return DEFAULT_IMAGE;
  return path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
};

const ViewPatientDetails: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchPatient = useCallback(async () => {
    try {
      const response = await api.get(`/patients/display/${patientId}`);
      const data = response.data.data;
      setPatient(data);
      setPreviewUrl(getImageUrl(data.profile_image));
    } catch (err: any) {
      ToastService.error(
        err?.response?.data?.error || "Failed to load patient details.",
      );
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [patientId, navigate]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  if (loading) return <PageMessage label="Loading..." />;
  if (!patient) return <PageMessage label="No patient details found." />;

  return (
    <div className="patient-details-container">
      <div className="patient-details-card">
        <h2>Patient Details</h2>

        <img
          src={previewUrl || DEFAULT_IMAGE}
          alt="Patient"
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            objectFit: "cover",
            marginBottom: 10,
          }}
        />

        <div className="table-wrapper">
          <table className="details-table">
            <tbody>
              <DetailRow label="Patient ID" value={patient.patient_id} />
              <DetailRow label="Name" value={patient.patient_name} />
              <DetailRow label="Date of Birth" value={patient.dob} />
              <DetailRow label="Email" value={patient.email} />
              <DetailRow label="Mobile" value={patient.mobile} />

              <DetailRow
                label="Gender"
                value={
                  patient.gender === "M"
                    ? "Male"
                    : patient.gender === "F"
                      ? "Female"
                      : patient.gender
                }
              />

              <DetailRow label="Blood Group" value={patient.blood_group} />
              <DetailRow label="Address" value={patient.address} />

              <DetailRow label="Created At" value={patient.created_at} />
              <DetailRow label="Created By" value={patient.created_by} />

              {patient.updated_at && (
                <DetailRow
                  label="Updated At"
                  value={new Date(patient.updated_at).toLocaleString()}
                />
              )}
              {patient.updated_by && (
                <DetailRow label="Updated By" value={patient.updated_by} />
              )}
              {patient.update_reason && (
                <DetailRow
                  label="Update Reason"
                  value={patient.update_reason}
                />
              )}
            </tbody>
          </table>
        </div>

        <div className="button-group">
          <button className="btn btn-back" onClick={() => navigate(-1)}>
            Back
          </button>

          {patient.status === "A" && (
            <>
              <button
                className="btn btn-update"
                onClick={() =>
                  navigate(`/patients/update/${patient.patient_id}`)
                }
              >
                Update
              </button>

              <button
                className="btn btn-delete"
                onClick={() =>
                  navigate(`/patients/delete/${patient.patient_id}`)
                }
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const DetailRow: React.FC<{ label: string; value: any }> = ({
  label,
  value,
}) => (
  <tr>
    <th>{label}:</th>
    <td>{value || "-"}</td>
  </tr>
);

const PageMessage: React.FC<{ label: string }> = ({ label }) => (
  <div className="loading-container">
    <div className="loading-content">
      <h1>{label}</h1>
    </div>
  </div>
);

export default ViewPatientDetails;
