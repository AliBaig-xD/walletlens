import { ENDPOINTS } from "../endpoints";

export const refreshToken = async (): Promise<{
  token: string;
  refreshToken: string;
}> => {
  const response = await fetch(ENDPOINTS.auth.refresh, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed with status ${response.status}`);
  }

  const data = (await response.json()) as any;
  return data.data;
};

export const logout = async (): Promise<{ success: boolean }> => {
  const response = await fetch(ENDPOINTS.auth.logout, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Logout failed with status ${response.status}`);
  }

  const data = (await response.json()) as any;
  return data.data;
};
