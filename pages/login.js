export function showLogin() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <h1>Login</h1>
    <form id="loginForm" class="login-form">
      <input id="emailInput" name="email" placeholder="Email" required />
      <input id="passwordInput" name="password" type="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
    <p style="color: #666; font-size: 14px; margin-top: 10px;">Use the email and password you registered with.</p>
    <div id="loginMessage" class="login-message"></div>
  `;

  const form = document.getElementById("loginForm");
  form.addEventListener("submit", handleLogin);
}

async function handleLogin(event) {
  event.preventDefault();
  
  // Check if user is on the login page
  if (!window.location.hash.startsWith("#/login")) {
    window.location.hash = "#/register";
    return;
  }
  
  const formData = new FormData(event.target);
  const email = formData.get("email");
  const password = formData.get("password");
  const messageDiv = document.getElementById("loginMessage");

  console.log("Attempting login with:", { email, password: "***" });

  try {
    const response = await fetch("https://v2.api.noroff.dev/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    console.log("Login response:", response.status, data);

    if (response.ok) {
      // Store the access token
      localStorage.setItem("accessToken", data.data.accessToken);
      localStorage.setItem("userName", data.data.name);
      localStorage.setItem("userEmail", data.data.email);
      
      messageDiv.innerHTML = `<p style="color: green;">Login successful! Redirecting...</p>`;
      
      // Redirect to feed after successful login
      setTimeout(() => {
        window.location.hash = "#/feed";
      }, 1000);
    } else {
      const errorMsg = data.errors?.[0]?.message || "Unknown error";
      messageDiv.innerHTML = `<p style="color: red;">Error: ${errorMsg}</p>`;
      console.error("Login failed:", data.errors);
    }
  } catch (error) {
    messageDiv.innerHTML = `<p style="color: red;">Login failed. Please try again.</p>`;    
    console.error("Login error:", error);
  }
}
