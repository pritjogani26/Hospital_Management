// Hospital_Management\frontend\src\pages\register.tsx

import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import "./css/ViewPatientDetails.css";
import { useAuth } from "../components/UserAuthContext";
import ToastService from "../utils/toastService";

const RegisterUserSchema = Yup.object({
  first_name: Yup.string()
    .min(2, "Minimum 2 Characters")
    .required("First Name is required"),
  last_name: Yup.string()
    .min(2, "Minimum 2 Characters")
    .required("Last Name is required"),
  email: Yup.string()
    // .string("Invalid email format")
    .required("Email is required"),
  mobile: Yup.string()
    .matches(/^[6-9]\d{9}$/, "Invalid mobile number")
    .required("Mobile number is required"),
  password: Yup.string()
    .min(5, "Minimum 5 Characters")
    .required("Password is required"),
  confirm_password: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm Password is required"),
  profile_image: Yup.mixed().nullable(),
  role: Yup.number()
    .oneOf([1, 2, 3, 4, 5], "Invalid Role")
    .required("Role is required"),
});

type UserFormValues = {
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  password: string;
  confirm_password?: string;
  profile_image?: File | null;
  role: string;
};

const defaultValues: UserFormValues = {
  first_name: "",
  last_name: "",
  email: "",
  mobile: "",
  password: "",
  confirm_password: "",
  role: "",
  profile_image: null as File | null,
};

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: typeof defaultValues) => {
    try {
      const formData = new FormData();

      Object.entries(values).forEach(([key, value]) => {
        if (value && key !== "confirm_password") {
          formData.append(key, value);
        }
      });

      await register(formData);
    } catch (err: any) {
      ToastService.error(err?.response?.data?.error ?? "Registration failed");
    }
  };

  return (
    <>
      <div className="patient-details-container">
        <div className="patient-details-card">
          {error && <div className="error-message">{error}</div>}
          <h2>Register User</h2>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Profile"
              style={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                objectFit: "cover",
                marginBottom: 10,
              }}
            />
          )}

          <div className="table-wrapper">
            <Formik
              initialValues={defaultValues}
              validationSchema={RegisterUserSchema}
              enableReinitialize
              onSubmit={handleSubmit}
            >
              {({ isSubmitting, setFieldValue }) => (
                <Form className="update-patient-form">
                  <table className="details-table">
                    <tbody>
                      <FormRow label="First Name">
                        <Field
                          id="first_name"
                          name="first_name"
                          placeholder="Enter First Name"
                          type="text"
                        />
                        <ErrorMessage
                          name="first_name"
                          component="div"
                          className="error-message"
                        />
                      </FormRow>
                      <FormRow label="Last Name">
                        <Field
                          id="last_name"
                          name="last_name"
                          placeholder="Enter Last Name"
                          type="text"
                        />
                        <ErrorMessage
                          name="last_name"
                          component="div"
                          className="error-message"
                        />
                      </FormRow>

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

                      <FormRow label="Mobile">
                        <Field
                          id="mobile"
                          name="mobile"
                          placeholder="Enter Mobile Number"
                          type="tel"
                        />
                        <ErrorMessage
                          name="mobile"
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

                      <FormRow label="Confirm Password">
                        <Field
                          id="confirm_password"
                          name="confirm_password"
                          placeholder="Confirm Password"
                          type="password"
                        />
                        <ErrorMessage
                          name="confirm_password"
                          component="div"
                          className="error-message"
                        />
                      </FormRow>

                      <FormRow label="Role">
                        <Field as="select" id="role" name="role">
                          <option value="">Select</option>
                          <option value="1">Doctor</option>
                          <option value="2">Admin</option>
                          <option value="3">Staff</option>
                          {/* {[
                            "A+",
                            "A-",
                            "B+",
                            "B-",
                            "O+",
                            "O-",
                            "AB+",
                            "AB-",
                          ].map((bg) => (
                            <option key={bg} value={bg}>
                              {bg}
                            </option>
                          ))} */}
                        </Field>
                      </FormRow>

                      <FormRow label="Profile Image">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e: any) => {
                            const file = e.target.files?.[0];
                            setFieldValue("profile_image", file);

                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () =>
                                setPreviewUrl(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
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
export default Register;
