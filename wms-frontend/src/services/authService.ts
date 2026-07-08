import api from "../api/axios";
import type { LoginResponse, User } from "../app/types/auth";

interface LoginCredentials {
  username: string;
  password: string;
}

export async function login(
  credentials: LoginCredentials,
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>(
    "/login",
    credentials,
  );

  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  const response = await api.get<User>("/user");

  return response.data;
}