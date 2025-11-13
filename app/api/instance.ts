import axios, {HttpStatusCode} from "axios";

export const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true,
    validateStatus: () => true,
});

instance.interceptors.response.use(
    async (response) => {
        if (response.status !== 403) return response;

        try {
            const refreshResult = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
                {},
                { withCredentials: true }
            );

            if (refreshResult.status === HttpStatusCode.NoContent) {
                return instance.request(response.config);
            } else {
                if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
                    window.location.href = "/login";
                }
                return Promise.reject(response);
            }
        } catch (err) {
            if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
                window.location.href = "/login";
            }
            return Promise.reject(err);
        }
    },
    (error) => Promise.reject(error)
);