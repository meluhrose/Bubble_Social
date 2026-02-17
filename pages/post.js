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

function normalizeIdentity(value) {
  return (value || "").trim().toLowerCase();
}

function getUserIdentity(accessToken) {
  const storedName = normalizeIdentity(localStorage.getItem("userName"));
  const storedEmail = normalizeIdentity(localStorage.getItem("userEmail"));

  if (storedName || storedEmail) {
    return { name: storedName, email: storedEmail };
  }

  try {
    const tokenParts = accessToken?.split(".");
    if (!tokenParts || tokenParts.length < 2) {
      return { name: "", email: "" };
    }

    const base64 = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
    const normalizedBase64 = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
    const payload = JSON.parse(atob(normalizedBase64));
    return {
      name: normalizeIdentity(payload?.name),
      email: normalizeIdentity(payload?.email)
    };
  } catch {
    return { name: "", email: "" };
  }
}

function isPostOwner(post, userIdentity) {
  const authorName = normalizeIdentity(post?.author?.name);
  const authorEmail = normalizeIdentity(post?.author?.email);

  return Boolean(
    (userIdentity.name && authorName && userIdentity.name === authorName) ||
    (userIdentity.email && authorEmail && userIdentity.email === authorEmail)
  );
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
      deletePostBtn.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();

  const label = post.title ? `"${post.title}"` : "this post";
  const confirmed = confirm(`Are you sure you want to delete ${label}?`);
  if (!confirmed) return;

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
    window.location.reload();
  } catch (error) {
    console.error("Error updating post:", error);
    alert("Failed to update post");
  }
}

export async function handleDeletePost(postId, deleteButton = null, onSuccess = null) {
  const accessToken = localStorage.getItem("accessToken");
  const apiKey = localStorage.getItem("apiKey");

  if (!accessToken || !apiKey) {
    alert("Session expired. Please log in again.");
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
      alert(`Error (${response.status}): ${errorMessage}`);
      return;
    }
    alert("Post deleted successfully");
    if (onSuccess) {
      onSuccess();
    }
    location.reload();
  } catch (error) {
    console.error("Error deleting post:", error);
    alert("Failed to delete post");
  } finally {
    if (deleteButton) {
      deleteButton.disabled = false;
      deleteButton.textContent = initialText || "Delete Post";
    }
  }
}