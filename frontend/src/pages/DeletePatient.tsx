// src/pages/DeletePatient.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../api/axios";
import ConfirmPopup from "../components/ConfirmPopup";
import ToastService from "../utils/toastService";
import { useAuth } from "../components/UserAuthContext";

const DeletePatient: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientId } = useParams<{ patientId: string }>();
  const { user } = useAuth();

  const [deleting, setDeleting] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (!patientId || isNaN(Number(patientId))) {
      ToastService.error("Invalid patient id");
      navigate("patients/details");
      return;
    }
    setShowPopup(true);
  }, [patientId, navigate]);

  const handleConfirm = async (reason: string) => {
    try {
      setDeleting(true);
      await api.delete(`/patients/delete/${patientId}`, {
        data: { reason, deleteBy: String(user?.user_id) },
      });

      ToastService.success("Patient deleted successfully.");
      navigate("/patients/details", { replace: true });
    } catch (err: any) {
      ToastService.error(
        err?.response?.data?.error || "Error while deleting patient",
      );
      ToastService.error(err?.response?.data?.error);
      setDeleting(false);
      setShowPopup(false);
      navigate("/patients/details");
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <>
      {showPopup && (
        <ConfirmPopup
          msg="delete"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          submitting={deleting}
        />
      )}
    </>
  );
};

export default DeletePatient;
