export function showLogin() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <h1>Login</h1>
    <form id="loginForm" class="login-form">
      <input id="emailInput" name="email" placeholder="Email" required />
      <input id="passwordInput" name="password" type="password" placeholder="Password" required />
      <button type="submit">Login</button>
      <div class ="login-info">
      <p style="color: #666; font-size: 14px; margin-top: 10px;">Email must be a valid Noroff student email (@stud.noroff.no).</p>
      </div>
    <div id="loginMessage" class="login-message"></div>
    </form>
      `;

  const form = document.getElementById("loginForm");
  form.addEventListener("submit", handleLogin);
}
// Handles user login via the Noroff Auth API.
async function handleLogin(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const email = formData.get("email");
  const password = formData.get("password");
  const messageDiv = document.getElementById("loginMessage");

  messageDiv.innerHTML = "";

  try {
    const response = await fetch("https://v2.api.noroff.dev/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    // Check if login was successful
    if (!response.ok) {
      messageDiv.innerHTML = `
        <p style="color: red;">
          Invalid email or password.
        </p>
        <p>
          Don't have an account?
          <a href="#/register">Register here</a>
        </p>
      `;
      return;
    }
    
    // Save user data and API key to localStorage
    localStorage.setItem("accessToken", data.data.accessToken);
    localStorage.setItem("userName", data.data.name);
    localStorage.setItem("userEmail", data.data.email);

    
    try {
      const apiKeyResponse = await fetch(
        "https://v2.api.noroff.dev/auth/create-api-key",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${data.data.accessToken}`
          },
          body: JSON.stringify({ name: "Bubble API Key" })
        }
      );

      const apiKeyData = await apiKeyResponse.json();

      if (apiKeyResponse.ok) {
        localStorage.setItem("apiKey", apiKeyData.data.key);
      }

    } catch (apiKeyError) {
      console.error("API key creation error:", apiKeyError);
    }

    messageDiv.innerHTML =
      `<p style="color: green;">Login successful! Redirecting...</p>`;

    setTimeout(() => {
      window.location.hash = "#/feed";
    }, 1500);

  } catch (error) {
    messageDiv.innerHTML =
      `<p style="color: red;">Login failed. Please try again.</p>`;
    console.error("Login error:", error);
  }
}