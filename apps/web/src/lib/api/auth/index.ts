import { api } from "../client";
import { ENDPOINTS } from "../endpoints";

export const refreshToken = async (): Promise<{ token: string; refreshToken: string }> => {
  const response = await api.post(ENDPOINTS.auth.refresh);
  return response.data.data;
};

export const logout = async (): Promise<{ success: boolean }> => {
  const response = await api.post(ENDPOINTS.auth.logout);
  return response.data.data;
};
