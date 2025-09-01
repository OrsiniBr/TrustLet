import axios from "axios";

export const axiosInstance = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? "https://trust-let-blxr.vercel.app/api"
      : "/api",
  withCredentials: true,
});
