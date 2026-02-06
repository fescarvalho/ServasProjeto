import axios from "axios";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
});
// --- O PULO DO GATO (Interceptor) ---
// Antes de cada requisição, o axios vai rodar essa função:
api.interceptors.request.use((config) => {
  // 1. Tenta pegar os dados salvos no navegador
  const userJson = localStorage.getItem("servas_user");

  if (userJson) {
    // 2. Converte de texto para Objeto JavaScript
    const user = JSON.parse(userJson);

    // 3. Se tiver um token, adiciona no cabeçalho "Authorization"
    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }

  return config;
});

export default api;
