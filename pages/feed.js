let currentPage = 1;
const postsPerPage = 10;

export function showFeed() {
  const app = document.getElementById("app");

  app.innerHTML = `
 <h1>Feed</h1>

    <form id="createPostForm" class="create-post-form">
    <input type="text" name="title" placeholder="Post title" required />
      <textarea
        name="body"
        placeholder="What's on your mind?"
        required
      ></textarea>
      <input type="file" name="image" accept="image/*" />
      <button type="submit">Post</button>
    </form>

    <div id="feed" class="feed-container">
      <p>Loading posts...</p>
    </div>

    <div id="pagination" class="pagination">
      <button id="prevBtn" class="prevBtn">Previous</button>
      <span id="pageIndicator" class="pageIndicator"></span>
      <button id="nextBtn" class="nextBtn">Next</button>
    </div>
  `;

  // handle feed here
  fetchAndDisplayPosts();
  
  // Setup create post form
  const createPostForm = document.getElementById("createPostForm");
  createPostForm.addEventListener("submit", handleCreatePost);
}

async function fetchAndDisplayPosts() {
  const feedDiv = document.getElementById("feed");
  const accessToken = localStorage.getItem("accessToken");
  const apiKey = localStorage.getItem("apiKey");
  
  if (!accessToken || !apiKey) {
  window.location.hash = "#/login";
  return;
}
  
  console.log("Fetching posts with API key:", apiKey ? "Present" : "Missing");
  
  try {
    const response = await fetch(`https://v2.api.noroff.dev/social/posts?limit=${postsPerPage}&page=${currentPage}`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "X-Noroff-API-Key": apiKey
      }
    });
    const data = await response.json();
    console.log("API Response:", response.status, data);
    
    if (!response.ok) {
      feedDiv.innerHTML = `<p style="color: red;">Error fetching posts: ${data.errors?.[0]?.message || 'Unknown error'}</p>`;
      return;
    }
    
    const posts = data.data;
    const meta = data.meta;
    
    if (!posts || posts.length === 0) {
      feedDiv.innerHTML = `<p>No posts available.</p>`;
      return;
    }
    
    feedDiv.innerHTML = posts.map(post => `
  <div class="post-section">
    ${post.title ? `<h2 class="post-title">${post.title}</h2>` : ""}
    <p class="post-author">${post.author?.name || "Anonymous"}</p>
    ${post.body ? `<p class="post-body">${post.body}</p>` : ""}
    ${post.media?.url? `
          <img src="${post.media.url}" alt="${post.media.alt || "Post image"}" class="post-image"/>`: ""}
    <div class="post-meta">
      <span>${new Date(post.created).toLocaleDateString()}</span>
      <p>
      <span><i class="fa-regular fa-heart"></i> ${post.reactions?.length || 0}</span>
      <span><i class="fa-regular fa-comment"></i> ${post.comments?.length || 0}</span>
      </p>
    </div>
  </div>
`).join("");
    
    // Update pagination buttons
    if (meta) {
      paginationButtons(meta);
    }
  } catch (error) {
    console.error("Error fetching posts:", error);
    feedDiv.innerHTML = `<p style="color: red;">An error occurred: ${error.message}</p>`;
  }
}

// Pagination button event listeners
function paginationButtons(meta) {
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const pageIndicator = document.getElementById("pageIndicator");

  if (!prevBtn || !nextBtn || !pageIndicator) return;

  pageIndicator.textContent = `Page ${meta.currentPage} of ${meta.pageCount}`;

  prevBtn.disabled = meta.isFirstPage;
  nextBtn.disabled = meta.isLastPage;

  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      fetchAndDisplayPosts();
    }
  };

  nextBtn.onclick = () => {
    if (currentPage < meta.pageCount) {
      currentPage++;
      fetchAndDisplayPosts();
    }
  };
}

// Handle create post
async function handleCreatePost(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const body = formData.get("body");
  const accessToken = localStorage.getItem("accessToken");
  const apiKey = localStorage.getItem("apiKey");

  if (!body.trim()) {
    alert("Post cannot be empty");
    return;
  }

  try {
    const response = await fetch("https://v2.api.noroff.dev/social/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "X-Noroff-API-Key": apiKey
      },
      body: JSON.stringify({ title: formData.get("title").trim(), body: body.trim() })
    });

    const data = await response.json();
    
    if (response.ok) {
      event.target.reset();
      currentPage = 1;
      fetchAndDisplayPosts();
    } else {
      alert(`Error: ${data.errors?.[0]?.message || 'Failed to create post'}`);
    }
  } catch (error) {
    console.error("Error creating post:", error);
    alert("Failed to create post");
  }
}
