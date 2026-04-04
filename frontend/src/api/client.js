import axios from "axios";

const API = axios.create({ 
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1" 
});

export const sendMessage = (message, context = "") =>
  API.post("/chat", { message, context });

export const getMemories = () => API.get("/memory");
export const addMemory = (content, memory_type = "fact", importance = 1.0) =>
  API.post("/memory", { content, memory_type, importance });
export const sendCorrection = (correction) =>
  API.post("/correct", { correction });

export const trackActivity = (url, site) =>
  API.post("/activity", { url, site });
export const getRecentActivity = () => API.get("/activity/recent");

export const detectLaunchIntent = (message) =>
  API.post("/permission/detect", { message });

export const getAnalytics = () => API.get("/analytics");

export const getDailyReflection = () => API.post("/reflect");
export const getInsight = () => API.get("/insight");
export const compressMemories = () => API.post("/memory/compress");

export const summarizeSession = (conversation) =>
  API.post("/summarize", { conversation });

export const detectTask = (message) =>
  API.post("/task/detect", { message });
export const generateImage = (prompt) =>
  API.post("/task/generate-image", { prompt });
export const searchImages = (query) =>
  API.post("/task/search-image", { query });