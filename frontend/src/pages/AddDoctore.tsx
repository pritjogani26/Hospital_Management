// src/pages/UpdatePatient.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Field, ErrorMessage, Form } from "formik";
import * as Yup from "yup";
import api from "../api/axios";
import "./css/ViewPatientDetails.css";
import ConfirmPopup from "../components/ConfirmPopup";
import ToastService from "../utils/toastService";
import { useAuth } from "../components/UserAuthContext";

interface PatientFormValues {
  patient_name: string;
  dob: string;
  email: string;
  mobile: string;
  gender: string;
  blood_group: string;
  address: string;
  profile_image: File | null;
}

const EMPTY_FORM: PatientFormValues = {
  patient_name: "",
  dob: "",
  email: "",
  mobile: "",
  gender: "",
  blood_group: "",
  address: "",
  profile_image: null,
};

const SUPPORT_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg"];

const PATIENT_SCHEMA = Yup.object({
  patient_name: Yup.string()
    .trim()
    .min(1, "The contact name needs to be at least 1 char")
    .max(512, "The contact name cannot exceed 512 char")
    .required("The contact Name is required"),
  dob: Yup.date()
    .required("DOB is required")
    .max(new Date(), "DOB cannot be in future"),
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
  mobile: Yup.string()
    .matches(/^[6-9]\d{9}$/, "Invalid mobile number")
    .required("Mobile number is required"),
  gender: Yup.string().required("Gender is required"),
  blood_group: Yup.string().nullable(),
  address: Yup.string().nullable(),
  profile_image: Yup.mixed<File>()
    .nullable()
    .test("fileType", "Only PNG, JPG, or JPEG images are allowed", (file) => {
      if (!file) return true;
      return SUPPORT_IMAGE_TYPES.includes(file.type);
    })
    .test("fileSize", "Image size must be less than 2MB", (file) => {
      if (!file) return true;
      return file.size <= 2 * 1024 * 1024;
    }),
});

const API_BASE_URL = "http://localhost:8000";
const DEFAULT_IMAGE = `${API_BASE_URL}/media/defaults/patient.png`;

const getImageUrl = (path: string | null) => {
  if (!path) return DEFAULT_IMAGE;
  return path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
};

const buildFormData = (
  values: PatientFormValues,
  meta: Record<string, string>,
) => {
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== null && value !== "") {
      formData.append(key, value);
    }
  });
  Object.entries(meta).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
};

const UpdatePatient: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const isEditMode = Boolean(patientId);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [initialValues, setInitialValues] =
    useState<PatientFormValues | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [cachedValues, setCachedValues] =
    useState<PatientFormValues | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPatient = useCallback(async () => {
    try {
      if (!isEditMode) {
        setInitialValues(EMPTY_FORM);
        return;
      }

      const res = await api.get(`/patients/display/${patientId}`);
      const data = res.data.data;

      setInitialValues({
        patient_name: data.patient_name || "",
        dob: data.dob?.slice(0, 10) || "",
        email: data.email || "",
        mobile: data.mobile || "",
        gender: data.gender?.toUpperCase() || "",
        blood_group: data.blood_group || "",
        address: data.address || "",
        profile_image: null,
      });

      setPreviewUrl(getImageUrl(data.profile_image));
    } catch (err: any) {
      ToastService.error(
        err?.response?.data?.error || "Failed to fetch patient details.",
      );
    } finally {
      setLoading(false);
    }
  }, [patientId, isEditMode]);

  useEffect(() => {
    loadPatient();
  }, [loadPatient]);

  const handleConfirmUpdate = async (reason: string) => {
    if (!cachedValues) return;

    try {
      setSaving(true);
      const formData = buildFormData(cachedValues, {
        updated_by: String(user?.user_id),
        update_reason: reason,
      });

      await api.put(`/patients/update/${patientId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      ToastService.success("Patient updated successfully.");
      navigate("/patients/details");
    } catch (err: any) {
      ToastService.error(
        err?.response?.data?.error || "Failed to update patient.",
      );
    } finally {
      setSaving(false);
      setShowPopup(false);
    }
  };

  const handleSubmit = async (values: PatientFormValues) => {
    if (isEditMode) {
      setCachedValues(values);
      setShowPopup(true);
      return;
    }

    try {
      const formData = buildFormData(values, { created_by: String(user?.user_id) });
      await api.post("/patients/add/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      ToastService.success("Patient created successfully.");
      navigate("/patients/details");
    } catch (err: any) {
      ToastService.error(
        err?.response?.data?.error || "Failed to create patient.",
      );
    }
  };

  if (loading) return <PageMessage label="Loading..." />;
  if (saving) return <PageMessage label="Submitting the data..." />;
  if (!initialValues) return <PageMessage label="No patient details found." />;
  return (
    <>
      <div className="patient-details-container">
        <div className="patient-details-card">
          <h2>{isEditMode ? "Update Patient" : "Add New Patient"}</h2>

          <img
            src={previewUrl || DEFAULT_IMAGE}
            alt="Profile"
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              objectFit: "cover",
              marginBottom: 10,
            }}
          />

          <div className="table-wrapper">
            <Formik
              initialValues={initialValues}
              validationSchema={PATIENT_SCHEMA}
              enableReinitialize
              onSubmit={handleSubmit}
            >
              {({ isSubmitting, setFieldValue }) => (
                <Form className="update-patient-form">
                  <table className="details-table">
                    <tbody>
                      {isEditMode && (
                        <tr>
                          <th>Patient ID:</th>
                          <td>{patientId}</td>
                        </tr>
                      )}

                      <FormRow label="Name">
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
                      </FormRow>

                      <FormRow label="Date of Birth">
                        <Field id="dob" name="dob" type="date" />
                        <ErrorMessage
                          name="dob"
                          component="div"
                          className="error-message"
                        />
                      </FormRow>

                      <FormRow label="Email">
                        <Field id="email" name="email" type="email" />
                        <ErrorMessage
                          name="email"
                          component="div"
                          className="error-message"
                        />
                      </FormRow>

                      <FormRow label="Mobile">
                        <Field id="mobile" name="mobile" type="tel" />
                        <ErrorMessage
                          name="mobile"
                          component="div"
                          className="error-message"
                        />
                      </FormRow>

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

                      <FormRow label="Blood Group">
                        <Field as="select" id="blood_group" name="blood_group">
                          <option value="">Select</option>
                          {[
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
                          ))}
                        </Field>
                      </FormRow>

                      <FormRow label="Profile Image">
                        <Field name="profile_image">
                          {({ form }: any) => (
                            <>
                              <input
                                type="file"
                                accept="image/png, image/jpeg, image/jpg"
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>,
                                ) => {
                                  const file =
                                    e.currentTarget.files?.[0] || null;

                                  form.setFieldValue("profile_image", file);
                                  form.setFieldTouched(
                                    "profile_image",
                                    true,
                                    false,
                                  );
                                  form.validateField("profile_image");

                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () =>
                                      setPreviewUrl(reader.result as string);
                                    reader.readAsDataURL(file);
                                  } else {
                                    setPreviewUrl(null);
                                  }
                                }}
                              />

                              <ErrorMessage
                                name="profile_image"
                                component="div"
                                className="error-message"
                              />
                            </>
                          )}
                        </Field>
                      </FormRow>

                      <FormRow label="Address">
                        <Field
                          as="textarea"
                          id="address"
                          name="address"
                          rows={3}
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
                      {isEditMode ? "Update" : "Create"}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>

      {showPopup && (
        <ConfirmPopup
          msg="update"
          onConfirm={handleConfirmUpdate}
          onCancel={() => setShowPopup(false)}
        />
      )}
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

export default UpdatePatient;
