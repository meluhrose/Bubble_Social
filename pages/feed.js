const postsPerPage = 15;
let loadedPosts = [];
let currentSearchTerm = "";
let currentUserIdentity = { name: "", email: "" };
let currentPage = 1;
let hasMorePages = true;
let isLoadingPosts = false;
let scrollObserver = null;

import { getUserIdentity, isPostOwner } from "../main.js";
import { handleEditPost, handleDeletePost } from "./post.js";

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
  setupFeedEventListeners();
  
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

function setupFeedEventListeners() {
  const feedDiv = document.getElementById("feed");
  if (!feedDiv) return;
  
  // Use event delegation - attach one listener to the feed container
  feedDiv.addEventListener("click", (event) => {
    const target = event.target;
    
    // Handle post content clicks (navigate to post detail)
    const postContent = target.closest(".post-content");
    if (postContent && !target.closest("button")) {
      const postId = postContent.closest(".post-section")?.dataset.postId;
      if (postId) {
        window.location.hash = `#/post/${postId}`;
      }
      return;
    }
    
    // Handle edit button clicks
    if (target.classList.contains("edit-post-btn")) {
      event.stopPropagation();
      const postId = target.dataset.postId;
      const form = feedDiv.querySelector(`.edit-post-form[data-post-id="${postId}"]`);
      if (form) {
        const isHidden = form.style.display === "none";
        form.style.display = isHidden ? "flex" : "none";
        target.textContent = isHidden ? "Cancel" : "Edit Post";
      }
      return;
    }
    
    // Handle delete button clicks
    if (target.classList.contains("delete-post-btn")) {
      event.preventDefault();
      event.stopPropagation();
      const postId = target.dataset.postId;
      const post = loadedPosts.find(p => p.id === postId);
      const label = post?.title ? `"${post.title}"` : "this post";
      if (confirm(`Are you sure you want to delete ${label}?`)) {
        handleDeletePost(postId, target);
      }
      return;
    }
  });
  
  // Handle form submissions with event delegation
  feedDiv.addEventListener("submit", (event) => {
    if (event.target.classList.contains("edit-post-form")) {
      const postId = event.target.dataset.postId;
      handleEditPost(event, postId);
    }
  });
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

  feedDiv.innerHTML = posts.map(post => {
    const canEdit = isPostOwner(post, currentUserIdentity);

    return `
  <div class="post-section" data-post-id="${post.id}">
    <div class="post-content" style="cursor: pointer;">
      <div id="post-author-info" class="post-author-info">
      <p class="avatar">${post.author?.avatar?.url ? `<img src="${post.author.avatar.url}" class="post-avatar" alt="${post.author.avatar.alt || "Avatar"}" />` : ""}</p>
        <p class="post-author"><a href="#/profile/${post.author?.name || ""}" onclick="event.stopPropagation()">${post.author?.name || "Anonymous"}</a></p>
        </div>
        ${post.title ? `<h2 class="post-title">${post.title}</h2>` : ""}
        ${post.body ? `<p class="post-body">${post.body}</p>` : ""}
        ${post.media?.url? `
          <img src="${post.media.url}" alt="${post.media.alt || "Post image"}" class="post-image"/>`: ""}
          <div class="post-date">
          <span>${new Date(post.created).toLocaleDateString()}</span>
          <div class="post-stats">
            <p><i class="fa-regular fa-heart"></i> ${post._count?.Likes || 0} Likes</p>
            <p><i class="fa-regular fa-comment"></i> ${post._count?.comments || 0} comments</p>
            </div>
          </div>
    </div>

    ${canEdit ? `
      <div class="post-actions">
        <button class="edit-post-btn" data-post-id="${post.id}">Edit Post</button>
        <button class="delete-btn delete-post-btn" data-post-id="${post.id}">Delete Post</button>
      </div>

      <form class="create-post-form edit-post-form" data-post-id="${post.id}" style="display: none; margin-top: 16px;">
        <input type="text" name="title" placeholder="Post title" value="${post.title || ""}" required />
        <textarea name="body" placeholder="What's on your mind?" required>${post.body || ""}</textarea>
        <input type="url" name="imageUrl" placeholder="Image URL (optional)" value="${post.media?.url || ""}" />
        <input type="text" name="imageAlt" placeholder="Image description (optional)" value="${post.media?.alt || ""}" />
        <button type="submit">Save Changes</button>
      </form>
    ` : ""}
  </div>
`;
  }).join("");
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
    const response = await fetch(`https://v2.api.noroff.dev/social/posts?limit=${postsPerPage}&page=${currentPage}&_author=true&sort=created&sortOrder=desc`, {
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