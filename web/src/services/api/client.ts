import axios from "axios";
import { API_CONFIG } from "../../constants/config";
import { getStoredUser } from "../storage/localStorage.service";

export const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
});

// Interceptor para adicionar token de autenticação
apiClient.interceptors.request.use((config) => {
    const user = getStoredUser();

    if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
    }

    return config;
});

// Interceptor para tratar sessão expirada (401) automaticamente em tokens antigos
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const reqUrl = String(error?.config?.url || "");
        if (status === 401 && !reqUrl.includes("/login")) {
            window.dispatchEvent(new CustomEvent("servas:auth-expired"));
        }
        return Promise.reject(error);
    }
);

export default apiClient;
