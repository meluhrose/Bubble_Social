import { showHomepage } from "./pages/homepage.js";
import { showLogin } from "./pages/login.js";
import { showRegister } from "./pages/register.js";
import { showFeed } from "./pages/feed.js";
import { showPost } from "./pages/post.js";
import { showProfile } from "./pages/profile.js";

export function router() {
  const hash = window.location.hash || "#/homepage";
  const isLoggedIn = Boolean(localStorage.getItem("accessToken"));

  //Public routes that don't require authentication

    if (hash.startsWith("#/homepage")) {
    showHomepage();
    return;
  }
  
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
    window.location.hash = "#/homepage";
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
    showHomepage();
  }
}