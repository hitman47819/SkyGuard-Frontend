const ACCESS_TOKEN_KEY = "skyguard-access-token";

export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let token = localStorage.getItem(ACCESS_TOKEN_KEY);

  let response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status !== 401) {
    return response;
  }

  // Access token expired → try refresh
  const refreshResponse = await fetch("/api/Authentication/refresh-token", {
    method: "POST",
    credentials: "include", // if your refresh token is stored in an HttpOnly cookie
  });

  if (!refreshResponse.ok) {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem("skyguard-refresh-token");
    localStorage.removeItem("skyguard-authenticated");

    window.location.hash = "#/not-found";
    return response;
  }

  const refreshData = await refreshResponse.json();

  localStorage.setItem(
    ACCESS_TOKEN_KEY,
    refreshData.accessToken
  );

  token = refreshData.accessToken;

  // Retry the original request
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
}