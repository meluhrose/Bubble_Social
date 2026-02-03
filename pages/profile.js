export function showProfile() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <h1>Profile</h1>
    <div id="profileInfo" class="profile-container">
      <p>Your profile information will appear here...</p>
    </div>
  `;

  // handle profile here
}
