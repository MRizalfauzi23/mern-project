export function apiResponse({ message = "OK", data = null, meta = null }) {
  return { success: true, message, data, meta };
}

