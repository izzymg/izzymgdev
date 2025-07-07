
class post_wgpu_1 extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <h2>obsession: wgpu: fonts</h2>
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
<pre><code class="language-rust">struct Glyph {
    uv_coords: Vec2, // 0-1 normalized to texture size
    uv_size: Vec2,   // 0-1 normalized to texture size
    advance: f32,          // horizontal advance after this glyph
}

let mut font: std::collections::HashMap&lt;char, Glyph&gt; = std::collections::HashMap::new();
// ...populate font...
</code></pre>
<p>For each character in the fontset, we&#39;d generate a glyph and store it. Now it&#39;s time to render some text. Let&#39;s start with a string: &quot;cat&quot;., Obviously we need to break it up into a list of characters.</p>
<pre><code class="language-rust">fn render_text&lt;&#39;a&gt;(
    text: &amp;str,
    font: &amp;std::collections::HashMap&lt;char, Glyph&gt;,
    base_pos: Vec2,
    instance_data: &amp;mut Vec&lt;InstanceData&gt;,
) {
    let mut pos = base_pos;
    for ch in text.chars() {
        if let Some(glyph) = font.get(&amp;ch) {
            instance_data.push(InstanceData {
                position: pos,
                uv_coords: glyph.uv_coords,
                uv_size: glyph.uv_size,
            });
            pos.x += glyph.advance;
        }
    }
    // instance_data will be uploaded to a wgpu::Buffer and drawn in a single draw call
}
</code></pre>
<p>Where <code>InstanceData</code> is a struct matching your instance buffer layout:</p>
<pre><code class="language-rust">#[repr(C)]
#[derive(Copy, Clone)]
struct InstanceData {
    position: Vec2,
    uv_coords: Vec2,
    uv_size: Vec2,
}
</code></pre>
<p>In the shader, it&#39;s very simple - we want to pass in an orthographic projection matrix the size of the screen, and we&#39;ll multiply our vertex position by this matrix - then just sample the font texture for our fragment shader - using the black/whiteness as a &quot;mask&quot; for the quad.</p>
<pre><code class="language-glsl">// Vertex shader (WGSL)
struct VertexInput {
    @location(0) position: vec2&lt;f32&gt;,
    @location(1) uv: vec2&lt;f32&gt;,
    @location(2) instance_pos: vec2&lt;f32&gt;,
    @location(3) instance_uv: vec2&lt;f32&gt;,
    @location(4) instance_uv_size: vec2&lt;f32&gt;,
};

struct VertexOutput {
    @builtin(position) position: vec4&lt;f32&gt;,
    @location(0) uv: vec2&lt;f32&gt;,
};

@vertex
fn vs_main(input: VertexInput) -&gt; VertexOutput {
    var out: VertexOutput;
    let world_pos = input.position + input.instance_pos;
    out.position = camera.projection * vec4&lt;f32&gt;(world_pos, 0.0, 1.0);
    out.uv = input.instance_uv + input.uv * input.instance_uv_size;
    return out;
}
</code></pre>
<pre><code class="language-glsl">// Fragment shader (WGSL)
@group(0) @binding(0) var font_tex: texture_2d&lt;f32&gt;;
@group(0) @binding(1) var font_sampler: sampler;

@fragment
fn fs_main(input: VertexOutput) -&gt; @location(0) vec4&lt;f32&gt; {
    let mask = textureSample(font_tex, font_sampler, input.uv).a;
    // Assume input color is passed as a uniform or push constant
    return vec4&lt;f32&gt;(input_color.rgb, input_color.a * mask);
}
</code></pre>
<p>If we render more than like, a handful of strings though, we&#39;ll start to notice our performance <strong>tank</strong>. Really we should be able to do 4000+ FPS on a good rig, and with a few hundred strings I could take that down to &lt; <em>150</em>.</p>
<p>So what can we do less of? For starters, our vertices tell us what shape to render, right? But we always just render a quad. So let&#39;s use a single vertex buffer and a single index buffer, containing just the data to write a quad. But how can we move our characters in the string uniquely? We can do that using GPU instancing. This allows us to render the same vertices and indices over and over <em>very fast</em>, but provides us a small buffer we can write per-instance data into. We&#39;ll encode the UV coordinates into the <em>instance buffer</em> for the characters - as well as a base position for rendering them (as we lost this by making our vertices all the same). Also, bitmaps are fixed-size, so let&#39;s stop tracking pixel sizes entirely.</p>
<pre><code class="language-rust">struct Glyph {
    uv_coords: Vec2, // 0-1 normalized to texture size
    uv_size: Vec2,   // 0-1 normalized to texture size
}

struct Font {
    glyphs: HashMap&lt;char, Glyph&gt;, // char -&gt; glyph map
    pixel_size: Vec2&lt;f32&gt;, // all our glyphs should be the same size
    padding: Vec2&lt;f32&gt; // per-glyph padding
}

pub struct Render {
    instance_buffer: wgpu::Buffer,
    // ...
}

impl Render {
    fn set_text(
        &amp;self
        text: &amp;str,
        pos: Vec2,
        font: &amp;std::collections::HashMap&lt;char, Glyph&gt;,
        queue
    ) -&gt; (usize, usize) {
        let start = instance_data.len();
        render_text(text, font, pos, instance_data);
        let end = instance_data.len();
        (start, end)
    }

    fn render_text_batch&lt;&#39;a&gt;(
        render_pass: &amp;mut wgpu::RenderPass&lt;&#39;a&gt;,
        instance_buffer: &amp;&#39;a wgpu::Buffer,
        range: (usize, usize),
    ) {
        let instance_count = (range.1 - range.0) as u32;
        render_pass.set_vertex_buffer(1, instance_buffer.slice(..));
        render_pass.draw_indexed(0..6, 0, range.0 as u32..range.1 as u32);
    }
}
</code></pre>
<p>This works real nicely, but to take it one step further, we can actually batch repeated calls to render_text.</p>
<p>Roughly, say we have </p>
<p><code>Draw calls: [Text, Model, Text, Text, Model]</code></p>
<p>We can batch calls 2 and 3 together in one render. We&#39;d split our render_text function into a set_text() and render() function:</p>
<p>Cool, now we can potentially render dozens of small strings in a single draw call, with 4 vertices, 6 indices by making use of GPU instancing. What I love so much about WGPU is how obvious this feels by just reading the API. There&#39;s no hacky weirdness here, you don&#39;t feel like a genius figuring it out, and performant decisions feel obvious.</p>

        </div>
`;
    }
}
customElements.define('post-wgpu-1', post_wgpu_1);
