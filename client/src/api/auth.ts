import { apiClient } from "./client";
import type { ApiResponse, AuthResponse, User } from "@/types";

export const authApi = {
  register: async (name: string, email: string, password: string) => {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
      "/auth/register",
      { name, email, password }
    );
    return data.data;
  },

  login: async (email: string, password: string) => {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      { email, password }
    );
    return data.data;
  },

  me: async () => {
    const { data } = await apiClient.get<ApiResponse<User>>("/auth/me");
    return data.data;
  },
};
