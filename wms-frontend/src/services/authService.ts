import api from "../api/axios";
import type { LoginResponse, User, RegistrationResponse,
 RegistrationOptionsResponse, RegistrationSection } from "../app/types/auth";

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

export async function getRegistrationOptions():
  Promise<RegistrationOptionsResponse> {
  const response =
    await api.get<RegistrationOptionsResponse>(
      "/registration-options",
    );

  return response.data;
}

export async function getSections(
  divisionId: number,
): Promise<RegistrationSection[]> {
  const response = await api.get<{
    sections: RegistrationSection[];
  }>(
    "/registration-options/sections",
    {
      params: {
        division_id: divisionId,
      },
    },
  );

  return response.data.sections;
}

export async function register(
  payload: Record<string, unknown>,
): Promise<RegistrationResponse> {
  const response =
    await api.post<RegistrationResponse>(
      "/register",
      payload,
    );

  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  const response = await api.get<User>("/user");

  return response.data;
}