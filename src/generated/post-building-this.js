
class post_building_this extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <h2>Building this</h2>
        <p class="post-date">Wed Jul 02 2025</p>
        <div class="post-content">
        <p>I wanted to get a little blog thing here I could write some posts on, but I don&#39;t like setting up whole CMS systems for such a small and meaningless requirement. I decided to integrate Vite into my otherwise fully vanilla JS website here, and wrote a small plugin for it that transforms each of these markdown posts into web components. Through some admittedly hacky URL watching, I replace the contents of the DOM with the post when you click one/load the page with a hash marker.</p>
<p>The site is hosted on Netlify with a Github integration (<a href="https://github.com/izzymg/izzymgdev">source code</a>) so it&#39;s fairly easy to just write and commit some markdown, and have posts now. In general I&#39;m a big fan of minimalist solutions that deliver to very very tiny requirements in short timeframes. It&#39;s great to throw a huge library together and have an all-in-one solution, but sometimes all you have to ask is &quot;what do I actually <em>want</em> to accomplish here&quot;, and that to me tonight came down to &quot;get some markdown files viewable on my page&quot;, so that&#39;s what I did.</p>
<p>I&#39;m rambling and trying to make a point out of this because it&#39;s nice to have more than one post on the blog to test it. Cya!</p>

        </div>
`;
    }
}
customElements.define('post-building-this', post_building_this);
