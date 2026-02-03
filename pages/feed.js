export function showFeed() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <h1>Feed</h1>
    <div id="feed" class="feed-container">
      <p>Your feed will appear here...</p>
    </div>
  `;

  // handle feed here
}
