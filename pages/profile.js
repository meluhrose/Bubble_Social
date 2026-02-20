import { showAlert } from "../src/utils.js";
import {fetchProfile, updateProfile, followUser, unfollowUser} from "../src/api.js";

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
    const profile = await fetchProfile(targetUsername);
    renderProfile(profile, currentUserName);
  } catch (error) {
    profileDiv.innerHTML = `<p>${error.message}</p>`;
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
      if (unfollow) {
        await unfollowUser(profileName);
      } else {
        await followUser(profileName);
      }

      fetchAndDisplayProfile(profileName);
    } catch (error) {
      showAlert(error.message, "error");
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
      await updateProfile(userName, payload);

      showAlert("Profile updated successfully", "success");
      
      // Hide the form and reset button
      editProfileForm.style.display = "none";
      editProfileBtn.textContent = "Edit profile";

      setTimeout(() => {
        window.location.hash = `#/profile/${userName}`;
      }, 1500);
    } catch (error) {
      showAlert(error.message, "error");
    }
  }

  if (editProfileForm) {
    editProfileForm.addEventListener("submit", handleEditProfile);
  }
}