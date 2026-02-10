export function showPost() {
  const app = document.getElementById("app");
  const hash = window.location.hash;
  const postId = hash.split("/")[2];

  if (!postId) {
    app.innerHTML = `<p style="color: red;">No post ID provided.</p>`;
    return;
  }

  app.innerHTML = `
    <h1>Post</h1>
    <div id="singlePost" class="post-container">
      <p>Loading post...</p>
    </div>
    <button id="backToFeed" class="btn back-to-feed-btn">Back to Feed</button>
  `;

  fetchAndDisplaySinglePost(postId);
  
  document.getElementById("backToFeed").addEventListener("click", () => {
    window.location.hash = "#/feed";
  });
}

async function fetchAndDisplaySinglePost(postId) {
  const postDiv = document.getElementById("singlePost");
  const accessToken = localStorage.getItem("accessToken");
  const apiKey = localStorage.getItem("apiKey");

  if (!accessToken || !apiKey) {
    window.location.hash = "#/login";
    return;
  }

  try {
    const response = await fetch(`https://v2.api.noroff.dev/social/posts/${postId}`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "X-Noroff-API-Key": apiKey
      }
    });

    const data = await response.json();
    console.log("Single post response:", data);

    if (!response.ok) {
      postDiv.innerHTML = `<p style="color: red;">Error: ${data.errors?.[0]?.message || 'Failed to load post'}</p>`;
      return;
    }

    const post = data.data;

    postDiv.innerHTML = `
      <div class="single-post">
        ${post.title ? `<h2>${post.title}</h2>` : ""}
        <p class="post-author">${post.author?.name || "Anonymous"}</p>
        <p class="post-date">${new Date(post.created).toLocaleDateString()}</p>
        ${post.body ? `<p class="post-body">${post.body}</p>` : ""}
        ${post.media?.url ? `<img src="${post.media.url}" alt="${post.media.alt || "Post image"}" class="post-image" />` : ""}
        <div class="post-stats">
          <p><i class="fa-regular fa-heart"></i> ${post._count?.reactions || 0} reactions</p>
          <p><i class="fa-regular fa-comment"></i> ${post._count?.comments || 0} comments</p>
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Error fetching single post:", error);
    postDiv.innerHTML = `<p style="color: red;">An error occurred while loading the post.</p>`;
  }
}

