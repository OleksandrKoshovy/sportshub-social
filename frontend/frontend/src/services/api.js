const API_URL = "http://localhost:3001";

const parseResponse = async (res) => {
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || "Request failed");
  }

  return data;
};

export const getEvents = async () => {
  const res = await fetch(`${API_URL}/events`);
  const data = await parseResponse(res);
  return Array.isArray(data) ? data : [];
};

export const createEvent = async (data) => {
  const res = await fetch(`${API_URL}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return parseResponse(res);
};

export const register = async (data) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return parseResponse(res);
};

export const login = async (data) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return parseResponse(res);
};

export const joinEvent = async (id) => {
  const res = await fetch(`${API_URL}/events/${id}/join`, {
    method: "POST",
  });

  return parseResponse(res);
};

export const getEventById = async (id) => {
  const events = await getEvents();
  return events.find((event) => event.id === id);
};