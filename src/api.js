/*Feed Page*/
const BASE_URL = "https://v2.api.noroff.dev/social/posts";

function getHeaders() {
  const accessToken = localStorage.getItem("accessToken");
  const apiKey = localStorage.getItem("apiKey");

  if (!accessToken || !apiKey) {
    throw new Error("Missing authentication");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    "X-Noroff-API-Key": apiKey
  };
}

export async function fetchPostsPage(page = 1, limit = 15) {
  const response = await fetch(
    `${BASE_URL}?limit=${limit}&page=${page}&_author=true&sort=created&sortOrder=desc`,
    { headers: getHeaders() }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.errors?.[0]?.message || "Failed to fetch posts");
  }

  return data; // return whole API response
}

export async function fetchPostsForSearch(limit = 100) {
  const response = await fetch(
    `${BASE_URL}?limit=${limit}&page=1&_author=true&sort=created&sortOrder=desc`,
    { headers: getHeaders() }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.errors?.[0]?.message || "Search fetch failed");
  }

  return data.data;
}

export async function createPost(payload) {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.errors?.[0]?.message || "Failed to create post");
  }

  return data;
}

/*Post Page*/
export async function fetchSinglePost(postId) {
  const response = await fetch(
    `${BASE_URL}/${postId}?_author=true`,
    { headers: getHeaders() }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.errors?.[0]?.message || "Failed to load post");
  }

  return data.data;
}

export async function updatePost(postId, payload) {
  const response = await fetch(`${BASE_URL}/${postId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.errors?.[0]?.message || "Failed to update post");
  }

  return data.data;
}

export async function deletePost(postId) {
  const response = await fetch(`${BASE_URL}/${postId}`, {
    method: "DELETE",
    headers: getHeaders()
  });

  if (!response.ok) {
    let message = "Failed to delete post";
    try {
      const data = await response.json();
      message = data.errors?.[0]?.message || message;
    } catch {}
    throw new Error(message);
  }

  return true;
}

/*Profile Page*/
export async function fetchProfile(username) {
  const response = await fetch(
    `${BASE_URL.replace("posts", "profiles")}/${username}?_posts=true&_followers=true&_following=true`,
    { headers: getHeaders() }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.errors?.[0]?.message || "Failed to load profile");
  }

  return data.data;
}

export async function updateProfile(username, payload) {
  const response = await fetch(
    `${BASE_URL.replace("posts", "profiles")}/${username}`,
    {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(payload)
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.errors?.[0]?.message || "Failed to update profile");
  }

  return data.data;
}

export async function followUser(username) {
  const response = await fetch(
    `${BASE_URL.replace("posts", "profiles")}/${username}/follow`,
    {
      method: "PUT",
      headers: getHeaders()
    }
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.errors?.[0]?.message || "Failed to follow user");
  }

  return true;
}

export async function unfollowUser(username) {
  const response = await fetch(
    `${BASE_URL.replace("posts", "profiles")}/${username}/unfollow`,
    {
      method: "PUT",
      headers: getHeaders()
    }
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.errors?.[0]?.message || "Failed to unfollow user");
  }

  return true;
}