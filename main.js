import { router } from "./route.js";

function updateNavbar() {
  const isLoggedIn = Boolean(localStorage.getItem("accessToken"));
  const nav = document.querySelector("nav ul");
  nav.innerHTML = `
    <li><a href="#/homepage">Home</a></li>
    ${isLoggedIn ? `
      <li><a href="#/feed">Feed</a></li>
      <li><a href="#/profile">Profile</a></li>
      <li><a href="#" id="logoutLink">Logout</a></li>
    ` : `
      <li><a href="#/login">Login</a></li>
      <li><a href="#/register">Register</a></li>
    `}
  `;

  // Add logout functionality
  const logoutLink = document.getElementById("logoutLink");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userName");
      window.location.hash = "#/homepage";
    });
  }
}

window.addEventListener("hashchange", () => {
  router();
  updateNavbar();
});

window.addEventListener("load", () => {
  router();
  updateNavbar();
});

export function normalizeIdentity(value) {
  return (value || "").trim().toLowerCase();
}

export function getUserIdentity(accessToken) {
  const storedName = normalizeIdentity(localStorage.getItem("userName"));
  const storedEmail = normalizeIdentity(localStorage.getItem("userEmail"));

  if (storedName || storedEmail) {
    return { name: storedName, email: storedEmail };
  }

  try {
    const tokenParts = accessToken?.split(".");
    if (!tokenParts || tokenParts.length < 2) {
      return { name: "", email: "" };
    }

    const base64 = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
    const normalizedBase64 = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
    const payload = JSON.parse(atob(normalizedBase64));
    return {
      name: normalizeIdentity(payload?.name),
      email: normalizeIdentity(payload?.email)
    };
  } catch {
    return { name: "", email: "" };
  }
}

export function isPostOwner(post, userIdentity) {
  const authorName = normalizeIdentity(post?.author?.name);
  const authorEmail = normalizeIdentity(post?.author?.email);

  return Boolean(
    (userIdentity.name && authorName && userIdentity.name === authorName) ||
    (userIdentity.email && authorEmail && userIdentity.email === authorEmail)
  );
}