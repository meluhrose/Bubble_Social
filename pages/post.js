export function showPost() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <h1>Post</h1>
    <form id="postForm">
      <input name="title" placeholder="Post title" />
      <textarea name="content" placeholder="Write your post..."></textarea>
      <button>Create Post</button>
    </form>
  `;

  // handle post creation here
}
