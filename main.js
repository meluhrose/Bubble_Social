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
