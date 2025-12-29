import axios, {AxiosResponse} from "axios";

export const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true,
    validateStatus: () => true,
});

export const refreshToken = async (): Promise<AxiosResponse> => {
    return await instance.post(
        "/auth/refresh"
    );
};