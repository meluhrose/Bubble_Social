export function showHomepage() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <h1>Bubble</h1>
    <div id="homepage" class="homepage-container">
      <p>Hello, ${localStorage.getItem("userName") || ""} and Welcome to Bubble. You're one stop for all your social needs. You can add posts, view your feed, and manage your profile all in one place. Also can befriend other users to stay connected.</p>
      <div id="homepageButtons" class="homepage-buttons">
      <p>To get started, please log in or register for an account.</p>
      <button onclick="window.location.href='#/login'">Login</button>
      <button onclick="window.location.href='#/register'">Register</button>
      </div>
    </div>
  `;

  // handle homepage here
  updateHomepage();
}


function updateHomepage() {
  const isLoggedIn = Boolean(localStorage.getItem("accessToken"));
  const homepageButtons = document.getElementById("homepageButtons");

    if (isLoggedIn) {
    homepageButtons.style.display = "none";
  } else {
    homepageButtons.style.display = "block";
  }
}