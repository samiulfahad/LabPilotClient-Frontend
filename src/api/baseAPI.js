// src/services/api.js
import axios from "axios";

const cloud = "https://labpilotclient-backend.onrender.com/api/v1";
const local = "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: cloud,
  timeout: 10000,
});

export default api;
