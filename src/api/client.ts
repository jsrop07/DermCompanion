const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("derm_token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && path !== "/auth/login") {
    localStorage.removeItem("derm_token");
    localStorage.removeItem("derm_user_name");
    localStorage.removeItem("derm_user_role");

    if (window.location.pathname !== "/login") {
      window.location.replace("/login");
    }

    throw new Error("로그인 세션이 만료되었습니다.");
  }

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({
        detail: "알 수 없는 오류",
      }));

    throw new Error(
      error.detail ?? `HTTP ${res.status}`
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
