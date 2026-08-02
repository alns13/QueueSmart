import { apiRequest } from "./client.js";

export async function fetchMyProfile() {
  const data = await apiRequest("/profile/me");
  return data.profile;
}

export async function updateMyProfile(updates) {
  const data = await apiRequest("/profile/me", {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  return data.profile;
}
