/**
 * Renders the registration page and attaches event listeners.
 */
export function showRegister() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <h1>Register</h1>
    <form id="registerForm" class="register-form">
      <input name="name" placeholder="Username (letters, numbers, _)" required />
      <input name="email" type="email" placeholder="Email (@stud.noroff.no)" required />
      <input name="password" type="password" placeholder="Password (min 8 chars)" required />
      <button type="submit">Register</button>
    </form>
    <p style="color: #666; font-size: 14px; margin-top: 10px;">
      Use your own @stud.noroff.no email to create an account.
    </p>
    <div id="registerMessage"></div>
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
  const name = formData.get("name");
  const email = formData.get("email");
  const password = formData.get("password");
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

  if (/[^\w_]/.test(name)) {
    messageDiv.innerHTML = `<p style="color: red;">Username can only contain letters, numbers, and underscores</p>`;
    return;
  }

  try {
    const response = await fetch("https://v2.api.noroff.dev/auth/register", {
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

    messageDiv.innerHTML = `
      <p style="color: green;">
        Registration successful! Redirecting to login...
      </p>
    `;

    setTimeout(() => {
      window.location.hash = "#/login";
    }, 1000);

  } catch (error) {
    messageDiv.innerHTML = `<p style="color: red;">${error.message}</p>`;
  }
}