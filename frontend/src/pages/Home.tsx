// Hospital_Management\frontend\src\pages\Home.tsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/patients/details/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div>
      <h1>Home Page</h1>
    </div>
  );
};

export default Home;
