export function showLogin() {
  const app = document.getElementById("app");
  const nav = document.querySelector("nav");
  
  if (nav) nav.style.display = "none";

  app.innerHTML = `

  <div class="about-info">
    <h1>Welcome to Bubble!</h1>
    <p>Here you can connect with others, share your thoughts, and stay updated with the latest news. To get started, please log in with your Noroff student email.</p>
  </div>
  <div class="login-wrapper">
    <h1>Login</h1>
    <form id="loginForm" class="login-form">
      <input id="emailInput" name="email" placeholder="Email" required />
      <input id="passwordInput" name="password" type="password" placeholder="Password" required />
      <button type="submit">Login</button>
      <div class ="login-info">
      <p style="color: #666; font-size: 14px; margin-top: 10px;">Email must be a valid Noroff student email (@stud.noroff.no).</p>
      <p>Don't have an account? <a href="#/register">Register here</a>.</p>
      </div>
    <div id="loginMessage" class="login-message"></div>
    </form>
    </div>
      `;

  const form = document.getElementById("loginForm");
  form.addEventListener("submit", handleLogin);
}

import { loginUser, createApiKey } from "../src/auth.js";

// Handles user login via the Noroff Auth API.
async function handleLogin(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const email = formData.get("email");
  const password = formData.get("password");
  const messageDiv = document.getElementById("loginMessage");

  messageDiv.innerHTML = "";

  try {
    const data = await loginUser(email, password);

    // Save user data to localStorage
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("userName", data.name);
    localStorage.setItem("userEmail", data.email);

    try {
      const apiKey = await createApiKey(data.accessToken);
      localStorage.setItem("apiKey", apiKey);
    } catch (apiKeyError) {
      console.error("API key creation error:", apiKeyError);
    }

    messageDiv.innerHTML =
      `<p style="color: green;">Login successful! Redirecting...</p>`;

    setTimeout(() => {
      window.location.hash = "#/feed";
    }, 1500);

  } catch (error) {
    messageDiv.innerHTML = `
      <p style="color: red;">
        Invalid email or password. Please try again.
      </p>
    `;
    console.error("Login error:", error);
  }
}