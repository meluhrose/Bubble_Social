/**
 * Authentication API functions for Bubble Social
 * Handles all HTTP requests to Noroff Auth API
 */

const AUTH_URL = "https://v2.api.noroff.dev/auth";


export async function loginUser(email, password) {
  const response = await fetch(`${AUTH_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.errors?.[0]?.message || "Login failed");
  }

  return data.data;
}

export async function registerUser(name, email, password) {
  const response = await fetch(`${AUTH_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, email, password })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.errors?.[0]?.message || "Registration failed");
  }

  return data.data;
}

export async function createApiKey(accessToken) {
  const response = await fetch(`${AUTH_URL}/create-api-key`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`
    },
    body: JSON.stringify({ name: "Bubble API Key" })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.errors?.[0]?.message || "Failed to create API key");
  }

  return data.data.key;
}
