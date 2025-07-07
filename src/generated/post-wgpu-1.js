
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
<p>We get our vertices somehow, and our indices somehow, and write them into a buffer, then call &quot;draw&quot;.</p>
<p><em>All code below is psuedo-code</em></p>
<p>The next thing we need is some characters to output. A bitmap font comes as a simple PNG/BMP with a white background, and black pixels for characters. First, we can calculate the glyphs and put them into a hashmap:</p>
<pre><code class="language-rs">struct Glyph {
    pixel_size: f32, // size in real pixels
    x_offset: f32, // next glyph start
    uv_coords: Vec2&lt;f23&gt;, // 0-1 normalized to texture size
    uv_size: Vec2&lt;f32&gt; // 0-1 normalized to texture size
}

let font = HashMap&lt;char, Glyph&gt;::new()
</code></pre>
<p>For each character in the fontset, we&#39;d generate a glyph and store it. Now it&#39;s time to render some text. Let&#39;s start with a string: &quot;cat&quot;., Obviously we need to break it up into a list of characters.</p>
<pre><code class="language-rs">fn render_text(text: &amp;str) {
    let pos = Vec2&lt;f32&gt;::zero();
    for ch in text.chars() {
        let glyph = font.get(&amp;ch).unwrap()
        let vertices = get_verts_for_glyph(&amp;glyph, pos)
        let indices = get_indices_for_glyph(&amp;glyph)
        bind_vertex_buffer(&amp;vertices)
        bind_index_buffer(&amp;indices)
        draw();
    }
}
</code></pre>
<p><code>get_verts_for_glyph</code> is pretty simple - we&#39;ll just calculate our UV offset by looking at the glyph information and set it as our vertex UV coordinate. Then, we&#39;ll create vertices surrounding the glyph at the top left, top right, bottom left, and bottom right. Our indices are just 6 indices creating a quad, and there we have characters on the screen.</p>
<p>In the shader, it&#39;s very simple - we want to pass in an orthographic projection matrix the size of the screen, and we&#39;ll multiply our vertex position by this matrix - then just sample the font texture for our fragment shader - using the black/whiteness as a &quot;mask&quot; for the quad.</p>
<pre><code class="language-glsl">fn vert() {
    out.position = camera.projection * in.position;
    out.uv = in.uv; // probably want a y-flip here
}

fn frag() {
    let mask = 1 - textureSample(font, in.uv).a;
    return (in.color.rgb, min(mask, in.color.a)); // only draw colour if the bitmap font has a value
}
</code></pre>
<p>If we render more than like, a handful of strings though, we&#39;ll start to notice our performance <strong>tank</strong>. Really we should be able to do 4000+ FPS on a good rig, and with a few hundred strings I could take that down to &lt; <em>150</em>.</p>
<p>So what can we do less of? For starters, our vertices tell us what shape to render, right? But we always just render a quad. So let&#39;s use a single vertex buffer and a single index buffer, containing just the data to write a quad. But how can we move our characters in the string uniquely? We can do that using GPU instancing. This allows us to render the same vertices and indices over and over <em>very fast</em>, but provides us a small buffer we can write per-instance data into. We&#39;ll encode the UV coordinates into the <em>instance buffer</em> for the characters - as well as a base position for rendering them (as we lost this by making our vertices all the same). Also, bitmaps are fixed-size, so let&#39;s stop tracking pixel sizes entirely.</p>
<pre><code class="language-rs">struct Glyph {
    uv_coords: Vec2&lt;f23&gt;, // 0-1 normalized to texture size
    uv_size: Vec2&lt;f32&gt; // 0-1 normalized to texture size
}

struct Font {
    glyphs: HashMap&lt;char, Glyph&gt;, // char -&gt; glyph map
    pixel_size: Vec2&lt;f32&gt;, // all our glyphs should be the same size
    padding: Vec2&lt;f32&gt; // per-glyph padding
}

// render

fn render_setup() {
    bind_vertex_buffer(QUAD_VERTS)
    bind_index_buffer(QUAD_INDICES)
}

fn render_text(text: &amp;str, base_position: Vec2&lt;f32&gt;) {
    let mut instances = vec![]
    let mut pos = base_position
    for ch in text.chars() {
        let glyph = font.get(&amp;ch).unwrap()
        instances.push(pos, [
            glyph.uv_coords.x, glyph.uv_coords.y,
            glyph.uv_size.x, glyph.uv_size.y
        ]) // I store these in a [f32; 4] for alignment

    }
    draw(instances)
}
</code></pre>
<pre><code class="language-glsl">fn vert() {
    let world_position = instance.position + in.position;
    out.position = camera.projection * world_position;
    out.uv = in.uv; // probably want a y-flip here
}
</code></pre>
<p>This works real nicely, but to take it one step further, we can actually batch repeated calls to render_text.</p>
<p>Roughly, say we have </p>
<p><code>Draw calls: [Text, Model, Text, Text, Model]</code></p>
<p>We can batch calls 2 and 3 together in one render. We&#39;d split our render_text function into a set_text() and render() function:</p>
<pre><code class="language-rs">fn set_text(text: &amp;str, pos: Vec2&lt;f32&gt;) -&gt; Handle {
    /// store instance buffer start
    /// write into the instance buffer
    /// return instance buffer start + instance buffer len as handle
}

fn render_text_batch(handle: Handle) {
    /// render from handle.start -&gt; handle.end
}
</code></pre>
<p>Cool, now we can potentially render dozens of small strings in a single draw call, with 4 vertices, 6 indices by making use of GPU instancing. What I love so much about WGPU is how obvious this feels by just reading the API. There&#39;s no hacky weirdness here, you don&#39;t feel like a genius figuring it out, and performant decisions feel obvious.</p>

        </div>
`;
    }
}
customElements.define('post-wgpu-1', post_wgpu_1);
