import { showAlert, showConfirm } from "../utils.js";
import { getUserIdentity, isPostOwner } from "../main.js";

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
    <button id="backToFeed" class="back-to-feed-btn">Back to Feed</button>
  `;

  fetchAndDisplaySinglePost(postId);
  
  document.getElementById("backToFeed").addEventListener("click", () => {
    window.location.hash = "#/feed";
  });
}

/**
 * Fetches and displays a single post with author information and edit controls.
 * Checks user authentication and ownership to show appropriate controls.
 * @async
 * @param {string} postId - The unique identifier of the post to display
 * @returns {Promise<void>}
 */
async function fetchAndDisplaySinglePost(postId) {
  const postDiv = document.getElementById("singlePost");
  const accessToken = localStorage.getItem("accessToken");
  const apiKey = localStorage.getItem("apiKey");

  if (!accessToken || !apiKey) {
    window.location.hash = "#/login";
    return;
  }

  try {
    const response = await fetch(`https://v2.api.noroff.dev/social/posts/${postId}?_author=true`, {
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
    const userIdentity = getUserIdentity(accessToken);
    const canEdit = isPostOwner(post, userIdentity);

    postDiv.innerHTML = `
      <div class="single-post">
        <div id="post-author-info" class="post-author-info">
        <p class="avatar">${post.author?.avatar?.url ? `<img src="${post.author.avatar.url}" class="post-avatar" alt="${post.author.avatar.alt || "Avatar"}" />` : ""}</p>
        <p class="post-author"><a href="#/profile/${post.author?.name || ""}">${post.author?.name || "Anonymous"}</a></p>
        </div>
        ${post.title ? `<h2 class="post-title">${post.title}</h2>` : ""}
        ${post.body ? `<p class="post-body">${post.body}</p>` : ""}
        ${post.media?.url ? `<img src="${post.media.url}" alt="${post.media.alt || "Post image"}" class="post-image" />` : ""}
        <p class="post-date">${new Date(post.created).toLocaleDateString()}</p>
        <div class="post-stats">
          <p><i class="fa-regular fa-heart"></i> ${post._count?.Likes || 0} Likes</p>
          <p><i class="fa-regular fa-comment"></i> ${post._count?.comments || 0} comments</p>
        </div>
        ${canEdit ? `<button id="editPostBtn">Edit Post</button>` : ""}
        ${canEdit ? `<button id="deletePostBtn" type="button">Delete Post</button>` : ""}
      </div>
      ${canEdit ? `
        <form id="editPostForm" class="create-post-form" style="display: none; margin-top: 16px;">
          <input type="text" name="title" placeholder="Post title" value="${post.title || ""}" required />
          <textarea name="body" placeholder="What's on your mind?" required>${post.body || ""}</textarea>
          <input type="url" name="imageUrl" placeholder="Image URL (optional)" value="${post.media?.url || ""}" />
          <input type="text" name="imageAlt" placeholder="Image description (optional)" value="${post.media?.alt || ""}" />
          <button type="submit">Save Changes</button>
        </form>
      ` : ""}
    `;

    if (canEdit) {
      const editPostBtn = document.getElementById("editPostBtn");
      const editPostForm = document.getElementById("editPostForm");
      const deletePostBtn = document.getElementById("deletePostBtn");

      editPostBtn.addEventListener("click", () => {
        const isHidden = editPostForm.style.display === "none";
        editPostForm.style.display = isHidden ? "flex" : "none";
        editPostBtn.textContent = isHidden ? "Cancel" : "Edit Post";
      });

      editPostForm.addEventListener("submit", (event) => {
        handleEditPost(event, postId);
      });
      deletePostBtn.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const label = post.title ? `"${post.title}"` : "this post";
        const confirmed = await showConfirm(`Are you sure you want to delete ${label}?`);
        
        if (!confirmed) {
          showAlert("Post deletion cancelled", 'info');
          return;
        }

        handleDeletePost(postId, deletePostBtn, () => {
          window.location.hash = "#/feed";
        });
      });
    }
  } catch (error) {
    console.error("Error fetching single post:", error);
    postDiv.innerHTML = `<p style="color: red;">An error occurred while loading the post.</p>`;
  }
}

export async function handleEditPost(event, postId) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const title = formData.get("title").trim();
  const body = formData.get("body").trim();
  const imageUrl = formData.get("imageUrl").trim();
  const imageAlt = formData.get("imageAlt").trim();
  const accessToken = localStorage.getItem("accessToken");
  const apiKey = localStorage.getItem("apiKey");

  if (!title || !body) {
    showAlert("Title and post text are required", 'error');
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
      showAlert(`Error: ${data.errors?.[0]?.message || "Failed to update post"}`, 'error');
      return;
    }

    showAlert("Post updated successfully", 'success');
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  } catch (error) {
    console.error("Error updating post:", error);
    showAlert("Failed to update post", 'error');
  }
}

export async function handleDeletePost(postId, deleteButton = null, onSuccess = null) {
  const accessToken = localStorage.getItem("accessToken");
  const apiKey = localStorage.getItem("apiKey");

  if (!accessToken || !apiKey) {
    showAlert("Session expired. Please log in again.", 'error');
    window.location.hash = "#/login";
    return;
  }

  const initialText = deleteButton?.textContent;
  if (deleteButton) {
    deleteButton.disabled = true;
    deleteButton.textContent = "Deleting...";
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
      showAlert(`Error (${response.status}): ${errorMessage}`, 'error');
      return;
    }
    showAlert("Post deleted successfully", 'success');
    setTimeout(() => {
      if (onSuccess) {
        onSuccess();
      }
      location.reload();
    }, 1500);
  } catch (error) {
    console.error("Error deleting post:", error);
    showAlert("Failed to delete post", 'error');
  } finally {
    if (deleteButton) {
      deleteButton.disabled = false;
      deleteButton.textContent = initialText || "Delete Post";
    }
  }
}