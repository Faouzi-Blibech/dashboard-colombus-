// Typed fetch wrapper around the FastAPI backend. Normalizes errors into ApiError
// so widgets can branch on HTTP status (422 = not enough data, 503 = rates down, etc.).

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api/v1'

/** Normalized API error carrying the HTTP status and backend `detail` message. */
export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }

  /** True when the backend reported "not enough data" (HTTP 422). */
  get isInsufficientData(): boolean {
    return this.status === 422
  }

  /** True when exchange-rate data is unavailable (HTTP 503). */
  get isRatesDown(): boolean {
    return this.status === 503
  }

  /** True when the AI service failed (HTTP 502). */
  get isAiDown(): boolean {
    return this.status === 502
  }
}

/** Build a full URL with optional query params (skips null/undefined values). */
function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const url = `${API_BASE}${path}`
  if (!params) return url
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `${url}?${qs}` : url
}

/** Parse a response, throwing ApiError with the backend `detail` on failure. */
async function parse<T>(res: Response): Promise<T> {
  if (res.ok) return (await res.json()) as T
  let detail = res.statusText
  try {
    const body = await res.json()
    if (body && typeof body.detail === 'string') detail = body.detail
  } catch {
    // non-JSON error body — keep statusText
  }
  throw new ApiError(res.status, detail)
}

/** GET a JSON resource. */
export async function get<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  const res = await fetch(buildUrl(path, params))
  return parse<T>(res)
}

/** POST a JSON body and parse the JSON response. */
export async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return parse<T>(res)
}
