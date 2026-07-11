import { apiClient } from "./client";
import type { LoginRequest, LoginResponse } from "../types/auth";

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>("/auth/login", data),
};
