/**
 * Renders the registration page and attaches event listeners.
 */

import { registerUser } from "../src/auth.js";
import { showAlert } from "../src/utils.js";

export function showRegister() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <h1>Register</h1>
    <form id="registerForm" class="register-form">
      <input name="name" type="text" placeholder="Username" required />
      <input name="email" type="email" placeholder="Email (@stud.noroff.no)" required />
      <input name="password" type="password" placeholder="Password (min 8 chars)" required />
      <button type="submit">Register</button>
      <p style="color: #666; font-size: 14px; margin-top: 10px;">
      Use your own @stud.noroff.no email to create an account.
    </p>
    <div id="registerMessage"></div>
    </form>
      `;

  const form = document.getElementById("registerForm");
  form.addEventListener("submit", handleRegister);
}

/**
 * Handles user registration via the Noroff Auth API.
 * @param {Event} event - The form submit event.
 */
async function handleRegister(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const email = formData.get("email");
  const password = formData.get("password");
  const name = formData.get("name");
  const messageDiv = document.getElementById("registerMessage");

  // Client-side validation
  if (!email.endsWith("@stud.noroff.no")) {
    messageDiv.innerHTML = `<p style="color: red;">Email must be a @stud.noroff.no address</p>`;
    return;
  }

  if (password.length < 8) {
    messageDiv.innerHTML = `<p style="color: red;">Password must be at least 8 characters</p>`;
    return;
  }

  try {
    await registerUser(name, email, password);

    messageDiv.innerHTML = `
      <p style="color: green;">
        Registration successful! Redirecting to login...
      </p>
    `;

    setTimeout(() => {
      window.location.hash = "#/login";
    }, 1000);

  } catch (error) {
    const errorMessage = error.message || "Registration failed";
    
    // Check if it's a "profile already exists" error
    if (errorMessage.toLowerCase().includes("profile") && errorMessage.toLowerCase().includes("exist")) {
      messageDiv.innerHTML = `
        <p style="color: red;">
          This email is already registered. 
          <a href="#/login" style="color: blue; text-decoration: underline;">Go to login</a>
        </p>
      `;
    } else {
      messageDiv.innerHTML = `<p style="color: red;">${errorMessage}</p>`;
    }
    console.error("Registration error:", error);
  }
}