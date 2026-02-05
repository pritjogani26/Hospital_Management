// Hospital_Management\frontend\src\components\UserAuthContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import ToastService from "../utils/toastService";
import { connected } from "process";

type User = {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  role: string;
  profile_image: File | null;
};

type UserAuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  register: (formData: FormData) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<UserAuthContextType | undefined>(undefined);

export const UserAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const access_token = localStorage.getItem("access_token");
    console.log("\nStored User :" + storedUser);
    // console.log(storedUser);
    console.log("\nAccess Token: " + access_token + "\n");

    if (storedUser && access_token) {
      setUser(JSON.parse(storedUser));
      api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
      return;
    }

    tryRestoreSession();
  }, []);

  const tryRestoreSession = async () => {
    try {
      const res = await api.post(
        "/user/refresh/",
        {},
        { withCredentials: true },
      );
      const { access_token, user } = res.data;
      if (access_token && user) {
        api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);
        console.log("\nReset Successfully.");
      }
    } catch (err) {
      localStorage.removeItem("access_token");
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post(
        "/user/login/",
        {
          email,
          password,
        },
        { withCredentials: true },
      );
      const { access_token, user } = res.data;

      setUser(user);

      localStorage.setItem("access_token", access_token);
      localStorage.setItem("user", JSON.stringify(user));

      api.defaults.headers.common.Authorization = `Bearer ${access_token}`;

      ToastService.success("Logged in successfully.");
    } catch (error: any) {
      // console.error("Login Error:", error);
      // const msg =
      //   error?.response?.data?.error + "Login Context" || "Login failed";
      // ToastService.error(msg);
      throw error;
    }
  };

  const googleLogin = async (idToken: string) => {
    try {
      const res = await api.post(
        "/user/google-login/",
        { id_token: idToken },
        { withCredentials: true },
      );

      const { access_token, user } = res.data;

      setUser(user);
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("user", JSON.stringify(user));
      api.defaults.headers.common.Authorization = `Bearer ${access_token}`;

      ToastService.success("Logged in with Google.");
    } catch (error: any) {
      throw error;
    }
  };

  const register = async (formData: FormData) => {
    try {
      await api.post("/user/register/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Inform user that verification email was sent
      ToastService.success("Check your Email Inbox for Verification.");

      navigate("/user/login");
    } catch (error: any) {
      // console.error("Register Error:", error);
      // const msg = error?.response?.data?.error || "Registration failed";
      // ToastService.error(msg);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await navigate("/user/login");
      await api.post("/user/logout/", {}, { withCredentials: true });
    } catch (error) {
      console.warn("Logout request failed:", error);
    }

    setUser(null);

    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    delete api.defaults.headers.common.Authorization;
    await navigate("/user/login");
    ToastService.info("Logged out.");
  };

  return (
    <AuthContext.Provider
      value={{ user, login, googleLogin, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
