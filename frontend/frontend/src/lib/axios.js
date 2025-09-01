import axios from "axios";

export const axiosInstance = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? "http://localhost:5001/api"
      : "https://trust-let-blxr.vercel.app/api",
  withCredentials: true,
});
