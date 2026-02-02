export function showRegister() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <h1>Register</h1>
    <form id="registerForm">
      <input name="email" />
      <input name="password" type="password" />
      <button>Register</button>
    </form>
  `;

  // handle registration here
}
