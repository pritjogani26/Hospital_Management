// Hospital_Management\frontend\src\users\EmailVerification.tsx
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";
import ToastService from "../utils/toastService";

const EmailVerification = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Token is Required. It can not be Empty.");
      ToastService.error("Verification token missing.");
      return;
    }
    console.log("EmailVerification is Started.");
    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    setError(null);
    setVerifying(true);
    try {
      await api.put(`/user/verify-email/?token=${token}`);
      ToastService.success("Email verified successfully. Please login.");
      navigate("/user/login/");
    } catch (error: any) {
      console.log(error);
      const msg = error?.response?.data?.error || "Error while verifying";
      setError(msg);
      ToastService.error(msg);
      setVerifying(false);
    }
  };

  if (verifying)
    return (
      <div className="loading-container">
        <div className="loading-content">
          <h1>Verifying User...</h1>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="error-container">
        <div className="error-content">
          <h1>{error}</h1>
        </div>
      </div>
    );
  return null;
};

export default EmailVerification;