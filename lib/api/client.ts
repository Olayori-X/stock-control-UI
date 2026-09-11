// Shared response handling for every API module below. Mirrors the Go
// backend's error shape: RequestErrorHandler/InternalErrorHandler both
// respond with a JSON body containing "Message".
export async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (body?.Message) message = body.Message
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(message)
  }
  return res.json()
}