export function showHomepage() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <h1>Postly</h1>
    <div id="homepage" class="homepage-container">
      <p>Hello, ${localStorage.getItem("userName") || "Guest"}! Welcome to Postly. You're one stop for all your social needs. You can add posts, view your feed, and manage your profile all in one place. Also can befriend other users to stay connected.</p>
    </div>
  `;

  // handle homepage here
}
