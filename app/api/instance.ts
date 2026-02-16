import axios, {AxiosRequestConfig, AxiosResponse, HttpStatusCode} from "axios";

export const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true,
});

export const refreshToken = async (): Promise<AxiosResponse> => {
    return await instance.post(
        "/auth/refresh"
    );
};

instance.interceptors.response.use(
    (response) => {
        if (response.status === HttpStatusCode.Forbidden) {
            return Promise.reject({ response, config: response.config });
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (!originalRequest) return Promise.reject(error);

        const isAuthRequest =
            originalRequest.url?.includes("/auth/refresh") ||
            originalRequest.url?.includes("/auth/login") ||
            originalRequest.url?.includes("/auth/register");

        // если это auth запрос — не трогаем
        if (isAuthRequest) {
            return Promise.reject(error);
        }

        // если 403 и еще не ретраили
        if (error.response?.status === HttpStatusCode.Forbidden && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshRes = await refreshToken();

                if (refreshRes.status === HttpStatusCode.NoContent) {
                    return instance(originalRequest);
                }
            } catch (_) {
                // игнор
            }

            // редирект только если не уже на логине
            if (typeof window !== "undefined" && window.location.pathname !== "/login") {
                window.location.href = "/login";
            }

            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);