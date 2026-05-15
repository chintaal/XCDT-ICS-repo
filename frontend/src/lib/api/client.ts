/**
 * Lightweight typed fetch wrapper around the FastAPI backend.
 * No external HTTP library — fewer bytes, less surface to maintain.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/ws/stream";

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public detail?: unknown,
  ) {
    super(`API ${status} ${statusText}`);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, signal, headers } = opts;

  const url = new URL(path.startsWith("/") ? path : `/${path}`, API_BASE_URL);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v != null) url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    method,
    signal,
    headers: {
      Accept: "application/json",
      ...(body != null ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body != null ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    let detail: unknown;
    try { detail = await res.json(); } catch { /* ignore */ }
    throw new ApiError(res.status, res.statusText, detail);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return res.json() as Promise<T>;
  return (await res.text()) as unknown as T;
}
