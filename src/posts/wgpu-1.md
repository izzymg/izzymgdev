---
title: "obsession: wgpu: fonts"
date: 2025-07-02
---

My current obsession is with the popular Rust library [wgpu](https://github.com/gfx-rs/wgpu). This graphics API provides an abstraction over Vulkan, DX12, OpenGL and/or Metal, implementing the up and coming WebGPU standard.


I've previously dabbled in game development using higher level engines like Unity, Godot, and libraries like Raylib, but never have I touched anywhere close to raw GPU/baremetal architecture until recently. I was predominantly motivated to do this after I saw some buzz about Notch's upcoming game "levers and chests", apparently done using WebGL2 & Javascript (although that's difficult to verify).

## Fonts

### The silly way

I'd heard about Signed Distance Fonts [(read this)](https://github.com/Chlumsky/msdfgen) but I wanted to try my hand at something simpler, something more within reach of a regular person hacking at their PC decades ago to get *some text* on the screen at all. I figured fixed-width bitmaps were a pretty easy way to go, and as I always do, I went ahead and did the *worst* possible implementation I could think of first. See, to render something on the screen one needs:

* A list of vertices, making up sets of 3 to form triangles
* A list of indices, allowing you to repeat the same vertices (6 indices + 4 vertices = a quad)
* A shader program to output the vertex positions, and colour in the pixels (fragments)

We get our vertices somehow, and our indices somehow, and write them into a buffer, then call "draw".

*All code below is psuedo-code*

The next thing we need is some characters to output. A bitmap font comes as a simple PNG/BMP with a white background, and black pixels for characters. First, we can calculate the glyphs and put them into a hashmap:

```rust
struct Glyph {
    uv_coords: Vec2, // 0-1 normalized to texture size
    uv_size: Vec2,   // 0-1 normalized to texture size
    advance: f32,          // horizontal advance after this glyph
}

let mut font: std::collections::HashMap<char, Glyph> = std::collections::HashMap::new();
// ...populate font...
```

For each character in the fontset, we'd generate a glyph and store it. Now it's time to render some text. Let's start with a string: "cat"., Obviously we need to break it up into a list of characters.

```rust
fn build_glyph_quad(glyph: &Glyph, start_position: Vec2) -> Vec<Vertex> {
    // ...
}

fn render_text<'a>(
    &self,
    text: &str,
    font: &std::collections::HashMap<char, Glyph>,
    base_pos: Vec2,
) {
    let mut pos = base_pos;
    let mut verts = vec![];
    for ch in text.chars() {
        if let Some(glyph) = font.get(&ch) {
            verts.extend(build_glyph_quad(glyph, pos));
            pos.x += glyph.advance;
        }
    }
    self.queue.write(self.vertex_buffer, 0, bytemuck::cast_slice(verts));
    // ...draw data
}
```

In the shader, it's very simple - we want to pass in an orthographic projection matrix the size of the screen, and we'll multiply our vertex position by this matrix - then just sample the font texture for our fragment shader - using the black/whiteness as a "mask" for the quad.

```glsl
// Vertex shader (WGSL)
struct VertexInput {
    @location(0) position: vec2<f32>,
    @location(1) uv: vec2<f32>,
    @location(2) color: vec4<f32>
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
    @location(2) color: vec4<f32>
};


@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    out.position = camera.projection * vec4(input.position.xy, 0, 1);
    out.uv = input.uv;
    out.color = input.color;
    return out;
}
```

```glsl
// Fragment shader (WGSL)
@group(0) @binding(0) var font_tex: texture_2d<f32>;
@group(0) @binding(1) var font_sampler: sampler;

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
    let mask = textureSample(font_tex, font_sampler, input.uv).a;
    return vec4<f32>(input.color.rgb, input.color.a * mask);
}
```



### But performance

If we render more than like, a handful of strings though, we'll start to notice our performance **tank**. Really we should be able to do 4000+ FPS on a good rig, and with a few hundred strings I could take that down to < *150*.

So what can we do less of? For starters, our vertices tell us what shape to render, right? But we always just render a quad. So let's use a single vertex buffer and a single index buffer, containing just the data to write a quad. But how can we move our characters in the string uniquely? We can do that using GPU instancing. This allows us to render the same vertices and indices over and over *very fast*, but provides us a small buffer we can write per-instance data into. We'll encode the UV coordinates into the *instance buffer* for the characters - as well as a base position for rendering them (as we lost this by making our vertices all the same). Also, bitmaps are fixed-size, so let's stop tracking pixel sizes entirely.

**Draw order**

The reason for returning handles per string is we can preserve draw-order, or leave it up to the caller. They may choose to notify us of 30 strings, but render them in mixed orders to allow for z-indexing.


```rust
struct Glyph {
    uv_coords: Vec2, // 0-1 normalized to texture size
    uv_size: Vec2,   // 0-1 normalized to texture size
}

struct Font {
    glyphs: HashMap<char, Glyph>, // char -> glyph map
    pixel_size: Vec2<f32>, // all our glyphs should be the same size
    padding: Vec2<f32> // per-glyph padding
}

fn get_text_instance(
    text: &str,
    font: &std::collections::HashMap<char, Glyph>,
    base_pos: Vec2,
    instance_data: &mut Vec<InstanceData>,
) -> Instance {
    let mut pos = base_pos;
    for ch in text.chars() {
        if let Some(glyph) = font.get(&ch) {
            instance_data.push(InstanceData {
                position: pos,
                uv_coords: glyph.uv_coords,
                uv_size: glyph.uv_size,
            });
            pos.x += glyph.advance;
        }
    }
}


pub struct Render {
    instance_buffer: wgpu::Buffer,
    // ...
}


impl Render {
    fn set_text(
        &self
        text_draws: Vec<&str>,
        pos: Vec2,
        font: &std::collections::HashMap<char, Glyph>,
        queue: wgpu::Queue,
    ) -> Vec<(usize, usize)> {
        // Ideally, arena/re-use allocations
        let mut handles = vec![];
        let instances = vec![];
        for text in text_draws {
            let start = instance_data.len();
            render_text(text, font, pos, instance_data);
            let end = instance_data.len();
            handles.push((start, end))
        }
        queue.write_buffer(self.instance_buffer, 0, bytemuck::cast_slice(&instances));
        /// For drawing later
        handles
    }

    fn render_text_batch<'a>(
        render_pass: &mut wgpu::RenderPass<'a>,
        instance_buffer: &'a wgpu::Buffer,
        handle: (usize, usize),
    ) {
        render_pass.set_vertex_buffer(1, instance_buffer.slice(..));
        render_pass.draw_indexed(0..6, 0, handle.0 as u32..handle.1 as u32);
    }
}
```

```glsl
struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) uv: vec2<f32>,
}

struct InstanceInput {
    @location(3) color: vec4<f32>,
    @location(4) uv: vec4<f32>,
    @location(5) position: vec2<f32>,
f}

struct VertexOutput {
    @builtin(position) clip_position: vec4<f32>,
    @location(0) uv: vec2<f32>,
    @location(1) color: vec4<f32>,
};

struct Camera {
    view_proj: mat4x4<f32>,
};
@group(0) @binding(0)
var<uniform> ui_camera: Camera;


@vertex
fn vs_main(
    vert: VertexInput,
    instance: InstanceInput,
) -> VertexOutput {

    var out: VertexOutput;
    let world_position = instance.position + vert.position.xy;
    out.clip_position = ui_camera.view_proj * vec4<f32>(world_position, 0.0, 1.0);

    var uv_origin = instance.uv.xy;
    out.uv = vec2<f32>(
        uv_origin.x + vert.uv.x,
        uv_origin.y + (1.0 - vert.uv.y)
    );
    out.color = instance.color;
    return out;
}

@ group(1)@ binding(0)var t_font: texture_2d<f32>;
@group(1) @binding(1)
var s_font: sampler;


@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    let mask = 1 - textureSample(t_font, s_font, in.uv).r;
    return vec4<f32>(in.color.rgb, min(mask, in.color.a));
}
```

This works real nicely, but to take it one step further, we can actually batch repeated calls to render_text.

Roughly, say we have 

`Draw calls: [Text, Model, Text, Text, Model]`

We can batch calls 2 and 3 together in one render. We'd split our render_text function into a set_text() and render() function:



Cool, now we can potentially render dozens of small strings in a single draw call, with 4 vertices, 6 indices by making use of GPU instancing. What I love so much about WGPU is how obvious this feels by just reading the API. There's no hacky weirdness here, you don't feel like a genius figuring it out, and performant decisions feel obvious.