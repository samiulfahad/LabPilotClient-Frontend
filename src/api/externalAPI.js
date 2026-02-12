import axios from "axios";


const externalAPI = axios.create({
  baseURL: "https://labpilot-adminbackend.onrender.com/api/v1",
  timeout: 10000,
});

export default externalAPI;
