const API_BASE = '/api/v1';

export class ApiClientError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = localStorage.getItem('accessToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  let response = await fetch(url, config);

  // If 401 Unauthorized and not already refreshing, attempt refresh
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newToken = refreshData.data?.accessToken;
          if (newToken) {
            localStorage.setItem('accessToken', newToken);
            onRefreshed(newToken);
          }
        } else {
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
        }
      } catch {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      } finally {
        isRefreshing = false;
      }
    }

    // Return promise waiting for refresh completion
    return new Promise((resolve, reject) => {
      subscribeTokenRefresh(async (newToken: string) => {
        headers['Authorization'] = `Bearer ${newToken}`;
        try {
          const retryRes = await fetch(url, { ...options, headers, credentials: 'include' });
          const retryData = await retryRes.json();
          if (!retryRes.ok) {
            reject(new ApiClientError(retryData.message || 'Request failed', retryRes.status, retryData.details));
          } else {
            resolve(retryData.data);
          }
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  if (response.status === 204) {
    return {} as T;
  }

  const result = await response.json();

  if (!response.ok) {
    throw new ApiClientError(
      result.message || 'An unexpected error occurred',
      response.status,
      result.details
    );
  }

  return result.data as T;
}
