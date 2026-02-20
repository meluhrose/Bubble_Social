import { showLogin } from "./pages/login.js";
import { showRegister } from "./pages/register.js";
import { showFeed } from "./pages/feed.js";
import { showPost } from "./pages/post.js";
import { showProfile } from "./pages/profile.js";

export function router() {
  const hash = window.location.hash || "#/login";
  const isLoggedIn = Boolean(localStorage.getItem("accessToken"));

  // If user is logged in and tries to access login/register, redirect to feed
  if (isLoggedIn && (hash.startsWith("#/login") || hash.startsWith("#/register"))) {
    window.location.hash = "#/feed";
    return;
  }

  //Public routes that don't require authentication
  if (hash.startsWith("#/login")) {
    showLogin();
    return;
  }

  if (hash.startsWith("#/register")) {
    showRegister();
    return;
  }

  if (hash.startsWith("#/logout")) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("apiKey");
    window.location.hash = "#/login";
    return;
  }

  //Protected routes that require authentication
  if (!isLoggedIn) {
    window.location.hash = "#/login";
    return;
  }

  if (hash.startsWith("#/feed")) {
    showFeed();
  } else if (hash.startsWith("#/post")) {
    showPost();
  } else if (hash.startsWith("#/profile")) {
    showProfile();
  } else {
    window.location.hash = "#/feed";
  }
}