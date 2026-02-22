const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type ApiOptions = RequestInit & {
  body?: any;
};

async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers: HeadersInit = options.headers || {};

  let body = options.body;
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body,
    credentials: "include"
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = data?.message || data?.error || "Request failed";
    throw new Error(message);
  }

  return data as T;
}

export const apiGet = <T>(path: string) => apiRequest<T>(path);
export const apiPost = <T>(path: string, body?: any) => apiRequest<T>(path, { method: "POST", body });
export const apiPut = <T>(path: string, body?: any) => apiRequest<T>(path, { method: "PUT", body });
export const apiPatch = <T>(path: string, body?: any) => apiRequest<T>(path, { method: "PATCH", body });
export const apiDelete = <T>(path: string) => apiRequest<T>(path, { method: "DELETE" });
