import {UserResponse} from "@/app/types";
import {instance} from "@/app/api/instance";

/**
 * Fetch users by role
 */
export const fetchUsersByRole = async (role: string): Promise<UserResponse[]> => {
    const res = await instance.get("/users", {params: {role}});
    return res.data.content;
};

