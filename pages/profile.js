export function showProfile() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <h1>Profile</h1>
    <div id="profileInfo" class="profile-container">
      <p>Your profile information will appear here...</p>
    </div>
  `;

  // handle profile here
  fetchAndDisplayProfile();
}

async function fetchAndDisplayProfile() {
  const profileDiv = document.getElementById("profileInfo");

  const accessToken = localStorage.getItem("accessToken");
  const apiKey = localStorage.getItem("apiKey");
  const userName = localStorage.getItem("userName");

  if (!accessToken || !apiKey || !userName) {
    window.location.hash = "#/login";
    return;
  }

  try {
    const response = await fetch(
      `https://v2.api.noroff.dev/social/profiles/${userName}?_posts=true`,
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

    renderProfile(data.data);
  } catch (error) {
    profileDiv.innerHTML = `<p>Something went wrong</p>`;
  }
}

function renderProfile(profile) {
  const profileDiv = document.getElementById("profileInfo");

  profileDiv.innerHTML = `
  <div class="profile-card">
    <h2>${profile.name}</h2>
    <p>${profile.email}</p>

    ${profile.avatar?.url
      ? `<img src="${profile.avatar.url}" class="profile-pic" alt="${profile.avatar.alt || "Avatar"}" />`
      : ""
    }

    <p>${profile.bio || "No bio has been added yet."}</p>

    <button id="editProfileBtn" class="btn">Edit profile</button>

    <form id="editProfileForm" class="create-post-form" style="display:none;">
      <textarea name="bio" placeholder="Write a little bit about yourself here...">${profile.bio || ""}</textarea>

      <input type="url" name="avatarUrl" placeholder="Avatar URL"
        value="${profile.avatar?.url || ""}" />

      <input type="text" name="avatarAlt" placeholder="Avatar description"
        value="${profile.avatar?.alt || ""}" />

      <button type="submit">Save changes</button>
    </form>
  </div>
`;

  const editProfileBtn = document.getElementById("editProfileBtn");
  const editProfileForm = document.getElementById("editProfileForm");

  editProfileBtn.addEventListener("click", () => {
    const isHidden = editProfileForm.style.display === "none";
    editProfileForm.style.display = isHidden ? "flex" : "none";
    editProfileBtn.textContent = isHidden ? "Cancel" : "Edit profile";
  });

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
        `https://v2.api.noroff.dev/social/profiles/${userName}`,
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
        alert(data.errors?.[0]?.message || "Failed to update profile");
        return;
      }

      alert("Profile updated successfully");
      location.reload();
    } catch (error) {
      alert("Something went wrong");
    }
  }

  editProfileForm.addEventListener("submit", handleEditProfile);
}