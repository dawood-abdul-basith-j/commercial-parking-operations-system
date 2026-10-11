
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

async function request(path, { token, method = "GET", body } = {}) {
  const headers = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: "The server returned an invalid response." };
    }
  }

  if (!response.ok) {
    const error = new Error(
      data.message ||
      data.error ||
      `Request failed with HTTP ${response.status}`
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}

export const api = {
  register: (body) =>
    request("/api/auth/register", {
      method: "POST",
      body,
    }),

  login: (body) =>
    request("/api/auth/login", {
      method: "POST",
      body,
    }),

  googleLogin: (credential) =>
    request("/api/auth/google-login", {
      method: "POST",
      body: { credential },
    }),

  me: (token) =>
    request("/api/auth/me", { token }),

  getBookings: (token, page = 1, limit = 5) =>
    request(`/api/bookings?page=${page}&limit=${limit}`, { token }),

  createBooking: (token, body) =>
    request("/api/bookings", {
      token,
      method: "POST",
      body,
    }),

  updateBookingStatus: (token, bookingId, booking_status) =>
    request(`/api/bookings/${bookingId}/status`, {
      token,
      method: "PATCH",
      body: { booking_status },
    }),

  getAuditLogs: (token, page = 1, limit = 10) =>
    request(`/api/audit-logs?page=${page}&limit=${limit}`, { token }),
};
