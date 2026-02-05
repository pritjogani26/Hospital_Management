// Hospital_Management\frontend\src\App.tsx
import React from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import { Route, Routes, useParams } from "react-router-dom";
import Home from "./pages/Home";
import AddPatient from "./pages/AddPatient";
import ViewPatients from "./pages/ViewPatients";
import ViewPatientDetails from "./pages/ViewPatientDetails";
import DeletePatient from "./pages/DeletePatient";
import UpdatePatient from "./pages/UpdatePatient";
import ImageUpload from "./components/ImageUpload";
import Register from "./users/Register";
import Login from "./users/Login";
import UserProfile from "./users/UserProfile";
import EmailVerification from "./users/EmailVerification";
import ChangePassword from "./users/ChangePassword";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import DoctorList from "./doctor/DoctorList";

function App() {
  return (
    <div className="App">
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/user/register" element={<Register />} />
        <Route path="/user/login" element={<Login />} />
        <Route path="/user/verify-email" element={<EmailVerification />} />
        <Route
          path="/doctor/list"
          element={
            <ProtectedRoute>
              <DoctorList />
            </ProtectedRoute>
          }
        />

        {/* Protected routes - require authentication */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/add"
          element={
            <ProtectedRoute>
              <UpdatePatient />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/details"
          element={
            <ProtectedRoute>
              <ViewPatients />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/details/:patientId"
          element={
            <ProtectedRoute>
              <ViewPatientDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/delete/:patientId"
          element={
            <ProtectedRoute>
              <DeletePatient />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/update/:patientId"
          element={
            <ProtectedRoute>
              <UpdatePatient />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/upload"
          element={
            <ProtectedRoute>
              <ImageUpload />
            </ProtectedRoute>
          }
        />

        <Route
          path="/user/profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/change_password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />
      </Routes>

      <ToastContainer
        position="bottom-right"
        newestOnTop
        pauseOnHover
        closeOnClick
        limit={6}
      />
    </div>
  );
}

export default App;
