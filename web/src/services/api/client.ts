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

export default apiClient;
