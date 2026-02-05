import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import api from "../api/axios";
import "./css/ViewPatientDetails.css";
import ToastService from "../utils/toastService";
import { useAuth } from "../components/UserAuthContext";

const ChangePasswordSchema = Yup.object({
  old_password: Yup.string().required("Current password is required"),
  new_password: Yup.string()
    .min(5, "Minimum 5 characters")
    .required("New password is required"),
  confirm_password: Yup.string()
    .oneOf([Yup.ref("new_password")], "Passwords must match")
    .required("Confirm password is required"),
});

type ChangePasswordForm = {
  old_password: string;
  new_password: string;
  confirm_password: string;
};

const defaultValues: ChangePasswordForm = {
  old_password: "",
  new_password: "",
  confirm_password: "",
};

const ChangePassword: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (values: ChangePasswordForm) => {
    if (values.old_password === values.new_password) {
      ToastService.error("New password must be different from old password");
      return;
    }

    try {
      await api.put(`/user/change_password/${user?.user_id}/`, {
        old_password: values.old_password,
        new_password: values.new_password,
      });

      ToastService.success("Password changed successfully");
      navigate(-1);
    } catch (err: any) {
      ToastService.error(
        err?.response?.data?.error || "Failed to change password",
      );
    }
  };

  return (
    <div className="patient-details-container">
      <div className="patient-details-card">
        <h2>Change Password</h2>

        <div className="table-wrapper">
          <Formik
            initialValues={defaultValues}
            validationSchema={ChangePasswordSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="update-patient-form">
                <table className="details-table">
                  <tbody>
                    <FormRow label="Current Password">
                      <Field
                        type="password"
                        name="old_password"
                        placeholder="Enter current password"
                      />
                      <ErrorMessage
                        name="old_password"
                        component="div"
                        className="error-message"
                      />
                    </FormRow>

                    <FormRow label="New Password">
                      <Field
                        type="password"
                        name="new_password"
                        placeholder="Enter new password"
                      />
                      <ErrorMessage
                        name="new_password"
                        component="div"
                        className="error-message"
                      />
                    </FormRow>

                    <FormRow label="Confirm Password">
                      <Field
                        type="password"
                        name="confirm_password"
                        placeholder="Confirm new password"
                      />
                      <ErrorMessage
                        name="confirm_password"
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
                    Update Password
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

export default ChangePassword;
