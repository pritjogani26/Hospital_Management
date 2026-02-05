// Hospital_Management\frontend\src\components\Navbar.tsx
import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";
import { useAuth } from "./UserAuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <div className="navbar">
      <div className="navbar-left">
        <Link to="/" className="logo">
          Hospital Management
        </Link>
      </div>

      <div className="navbar-right">
        <ul className="nav-links">
          {user && (
            <>
              <li>
                <Link to="/patients/add">Add Patient</Link>
              </li>
              <li>
                <Link to="/patients/details">View Patients</Link>
              </li>
              <li>
                <Link to="/doctor/list">Doctors</Link>
              </li>
              <li>
                <Link to="/user/profile">Profile</Link>
              </li>
              <button onClick={logout} className="logout-btn" type="button">
                Logout
              </button>
            </>
          )}

          {!user && (
            <>
              <li>
                <Link to="/user/register">Register</Link>
              </li>
              <li>
                <Link to="/user/login">Login</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Navbar;
