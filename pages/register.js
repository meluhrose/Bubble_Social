export function showRegister() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <h1>Register</h1>
    <form id="registerForm" class="register-form">
      <input name="name" placeholder="Name" required />
      <input name="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <input name="passwordConfirmation" type="password" placeholder="Confirm Password" required />
      <button>Register</button>
    </form>
  `;

  // handle registration here
}
