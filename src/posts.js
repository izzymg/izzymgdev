import idx from './generated/postIndex.json'
const posts = import.meta.glob('./generated/post-*.js', { eager: true });
const postsView = document.querySelector('#post-view');
const postsIndex = document.querySelector('#posts-index');
const postsLayout = document.querySelector('.posts-layout');

postsIndex.innerHTML = idx.map(post => `
    <li class="post-item">
        <a class="post-link" href="#${post.tagName}">
            <h3 class="post-title">${post.title}</h3>
            <span class="post-date">${post.date}</span>
            <div class="post-preview">${post.preview}</div>
        </a>
    </li>
`).join('');

function load() {
    const tag = location.hash.slice(1);
    if (!tag || !posts[`./generated/${tag}.js`]) {
        postsView.classList.remove("show");
        postsLayout.classList.add("show");
        return;
    }
    document.querySelector('#post-view #content').innerHTML = `<${tag}></${tag}>`;
    postsView.classList.add("show");
    postsLayout.classList.remove("show");
}
window.addEventListener('hashchange', () => {
    load();
});
load();