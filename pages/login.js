export function showLogin() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <h1>Login</h1>
    <form id="loginForm" class="login-form">
      <input name="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
    <div id="loginMessage"></div>
  `;

  const form = document.getElementById("loginForm");
  form.addEventListener("submit", handleLogin);
}

async function handleLogin(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const email = formData.get("email");
  const password = formData.get("password");
  const messageDiv = document.getElementById("loginMessage");

  try {
    const response = await fetch("https://v2.api.noroff.dev/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

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
      messageDiv.innerHTML = `<p style="color: red;">Error: ${data.errors[0].message}</p>`;
    }
  } catch (error) {
    messageDiv.innerHTML = `<p style="color: red;">Login failed. Please try again.</p>`;    
    console.error("Login error:", error);
  }
}
