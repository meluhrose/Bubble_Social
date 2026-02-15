const postsPerPage = 15;
let loadedPosts = [];
let currentSearchTerm = "";
let currentUserIdentity = { name: "", email: "" };
let currentPage = 1;
let hasMorePages = true;
let isLoadingPosts = false;
let scrollObserver = null;

import { getUserIdentity, isPostOwner } from "../main.js";

export function showFeed() {
  const app = document.getElementById("app");

  app.innerHTML = `
 <h1>Feed</h1>

    <form id="createPostForm" class="create-post-form">
    <input type="text" name="title" placeholder="Post title" required />
      <textarea name="body" placeholder="What's on your mind?" required></textarea>
      <input type="url" name="imageUrl" placeholder="Image URL (optional)" />
      <input type="text" name="imageAlt" placeholder="Image description (optional)" />
      <button type="submit">Post</button>
    </form>

    <input id="feedSearchInput" type="search" placeholder="Search posts..." class="create-post-form" />

    <div id="feed" class="feed-container">
      <p>Loading posts...</p>
    </div>

    <p id="feedLoadingStatus" class="pageIndicator"></p>
    <div id="feedLoadMoreTrigger" aria-hidden="true"></div>
  `;

  // handle feed here
  fetchAndDisplayPosts();
  setupInfiniteScroll();
  
  // Setup create post form
  const createPostForm = document.getElementById("createPostForm");
  createPostForm.addEventListener("submit", handleCreatePost);

  const searchInput = document.getElementById("feedSearchInput");
  searchInput.addEventListener("input", (event) => {
    currentSearchTerm = event.target.value.trim().toLowerCase();
    updateFeedDisplay();
  });
}

function normalizeSearchValue(value) {
  return (value || "").toString().trim().toLowerCase();
}

function setupInfiniteScroll() {
  const trigger = document.getElementById("feedLoadMoreTrigger");
  if (!trigger) return;

  if (scrollObserver) {
    scrollObserver.disconnect();
  }

  scrollObserver = new IntersectionObserver(
    (entries) => {
      const isVisible = entries.some((entry) => entry.isIntersecting);
      if (isVisible) {
        loadMorePosts();
      }
    },
    {
      root: null,
      rootMargin: "300px 0px",
      threshold: 0.1
    }
  );

  scrollObserver.observe(trigger);
}

function updateLoadingStatus(message) {
  const status = document.getElementById("feedLoadingStatus");
  if (!status) return;
  status.textContent = message || "";
}

function postMatchesSearch(post, searchTerm) {
  if (!searchTerm) return true;

  const searchableValues = [
    post.title,
    post.body,
    post.author?.name,
    post.author?.email,
    post.media?.alt
  ];

  return searchableValues.some((value) =>
    normalizeSearchValue(value).includes(searchTerm)
  );
}

function renderPosts(posts, searchTerm = "") {
  const feedDiv = document.getElementById("feed");
  if (!feedDiv) return;

  if (!posts || posts.length === 0) {
    feedDiv.innerHTML = searchTerm
      ? `<p>No posts found for "${searchTerm}".</p>`
      : `<p>No posts available.</p>`;
    return;
  }

  const postsById = new Map(loadedPosts.map((post) => [post.id, post]));

  feedDiv.innerHTML = posts.map(post => `
  <div class="post-section" data-post-id="${post.id}" style="cursor: pointer;">
    ${post.title ? `<h2 class="post-title">${post.title}</h2>` : ""}
    <p class="post-author">${post.author?.name || "Anonymous"}</p>
    ${post.body ? `<p class="post-body">${post.body}</p>` : ""}
    ${post.media?.url? `
          <img src="${post.media.url}" alt="${post.media.alt || "Post image"}" class="post-image"/>`: ""}
    ${isPostOwner(post, currentUserIdentity) ? `
      <button type="button" class="edit-post-btn" data-post-id="${post.id}">Edit Post</button>
      <button type="button" class="delete-post-btn" data-post-id="${post.id}">Delete</button>
      <form class="edit-post-form create-post-form" data-post-id="${post.id}" style="display: none; margin-top: 12px;">
        <input type="text" name="title" placeholder="Post title" required />
        <textarea name="body" placeholder="What's on your mind?" required></textarea>
        <input type="url" name="imageUrl" placeholder="Image URL (optional)" />
        <input type="text" name="imageAlt" placeholder="Image description (optional)" />
        <button type="submit">Save Changes</button>
      </form>
    ` : ""}
    <div class="post-meta">
      <span>${new Date(post.created).toLocaleDateString()}</span>
      <p>
      <div class="post-stats">
          <p><i class="fa-regular fa-heart"></i> ${post._count?.reactions || 0} reactions</p>
          <p><i class="fa-regular fa-comment"></i> ${post._count?.comments || 0} comments</p>
          
        </div>
    </div>
  </div>
`).join("");

  const postElements = feedDiv.querySelectorAll(".post-section");
  postElements.forEach(postElement => {
    postElement.addEventListener("click", (event) => {
      if (event.target.closest(".edit-post-btn") || event.target.closest(".delete-post-btn") || event.target.closest(".edit-post-form")) {
        return;
      }
      const postId = postElement.dataset.postId;
      window.location.hash = `#/post/${postId}`;
    });
  });

  const editButtons = feedDiv.querySelectorAll(".edit-post-btn");
  editButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();

      const postId = button.dataset.postId;
      const form = feedDiv.querySelector(`.edit-post-form[data-post-id="${postId}"]`);
      const post = postsById.get(postId);

      if (!form || !post) return;

      const isHidden = form.style.display === "none";
      form.style.display = isHidden ? "block" : "none";
      button.textContent = isHidden ? "Cancel" : "Edit Post";

      if (isHidden) {
        form.elements.title.value = post.title || "";
        form.elements.body.value = post.body || "";
        form.elements.imageUrl.value = post.media?.url || "";
        form.elements.imageAlt.value = post.media?.alt || "";
      }
    });
  });

  const editForms = feedDiv.querySelectorAll(".edit-post-form");
  editForms.forEach((form) => {
    form.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    form.addEventListener("submit", (event) => {
      const postId = form.dataset.postId;
      handleEditPostFromFeed(event, postId);
    });
  });

  const deleteButtons = feedDiv.querySelectorAll(".delete-post-btn");
  deleteButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const postId = button.dataset.postId;
      handleDeletePostFromFeed(postId);
    });
  });
}

function updateFeedDisplay() {
  const filteredPosts = loadedPosts.filter((post) => postMatchesSearch(post, currentSearchTerm));
  renderPosts(filteredPosts, currentSearchTerm);
}

async function fetchAndDisplayPosts() {
  loadedPosts = [];
  currentPage = 1;
  hasMorePages = true;
  updateLoadingStatus("Loading posts...");

  const feedDiv = document.getElementById("feed");
  if (feedDiv) {
    feedDiv.innerHTML = `<p>Loading posts...</p>`;
  }

  await loadMorePosts();
}

async function loadMorePosts() {
  const feedDiv = document.getElementById("feed");
  const accessToken = localStorage.getItem("accessToken");
  const apiKey = localStorage.getItem("apiKey");

  if (isLoadingPosts || !hasMorePages) {
    return;
  }
  
  if (!accessToken || !apiKey) {
    window.location.hash = "#/login";
    return;
  }

  isLoadingPosts = true;
  
  console.log("Fetching posts with API key:", apiKey ? "Present" : "Missing");
  
  try {
    const response = await fetch(`https://v2.api.noroff.dev/social/posts?limit=${postsPerPage}&page=${currentPage}&_author=true`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "X-Noroff-API-Key": apiKey
      }
    });
    const data = await response.json();
    console.log("API Response:", response.status, data);

    if (!response.ok) {
      if (feedDiv) {
        feedDiv.innerHTML = `<p style="color: red;">Error fetching posts: ${data.errors?.[0]?.message || "Unknown error"}</p>`;
      }
      updateLoadingStatus("");
      return;
    }

    const newPosts = data.data || [];
    loadedPosts.push(...newPosts);

    hasMorePages = data.meta ? !data.meta.isLastPage : false;
    if (hasMorePages) {
      currentPage += 1;
    }

    currentUserIdentity = getUserIdentity(accessToken);
    updateFeedDisplay();

    if (hasMorePages) {
      updateLoadingStatus("Scroll down to load 15 more posts...");
    } else {
      updateLoadingStatus("All posts loaded");
    }
  } catch (error) {
    console.error("Error fetching posts:", error);
    if (feedDiv) {
      feedDiv.innerHTML = `<p style="color: red;">An error occurred: ${error.message}</p>`;
    }
    updateLoadingStatus("");
  } finally {
    isLoadingPosts = false;
  }
}

// Handle create post
async function handleCreatePost(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const title = formData.get("title").trim();
  const body = formData.get("body");
  const imageUrl = formData.get("imageUrl").trim();
  const imageAlt = formData.get("imageAlt").trim();
  const accessToken = localStorage.getItem("accessToken");
  const apiKey = localStorage.getItem("apiKey");

  if (!body.trim()) {
    alert("Post cannot be empty");
    return;
  }

  if (imageUrl) {
    try {
      new URL(imageUrl);
    } catch {
      alert("Please enter a valid image URL");
      return;
    }
  }

  const payload = {
    title,
    body: body.trim()
  };

  if (imageUrl) {
    payload.media = {
      url: imageUrl,
      alt: imageAlt || "Post image"
    };
  }

  try {
    const response = await fetch("https://v2.api.noroff.dev/social/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "X-Noroff-API-Key": apiKey
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (response.ok) {
      event.target.reset();
      fetchAndDisplayPosts();
    } else {
      alert(`Error: ${data.errors?.[0]?.message || 'Failed to create post'}`);
    }
  } catch (error) {
    console.error("Error creating post:", error);
    alert("Failed to create post");
  }
}

async function handleEditPostFromFeed(event, postId) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const title = formData.get("title").trim();
  const body = formData.get("body").trim();
  const imageUrl = formData.get("imageUrl").trim();
  const imageAlt = formData.get("imageAlt").trim();
  const accessToken = localStorage.getItem("accessToken");
  const apiKey = localStorage.getItem("apiKey");

  if (!title || !body) {
    alert("Title and post text are required");
    return;
  }

  if (imageUrl) {
    try {
      new URL(imageUrl);
    } catch {
      alert("Please enter a valid image URL");
      return;
    }
  }

  const payload = { title, body };

  if (imageUrl) {
    payload.media = {
      url: imageUrl,
      alt: imageAlt || "Post image"
    };
  }

  try {
    const response = await fetch(`https://v2.api.noroff.dev/social/posts/${postId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "X-Noroff-API-Key": apiKey
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      alert(`Error: ${data.errors?.[0]?.message || "Failed to update post"}`);
      return;
    }

    alert("Post updated successfully");
    fetchAndDisplayPosts();
  } catch (error) {
    console.error("Error updating post:", error);
    alert("Failed to update post");
  }
}

async function handleDeletePostFromFeed(postId) {
  const accessToken = localStorage.getItem("accessToken");
  const apiKey = localStorage.getItem("apiKey");

  const confirmed = confirm("Are you sure you want to delete this post?");
  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`https://v2.api.noroff.dev/social/posts/${postId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "X-Noroff-API-Key": apiKey
      }
    });

    if (!response.ok) {
      let errorMessage = "Failed to delete post";
      try {
        const data = await response.json();
        errorMessage = data.errors?.[0]?.message || errorMessage;
      } catch {
        errorMessage = "Failed to delete post";
      }

      alert(`Error: ${errorMessage}`);
      return;
    }

    alert("Post deleted successfully");
    fetchAndDisplayPosts();
  } catch (error) {
    console.error("Error deleting post:", error);
    alert("Failed to delete post");
  }
}
