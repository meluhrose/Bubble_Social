const postsPerPage = 15;
let isEditingPost = false;
let loadedPosts = [];
let currentSearchTerm = "";
let currentUserIdentity = { name: "", email: "" };
let currentPage = 1;
let hasMorePages = true;
let isLoadingPosts = false;
let scrollObserver = null;
let feedListenersAttached = false;

import { getUserIdentity, isPostOwner} from "../src/main.js";
import { handleEditPost, handleDeletePost } from "./post.js";
import { showAlert, showConfirm, updateLoadingStatus, postMatchesSearch } from "../src/utils.js";
import { fetchPostsPage, fetchPostsForSearch, createPost } from "../src/api.js";

// Function to update navbar with links
function updateNavbar() {
  const isLoggedIn = Boolean(localStorage.getItem("accessToken"));
  const nav = document.querySelector("nav");
  const navUl = document.querySelector("nav ul");
  
  if (navUl) {
    navUl.innerHTML = `
      ${isLoggedIn ? `
        <li><a href="#/feed">Feed</a></li>
        <li><a href="#/profile">Profile</a></li>
        <li><a href="#" id="logoutLink"><i class="fa-solid fa-arrow-right-from-bracket"></i></a></li>
      ` : ``}
    `;

    const logoutLink = document.getElementById("logoutLink");
    if (logoutLink) {
      logoutLink.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userName");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("apiKey");
        window.location.hash = "#/login";
        updateNavbar();
      });
    }
  }
}

function resetFeedState() {
  loadedPosts = [];
  currentSearchTerm = "";
  currentPage = 1;
  hasMorePages = true;
  isLoadingPosts = false;
  feedListenersAttached = false;

  if (scrollObserver) {
    scrollObserver.disconnect();
    scrollObserver = null;
  }
}

export function showFeed() {
  const app = document.getElementById("app");
  const nav = document.querySelector("nav");
  
  if (nav) nav.style.display = "block";
  updateNavbar();

  app.innerHTML = `
 <h1>Feed</h1>

    <form id="createPostForm" class="create-post-form">
    <input type="text" name="title" placeholder="Post title" required />
      <textarea name="body" placeholder="What's on your mind?" required></textarea>
      <input type="url" name="imageUrl" placeholder="Image URL (optional)" />
      <input type="text" name="imageAlt" placeholder="Image description (optional)" />
      <button type="submit">Post</button>
    </form>

    <div class="search-container">
      <input id="feedSearchInput" type="search" placeholder="Search posts..." class="create-post-form" />
      <button id="clearSearchBtn" type="button" style="display: none;">Clear</button>
    </div>
   
    <div id="feed" class="feed-container">
      <p>Loading posts...</p>
    </div>

    <p id="feedLoadingStatus" class="pageIndicator"></p>
    <div id="feedLoadMoreTrigger" aria-hidden="true"></div>
  `;

  // handle feed here
  resetFeedState();
  fetchAndDisplayPosts();
  setupInfiniteScroll();
  setupFeedEventListeners();
  
  // Setup create post form
  const createPostForm = document.getElementById("createPostForm");
  createPostForm.addEventListener("submit", handleCreatePost);

  const searchInput = document.getElementById("feedSearchInput");  const clearSearchBtn = document.getElementById("clearSearchBtn");

  searchInput.addEventListener("input", async (event) => {
    currentSearchTerm = event.target.value.trim().toLowerCase();

    if (currentSearchTerm) {
      // Disable infinite scroll during search
      if (scrollObserver) {
        scrollObserver.disconnect();
      }
      // Load all posts for searching
      await loadAllPostsForSearch();
    } else {
      // Re-enable infinite scroll when search is cleared
      resetFeedState();
      fetchAndDisplayPosts();
      setupInfiniteScroll();
    }
  });

  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearSearchBtn.style.display = "none";
    currentSearchTerm = "";
    resetFeedState();
    fetchAndDisplayPosts();
    setupInfiniteScroll();
  });
}

function setupFeedEventListeners() {
  const feedDiv = document.getElementById("feed");
  if (!feedDiv || feedListenersAttached) return;
  
  feedListenersAttached = true;
  
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
        if (isHidden) {

          form.style.display = "flex";
          target.textContent = "Cancel";
          isEditingPost = true;

          if(scrollObserver) {
            scrollObserver.disconnect();
          }
        } else {
          form.style.display = "none";
          target.textContent = "Edit Post";
          isEditingPost = false;
          setupInfiniteScroll();
        }
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
      
      showConfirm(`Are you sure you want to delete ${label}?`).then(confirmed => {
        if (confirmed) {
          handleDeletePost(postId, target);
        }
      });
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
  if (!trigger || isEditingPost) return;

  if (scrollObserver) {
    scrollObserver.disconnect();
  }

  scrollObserver = new IntersectionObserver((entries) => {
    const isVisible = entries.some((entry) => entry.isIntersecting);

    if (isVisible && !isEditingPost && !isLoadingPosts) {
      loadMorePosts();
    }
  }, {
    root: null,
    rootMargin: " 300px 0px",
    threshold: 0.1
  });
  scrollObserver.observe(trigger);
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

  // Store open edit form state before re-rendering
  const openEditForm = feedDiv.querySelector('.edit-post-form[style*="display: flex"]');
  const openFormPostId = openEditForm?.dataset.postId;
  const openFormValues = openFormPostId ? {
    title: openEditForm.querySelector('[name="title"]')?.value,
    body: openEditForm.querySelector('[name="body"]')?.value,
    imageUrl: openEditForm.querySelector('[name="imageUrl"]')?.value,
    imageAlt: openEditForm.querySelector('[name="imageAlt"]')?.value
  } : null;

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
        <button class="edit-post-btn" data-post-id="${post.id}">${openFormPostId === post.id ? "Cancel" : "Edit Post"}</button>
        <button class="delete-btn delete-post-btn" data-post-id="${post.id}">Delete Post</button>
      </div>

      <form class="create-post-form edit-post-form" data-post-id="${post.id}" style="display: ${openFormPostId === post.id ? "flex" : "none"}; margin-top: 16px;">
        <input type="text" name="title" placeholder="Post title" value="${openFormPostId === post.id && openFormValues?.title ? openFormValues.title : (post.title || "")}" required />
        <textarea name="body" placeholder="What's on your mind?" required>${openFormPostId === post.id && openFormValues?.body ? openFormValues.body : (post.body || "")}</textarea>
        <input type="url" name="imageUrl" placeholder="Image URL (optional)" value="${openFormPostId === post.id && openFormValues?.imageUrl ? openFormValues.imageUrl : (post.media?.url || "")}" />
        <input type="text" name="imageAlt" placeholder="Image description (optional)" value="${openFormPostId === post.id && openFormValues?.imageAlt ? openFormValues.imageAlt : (post.media?.alt || "")}" />
        <button type="submit">Save Changes</button>
      </form>
    ` : ""}
  </div>
`;
  }).join("");
}

function updateFeedDisplay() {
  const filteredPosts = loadedPosts.filter(post => postMatchesSearch(post, currentSearchTerm));
  renderPosts(filteredPosts, currentSearchTerm);
}

async function loadAllPostsForSearch() {
  try {
    const posts = await fetchPostsForSearch(100);

    loadedPosts = posts;
    currentUserIdentity = getUserIdentity(localStorage.getItem("accessToken"));

    updateFeedDisplay();

  } catch (error) {
    showAlert(error.message, "error");
  }
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
  if (isLoadingPosts || !hasMorePages || isEditingPost) return;

  isLoadingPosts = true;

  try {
    const data = await fetchPostsPage(currentPage, postsPerPage);

    const newPosts = data.data || [];
    loadedPosts.push(...newPosts);

    hasMorePages = data.meta ? !data.meta.isLastPage : false;
    if (hasMorePages) currentPage++;

    currentUserIdentity = getUserIdentity(localStorage.getItem("accessToken"));
    updateFeedDisplay();

  } catch (error) {
    console.error(error);
    showAlert(error.message, "error");
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
    showAlert("Post cannot be empty", 'error');
    return;
  }

  if (imageUrl) {
    try {
      new URL(imageUrl);
    } catch {
      showAlert("Please enter a valid image URL", 'error');
      return;
    }
  }

  const payload = {
    title,
    body: body.trim()
  };

  if (!title) {
    showAlert("Title cannot be empty", 'error');
    return;
  }

  if (imageUrl) {
    payload.media = {
      url: imageUrl,
      alt: imageAlt || "Post image"
    };
  }

  try {
  await createPost(payload);

  event.target.reset();
  showAlert("Post created successfully", "success");
  fetchAndDisplayPosts();
  updateNavbar();

} catch (error) {
  showAlert(error.message, "error");
}
}