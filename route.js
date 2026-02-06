import { showHomepage } from "./pages/homepage.js";
import { showLogin } from "./pages/login.js";
import { showRegister } from "./pages/register.js";
import { showFeed } from "./pages/feed.js";
import { showPost } from "./pages/post.js";
import { showProfile } from "./pages/profile.js";

export function router() {
  const hash = window.location.hash || "#/homepage";

  if (hash.startsWith("#/login")) {
    showLogin();
  } else if (hash.startsWith("#/register")) {
    showRegister();
  } else if (hash.startsWith("#/feed")) {
    showFeed();
  } else if (hash.startsWith("#/post")) {
    showPost();
  } else if (hash.startsWith("#/profile")) {
    showProfile();
  } else {
    showHomepage();
  }
}
