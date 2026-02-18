import { showAlert } from "../utils.js";

export function showProfile() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <h1>Profile</h1>
    <div id="profileInfo" class="profile-container">
      <p>Your profile information will appear here...</p>
    </div>
  `;

  // Get username from URL hash or use current user
  const hash = window.location.hash;
  const profileMatch = hash.match(/#\/profile\/(.+)/);
  const profileUsername = profileMatch ? decodeURIComponent(profileMatch[1]) : null;

  // handle profile here
  fetchAndDisplayProfile(profileUsername);
}

async function fetchAndDisplayProfile(profileUsername = null) {
  const profileDiv = document.getElementById("profileInfo");

  const accessToken = localStorage.getItem("accessToken");
  const apiKey = localStorage.getItem("apiKey");
  const currentUserName = localStorage.getItem("userName");

  if (!accessToken || !apiKey || !currentUserName) {
    window.location.hash = "#/login";
    return;
  }

  // Use provided username or default to current user
  const targetUsername = profileUsername || currentUserName;

  try {
    const response = await fetch(
      `https://v2.api.noroff.dev/social/profiles/${targetUsername}?_posts=true&_followers=true&_following=true`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Noroff-API-Key": apiKey
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      profileDiv.innerHTML = `<p>Error loading profile</p>`;
      return;
    }

    renderProfile(data.data, currentUserName);
  } catch (error) {
    profileDiv.innerHTML = `<p>Something went wrong</p>`;
  }
}

function renderProfile(profile, currentUser) {
  const profileDiv = document.getElementById("profileInfo");
  const isOwnProfile = profile.name === currentUser;

  const isFollowing = profile.followers?.some(
    follower => follower.name === currentUser
  );

  profileDiv.innerHTML = `
  <div class="profile-card">
    <h2>${profile.name}</h2>
    <p>${profile.email}</p>

    ${profile.avatar?.url
      ? `<img src="${profile.avatar.url}" class="profile-pic" alt="${profile.avatar.alt || "Avatar"}" />`
      : ""
    }

    <p>${profile.bio || "No bio has been added yet."}</p>

     ${isOwnProfile ? `<button id="editProfileBtn">Edit profile</button>` : ""}

    ${isOwnProfile ? `
    <form id="editProfileForm" class="create-post-form" style="display:none;">
      <textarea name="bio" placeholder="Write a little bit about yourself here...">${profile.bio || ""}</textarea>

      <input type="url" name="avatarUrl" placeholder="Avatar URL"
        value="${profile.avatar?.url || ""}" />

      <input type="text" name="avatarAlt" placeholder="Avatar description"
        value="${profile.avatar?.alt || ""}" />

      <button type="submit">Save changes</button>
    </form>
    ` : ""}
    <div class= "follow-info">
  ${!isOwnProfile ? `
  <button
    id="followBtn"
    class="follow-btn"
    data-following="${isFollowing}">
    ${isFollowing ? "Unfollow" : "Follow"}
  </button>
` : ""}
    <p><i class="fa-solid fa-users"></i> ${profile._count?.followers || 0} followers</p>
    <p><i class="fa-solid fa-user-plus"></i> ${profile._count?.following || 0} following</p>
  </div>
  </div>
  <h1>${isOwnProfile ? "Your posts" : `Posts by ${profile.name}`}</h1>
  <div class="posts-container">
    ${profile.posts && profile.posts.length > 0
      ? profile.posts.map(post => `
        <div class="single-post post-section">
          <h2>${post.title || "Untitled post"}</h2>
          <p>${post.body ? post.body.substring(0, 100) + "..." : "No content"}</p>
          <button onclick="window.location.href='#/post/${post.id}'">View post</button>
        </div>
      `).join("")
      : "<p>No posts available</p>"
    }
  </div>
`;

// Handle follow/unfollow button
const followBtn = document.getElementById("followBtn");

if (followBtn) {
  followBtn.addEventListener("click", async () => {
    const shouldUnfollow = followBtn.dataset.following === "true";
    await toggleFollow(profile.name, shouldUnfollow);
  });

  async function toggleFollow(profileName, unfollow = false) {
    const accessToken = localStorage.getItem("accessToken");
    const apiKey = localStorage.getItem("apiKey");

    const endpoint = unfollow
    ? "unfollow"
    : "follow";

    try {
      const response = await fetch(
        `https://v2.api.noroff.dev/social/profiles/${profileName}/${endpoint}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Noroff-API-Key": apiKey
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showAlert(data.errors?.[0]?.message || "Failed to update follow status", 'error');
        return;
      }

      //Refresh profile to get updated counts and button state
      fetchAndDisplayProfile(profileName);
    } catch (error) {
      showAlert("Something went wrong", 'error');
    }
  }
}

  const editProfileBtn = document.getElementById("editProfileBtn");
  const editProfileForm = document.getElementById("editProfileForm");

  if (editProfileBtn && editProfileForm) {
    editProfileBtn.addEventListener("click", () => {
      const isHidden = editProfileForm.style.display === "none";
      editProfileForm.style.display = isHidden ? "flex" : "none";
      editProfileBtn.textContent = isHidden ? "Cancel" : "Edit profile";
    });
  }

  async function handleEditProfile(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const bio = formData.get("bio").trim();
    const avatarUrl = formData.get("avatarUrl").trim();
    const avatarAlt = formData.get("avatarAlt").trim();
    const bannerUrl = formData.get("bannerUrl")?.trim() || "";
    const bannerAlt = formData.get("bannerAlt")?.trim() || "";

    const accessToken = localStorage.getItem("accessToken");
    const apiKey = localStorage.getItem("apiKey");
    const userName = localStorage.getItem("userName");

    const payload = {};

    if (bio) payload.bio = bio;

    if (avatarUrl) {
      payload.avatar = {
        url: avatarUrl,
        alt: avatarAlt || "Profile avatar"
      };
    }

    if (bannerUrl) {
      payload.banner = {
        url: bannerUrl,
        alt: bannerAlt || "Profile banner"
      };
    }

    try {
      const response = await fetch(
        `https://v2.api.noroff.dev/social/profiles/${userName}?_followers=true&_following=true`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            "X-Noroff-API-Key": apiKey
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showAlert(data.errors?.[0]?.message || "Failed to update profile", 'error');
        return;
      }

      showAlert("Profile updated successfully", 'success');
      
      setTimeout(() => {
        location.reload();
      }, 1500);
    } catch (error) {
      showAlert("Something went wrong", 'error');
    }
  }

  if (editProfileForm) {
    editProfileForm.addEventListener("submit", handleEditProfile);
  }
}