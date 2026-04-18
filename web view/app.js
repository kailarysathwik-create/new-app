const stories = [
  "Saily",
  "Explore",
  "Vault",
  "Nodes",
  "Secure",
  "Chat",
  "Travel",
];

const posts = [
  {
    id: 1,
    user: "saily_admin",
    caption: "Welcome to Saily Web. Your feed, now on desktop.",
    image: "https://picsum.photos/seed/saily1/900/700",
  },
  {
    id: 2,
    user: "node_captain",
    caption: "Encrypted vault sync complete.",
    image: "https://picsum.photos/seed/saily2/900/700",
  },
  {
    id: 3,
    user: "ocean_ui",
    caption: "Building a bold social experience.",
    image: "https://picsum.photos/seed/saily3/900/700",
  },
];

const users = ["ig_style_dev", "safe_navigator", "crypto_sailor", "vault_mate"];

const storiesEl = document.getElementById("stories");
const postsEl = document.getElementById("posts");
const usersEl = document.getElementById("suggestedUsers");
const searchInput = document.getElementById("searchInput");

function renderStories() {
  storiesEl.innerHTML = stories
    .map(
      (name) => `
        <article class="story">
          <div class="story-avatar">${name.slice(0, 1).toUpperCase()}</div>
          <small>${name}</small>
        </article>
      `
    )
    .join("");
}

function renderPosts(query = "") {
  const cleaned = query.trim().toLowerCase();
  const filtered = cleaned
    ? posts.filter(
        (p) =>
          p.user.toLowerCase().includes(cleaned) ||
          p.caption.toLowerCase().includes(cleaned)
      )
    : posts;

  postsEl.innerHTML = filtered
    .map(
      (p) => `
        <article class="post">
          <header class="post-header">
            <strong>@${p.user}</strong>
            <span class="muted">just now</span>
          </header>
          <img class="post-media" src="${p.image}" alt="${p.user} post" />
          <footer class="post-footer">
            <p><strong>@${p.user}</strong> ${p.caption}</p>
          </footer>
        </article>
      `
    )
    .join("");

  if (filtered.length === 0) {
    postsEl.innerHTML = `<p class="muted">No matching posts found.</p>`;
  }
}

function renderSuggestedUsers() {
  usersEl.innerHTML = users
    .map(
      (name) => `
        <li>
          <span>@${name}</span>
          <button class="follow-btn">Follow</button>
        </li>
      `
    )
    .join("");
}

searchInput.addEventListener("input", (event) => {
  renderPosts(event.target.value);
});

renderStories();
renderPosts();
renderSuggestedUsers();
