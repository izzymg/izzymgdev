
class post_wgpu_1 extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <h2>obsession: wgpu</h2>
        <p class="post-date">Wed Jul 02 2025</p>
        <div class="post-content">
        <p>My current obsession is with the popular Rust library <a href="https://github.com/gfx-rs/wgpu">wgpu</a>. This graphics API provides an abstraction over Vulkan, DX12, OpenGL and/or Metal, implementing the up and coming WebGPU standard.</p>
<p>I&#39;ve previously dabbled in game development using higher level engines like Unity, Godot, and libraries like Raylib, but never have I touched anywhere close to raw GPU/baremetal architecture until recently. I was predominantly motivated to do this after I saw some buzz about Notch&#39;s upcoming game &quot;levers and chests&quot;, apparently done using WebGL2 &amp; Javascript (although that&#39;s difficult to verify).</p>
<h2>Fonts</h2>
<p>I&#39;d heard about Signed Distance Fonts <a href="https://github.com/Chlumsky/msdfgen">(read this)</a> but I wanted to try my hand at something simpler, something more within reach of a regular person hacking at their PC decades ago to get <em>some text</em> on the screen at all. I figured fixed-width bitmaps were a pretty easy way to go, and as I always do, I went ahead and did the <em>worst</em> possible implementation I could think of first. See, to render something on the screen one needs:</p>
<ul>
<li>A list of vertices, making up sets of 3 to form triangles</li>
<li>A list of indices, allowing you to repeat the same vertices (6 indices + 4 vertices = a quad)</li>
<li>A shader program to output the vertex positions, and colour in the pixels (fragments)</li>
</ul>
<p>The next thing we need is some characters to output. A bitmap font comes as a simple PNG/BMP with a white background, and black pixels for characters. First, we can calculate the glyphs and put them into a hashmap:</p>
<pre><code class="language-rs">struct Glyph {
    
}
</code></pre>

        </div>
`;
    }
}
customElements.define('post-wgpu-1', post_wgpu_1);
