// Hospital_Management\frontend\src\pages\login.tsx

import React, { useEffect } from "react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import "./css/ViewPatientDetails.css";
import { useAuth } from "../components/UserAuthContext";
import ToastService from "../utils/toastService";
import { GoogleLogin } from "@react-oauth/google";

const LoginUserSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
  password: Yup.string()
    .min(5, "Minimum 5 Characters")
    .required("Password is required"),
});

type UserFormValues = {
  email: string;
  password: string;
};

const defaultValues: UserFormValues = {
  email: "",
  password: "",
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const { login, googleLogin, user } = useAuth();

  useEffect(() => {
    if (user) {
      const from =
        (location.state as any)?.from?.pathname || "/patients/details";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleGoogleLogin = async (credential: string) => {
    try {
      setError(null);
      await googleLogin(credential);
      const from =
        (location.state as any)?.from?.pathname || "/patients/details";
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ?? "Google sign-in failed. Please try again.";
      setError(msg);
      ToastService.error(msg);
    }
  };
  const handleSubmit = async (values: UserFormValues) => {
    try {
      setError(null);
      await login(values.email, values.password);
      const from =
        (location.state as any)?.from?.pathname || "/patients/details";
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Invalid email or password";
      setError(msg);
      ToastService.error(msg);
    }
  };

  return (
    <>
      <div className="patient-details-container">
        <div className="patient-details-card">
          {error && <div className="error-message">{error}</div>}
          <h2>Login User</h2>
          <div className="table-wrapper">
            <Formik
              initialValues={defaultValues}
              validationSchema={LoginUserSchema}
              enableReinitialize
              onSubmit={handleSubmit}
            >
              {({ isSubmitting, setFieldValue }) => (
                <Form className="update-patient-form">
                  <table className="details-table">
                    <tbody>
                      <FormRow label="Email">
                        <Field
                          id="email"
                          name="email"
                          placeholder="Enter Email Address"
                          type="email"
                        />
                        <ErrorMessage
                          name="email"
                          component="div"
                          className="error-message"
                        />
                      </FormRow>

                      <FormRow label="Password">
                        <Field
                          id="password"
                          name="password"
                          placeholder="Enter Password"
                          type="password"
                        />
                        <ErrorMessage
                          name="password"
                          component="div"
                          className="error-message"
                        />
                      </FormRow>
                    </tbody>
                  </table>

                  <div className="button-group" style={{ marginTop: 18 }}>
                    <button
                      type="button"
                      className="btn btn-back"
                      onClick={() => navigate(-1)}
                    >
                      Back
                    </button>

                    <button
                      type="submit"
                      className="btn btn-update"
                      disabled={isSubmitting}
                    >
                      Submit
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
            <GoogleLogin
              onSuccess={(cred) => handleGoogleLogin(cred.credential!)}
              onError={() => ToastService.error("Google login failed")}
            />
          </div>
        </div>
      </div>
    </>
  );
};

const FormRow: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <tr>
    <th>
      <label>{label}:</label>
    </th>
    <td>{children}</td>
  </tr>
);

const PageMessage: React.FC<{ label: string }> = ({ label }) => (
  <div className="loading-container">
    <div className="loading-content">
      <h1>{label}</h1>
    </div>
  </div>
);
export default Login;
