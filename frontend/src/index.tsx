// Hospital_Management\frontend\src\index.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter } from "react-router-dom";
import { UserAuthProvider } from "./components/UserAuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";

const googleClientId =
  "91502161974-u4ogi88ovn0bgq7i53ee9aq7tg8lsaen.apps.googleusercontent.com";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  // <React.StrictMode>
  <BrowserRouter>
    <GoogleOAuthProvider clientId={googleClientId}>
      <UserAuthProvider>
        <App />
      </UserAuthProvider>
    </GoogleOAuthProvider>
  </BrowserRouter>,
  // {/* </React.StrictMode> */}
);

reportWebVitals();
