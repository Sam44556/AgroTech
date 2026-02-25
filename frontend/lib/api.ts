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

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      body,
      credentials: "include",
    });
  } catch (err) {
    console.error('Network error while calling API', { url, error: err });
    throw new Error('Network error: Failed to fetch');
  }

  const contentType = response.headers.get("content-type") || '';
  const isJson = contentType.includes("application/json");

  // Parse response body (JSON or text) for better logging
  let parsedBody: any = null;
  try {
    parsedBody = isJson ? await response.json() : await response.text();
  } catch (err) {
    // Fallback when body cannot be parsed
    parsedBody = null;
  }

  if (!response.ok) {
    // Log details to help debugging in the browser console
    console.error('API request failed', {
      url,
      status: response.status,
      statusText: response.statusText,
      contentType,
      body: parsedBody,
    });
    const message = (parsedBody && (parsedBody.message || parsedBody.error)) || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return parsedBody as T;
}

export const apiGet = <T>(path: string) => apiRequest<T>(path);
export const apiPost = <T>(path: string, body?: any) => apiRequest<T>(path, { method: "POST", body });
export const apiPut = <T>(path: string, body?: any) => apiRequest<T>(path, { method: "PUT", body });
export const apiPatch = <T>(path: string, body?: any) => apiRequest<T>(path, { method: "PATCH", body });
export const apiDelete = <T>(path: string) => apiRequest<T>(path, { method: "DELETE" });
