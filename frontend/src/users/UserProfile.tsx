// src/pages/ViewPatientDetails.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import "./css/ViewPatientDetails.css";
import ToastService from "../utils/toastService";
import { useAuth } from "../components/UserAuthContext";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

type UserProfile = {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  profile_image: string;
  role_ids: string;
  status: string;
  email_verified: string;
  created_at: string;
  updated_at: string;
  last_login: string;
};

const API_BASE_URL = "http://localhost:8000";
const DEFAULT_IMAGE = `${API_BASE_URL}/media/defaults/patient.png`;

const getImageUrl = (path: string | null) => {
  if (!path) return DEFAULT_IMAGE;
  return path.startsWith("https") ? path : `${API_BASE_URL}${path}`;
};

const UpdateProfileSchema = Yup.object({
  first_name: Yup.string()
    .min(2, "Minimum 2 Characters")
    .required("First Name is required"),
  last_name: Yup.string()
    .min(2, "Minimum 2 Characters")
    .required("Last Name is required"),
  mobile: Yup.string()
    .matches(/^[6-9]\d{9}$/, "Invalid mobile number")
    .required("Mobile number is required"),
  profile_image: Yup.mixed().nullable(),
});

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [user_profile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get(`/user/profile/${user?.user_id}`);
      const data = response.data.data;
      console.log(data);
      setUserProfile(data);
      setPreviewUrl(getImageUrl(data.profile_image));
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Failed to load user profile.";
      console.log(msg);
      ToastService.error(msg);
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  const handleProfileUpdate = async (values: {
    first_name: string;
    last_name: string;
    mobile: string;
    profile_image: File | null;
  }) => {
    try {
      const formData = new FormData();

      Object.entries(values).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value);
          console.log(key, value);
        }
      });
      console.log(formData);
      // await api.put(`/user/profile_update/${user_profile?.user_id}`, formData);
      await api.patch(
        `/user/profile_update/${user_profile?.user_id}/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      ToastService.success("Profile updated");
      setIsEditing(false);
      fetchUser();
    } catch (err: any) {
      ToastService.error(err?.response?.data?.error ?? "Update failed");
    }
  };
  const formatDateTime = (value?: string) => {
    if (!value) return "-";
    const d = new Date(value);
    return d.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    console.log(user_profile);
  }, [user_profile]);
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (loading) return <PageMessage label="Loading..." />;
  if (!user_profile) return <PageMessage label="User is not found." />;

  if (!isEditing) {
    return (
      <div className="patient-details-container">
        <div className="patient-details-card">
          <h2>User Details</h2>

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
                <DetailRow label="User ID" value={user_profile.user_id} />
                <DetailRow label="First Name" value={user_profile.first_name} />
                <DetailRow label="Last Name" value={user_profile.last_name} />
                <DetailRow label="Email" value={user_profile.email} />
                <DetailRow label="Mobile" value={user_profile.mobile} />
                {/* <DetailRow
                label="Role"
                value={
                  user_profile.role === 1
                    ? "Doctor"
                    : user_profile.role === 2
                      ? "Admin"
                      : user_profile.role === 3
                        ? "Staff"
                        : user_profile.role
                }
              /> */}

                <DetailRow label="Role Ids" value={user_profile.role_ids} />
                <DetailRow label="Active Status" value={user_profile.status} />
                <DetailRow
                  label="Verified Status"
                  value={user_profile.email_verified}
                />

                <DetailRow
                  label="Created At"
                  value={formatDateTime(user_profile.created_at)}
                />
                <DetailRow
                  label="Updated At"
                  value={formatDateTime(user_profile.updated_at)}
                />
                <DetailRow
                  label="Last Login At"
                  value={formatDateTime(user_profile.last_login)}
                />
              </tbody>
            </table>
          </div>

          <div className="button-group">
            <button className="btn btn-back" onClick={() => navigate(-1)}>
              Back
            </button>
            <button
              className="btn btn-update"
              onClick={() => setIsEditing(true)}
            >
              Update Profile
            </button>
            <button
              className="btn btn-update"
              onClick={() => navigate(`/user/change_password/`)}
            >
              Change Password
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="patient-details-container">
      <div className="patient-details-card">
        <h2>Edit Profile</h2>

        <img
          src={previewUrl || DEFAULT_IMAGE}
          alt="Preview"
          style={{ width: 100, height: 100, borderRadius: "50%" }}
        />

        <Formik
          initialValues={{
            first_name: user_profile.first_name,
            last_name: user_profile.last_name,
            mobile: user_profile.mobile,
            profile_image: null as File | null,
          }}
          validationSchema={UpdateProfileSchema}
          onSubmit={handleProfileUpdate}
        >
          {({ setFieldValue, isSubmitting }) => (
            <Form className="update-patient-form">
              <table className="details-table">
                <tbody>
                  <FormRow label="User ID">
                    <input value={user_profile.user_id} disabled />
                  </FormRow>

                  <FormRow label="Email">
                    <input value={user_profile.email} disabled />
                  </FormRow>

                  <FormRow label="First Name">
                    <Field name="first_name" />
                    <ErrorMessage
                      name="first_name"
                      component="div"
                      className="error-message"
                    />
                  </FormRow>

                  <FormRow label="Last Name">
                    <Field name="last_name" />
                    <ErrorMessage
                      name="last_name"
                      component="div"
                      className="error-message"
                    />
                  </FormRow>

                  <FormRow label="Mobile">
                    <Field name="mobile" />
                    <ErrorMessage
                      name="mobile"
                      component="div"
                      className="error-message"
                    />
                  </FormRow>

                  <FormRow label="Profile Image">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e: any) => {
                        const file = e.target.files?.[0];
                        setFieldValue("profile_image", file);
                        if (file) setPreviewUrl(URL.createObjectURL(file));
                      }}
                    />
                  </FormRow>
                </tbody>
              </table>

              <div className="button-group">
                <button
                  type="button"
                  className="btn btn-back"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-update"
                  disabled={isSubmitting}
                >
                  Save Changes
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

const FormRow: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <tr>
    <th>{label}:</th>
    <td>{children}</td>
  </tr>
);

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

export default UserProfile;
