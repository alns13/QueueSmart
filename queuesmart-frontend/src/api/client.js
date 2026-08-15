const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = sessionStorage.getItem("token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let data = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {
    const error = new Error(data?.error || "Request failed");
    error.status = response.status;
    error.details = data?.details;
    throw error;
  }

  return data;
}

export async function apiFileRequest(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = sessionStorage.getItem("token");

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : null;
    const error = new Error(data?.error || "Download failed");
    error.status = response.status;
    error.details = data?.details;
    throw error;
  }

  const disposition = response.headers.get("content-disposition") || "";
  const filenameMatch = disposition.match(/filename="([^"]+)"/i);

  return {
    blob: await response.blob(),
    filename: filenameMatch?.[1] || "queuesmart-queue-usage.csv",
  };
}
