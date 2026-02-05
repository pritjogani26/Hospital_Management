// Hospital_Management\frontend\src\pages\AddPatient.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./css/ViewPatientDetails.css";
import { Formik, Field, ErrorMessage, Form } from "formik";
import * as Yup from "yup";
import ToastService from "../utils/toastService";

const NewPatientSchema = Yup.object({
  patient_name: Yup.string()
    .required("Patient name is required.")
    .min(2, "Minimum 2 Characters"),

  dob: Yup.date()
    .required("Date of Birth is required")
    .max(new Date(), "DOB cannot be in future"),

  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),

  mobile: Yup.string()
    .matches(/^[6-9]\d{9}$/, "Invalid mobile number")
    .required("Mobile number is required"),

  gender: Yup.string().required("Gender is required"),

  profile_image: Yup.mixed().nullable(),

  blood_group: Yup.string().nullable(),

  address: Yup.string().nullable(),
});

const initialValues = {
  patient_name: "",
  dob: "",
  email: "",
  mobile: "",
  gender: "",
  blood_group: "",
  profile_image: null,
  address: "",
  created_by: "Prit",
};

// type NewPatient = {
//   patient_name: string;
//   dob: string;
//   email: string;
//   mobile: string;
//   gender: string;
//   blood_group: string;
//   profile_image: File;
//   address: string;
//   created_by: string;
// };

const AddPatient = () => {
  const navigate = useNavigate();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const submitHandler = async (
    values: any,
    setSubmitting: (isSubmitting: boolean) => void,
    setStatus: (status?: string) => void,
  ) => {
    try {
      setSubmitting(true);
      const formData = new FormData();

      Object.keys(values).forEach((key) => {
        if (values[key] !== null && values[key] !== "") {
          formData.append(key, values[key]);
        }
      });
      await api.post("/patients/add/", formData, {
        headers: { "content-type": "multipart/form-data" },
      });
      ToastService.success("Patient Add successfully.");
      navigate("/patients/details");
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.error || "Failed to add patient";
      setStatus(msg);
      ToastService.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="patient-details-container">
      <div className="patient-details-card">
        <h2>Add New Patient</h2>

        <div className="table-wrapper">
          <Formik
            initialValues={initialValues}
            validationSchema={NewPatientSchema}
            onSubmit={(values, actions) =>
              submitHandler(values, actions.setSubmitting, actions.setStatus)
            }
          >
            {({ isSubmitting, status, setFieldValue }) => (
              <Form
                className="update-patient-form"
                aria-label="Add patient form"
              >
                {status && (
                  <div className="error-content" style={{ marginBottom: 15 }}>
                    <h1 style={{ fontSize: 16 }}>{status}</h1>
                  </div>
                )}
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      marginBottom: 10,
                    }}
                  />
                )}
                <table className="details-table" role="presentation">
                  <tbody>
                    <tr>
                      <th>
                        <label htmlFor="patient_name">Name:</label>
                      </th>
                      <td>
                        <Field
                          id="patient_name"
                          name="patient_name"
                          type="text"
                        />
                        <ErrorMessage
                          name="patient_name"
                          component="div"
                          className="error-message"
                        />
                      </td>
                    </tr>

                    <tr>
                      <th>
                        <label htmlFor="dob">Date of Birth:</label>
                      </th>
                      <td>
                        <Field id="dob" name="dob" type="date" />
                        <ErrorMessage
                          name="dob"
                          component="div"
                          className="error-message"
                        />
                      </td>
                    </tr>

                    <tr>
                      <th>
                        <label htmlFor="email">Email:</label>
                      </th>
                      <td>
                        <Field id="email" name="email" type="email" />
                        <ErrorMessage
                          name="email"
                          component="div"
                          className="error-message"
                        />
                      </td>
                    </tr>

                    <tr>
                      <th>
                        <label htmlFor="mobile">Mobile:</label>
                      </th>
                      <td>
                        <Field id="mobile" name="mobile" type="tel" />
                        <ErrorMessage
                          name="mobile"
                          component="div"
                          className="error-message"
                        />
                      </td>
                    </tr>

                    <tr>
                      <th>Gender:</th>
                      <td>
                        <label>
                          <Field type="radio" name="gender" value="M" />
                          Male
                        </label>
                        <label style={{ marginLeft: 10 }}>
                          <Field type="radio" name="gender" value="F" />
                          Female
                        </label>
                        <ErrorMessage
                          name="gender"
                          component="div"
                          className="error-message"
                        />
                      </td>
                    </tr>

                    <tr>
                      <th>
                        <label htmlFor="blood_group">Blood Group:</label>
                      </th>
                      <td>
                        <Field as="select" id="blood_group" name="blood_group">
                          <option value="">Select</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                        </Field>
                      </td>
                    </tr>
                    <tr>
                      <th>
                        <label htmlFor="profile_image">Profile Image:</label>
                      </th>
                      <td>
                        <input
                          type="file"
                          accept="image/*"
                          id="profile_image"
                          name="profile_image"
                          onChange={(e: any) => {
                            const file = e.target.files?.[0];
                            setFieldValue("profile_image", file);
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setPreviewUrl(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            } else {
                              setPreviewUrl(null);
                            }
                          }}
                        />
                      </td>
                    </tr>

                    <tr>
                      <th>
                        <label htmlFor="address">Address:</label>
                      </th>
                      <td>
                        <Field
                          as="textarea"
                          id="address"
                          name="address"
                          rows={3}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="button-group" style={{ marginTop: 18 }}>
                  <button
                    type="button"
                    className="btn btn-back"
                    onClick={() => navigate(-1)}
                    disabled={isSubmitting}
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    className="btn btn-update"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save"}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default AddPatient;
