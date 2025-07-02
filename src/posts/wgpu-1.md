---
title: "obsession: wgpu"
date: 2025-07-02
---

My current obsession is with the popular Rust library [wgpu](https://github.com/gfx-rs/wgpu). This graphics API provides an abstraction over Vulkan, DX12, OpenGL and/or Metal, implementing the up and coming WebGPU standard.


I've previously dabbled in game development using higher level engines like Unity, Godot, and libraries like Raylib, but never have I touched anywhere close to raw GPU/baremetal architecture until recently. I was predominantly motivated to do this after I saw some buzz about Notch's upcoming game "levers and chests", apparently done using WebGL2 & Javascript (although that's difficult to verify).

## Fonts

I'd heard about Signed Distance Fonts [(read this)](https://github.com/Chlumsky/msdfgen) but I wanted to try my hand at something simpler, something more within reach of a regular person hacking at their PC decades ago to get *some text* on the screen at all. I figured fixed-width bitmaps were a pretty easy way to go, and as I always do, I went ahead and did the *worst* possible implementation I could think of first. See, to render something on the screen one needs:

* A list of vertices, making up sets of 3 to form triangles
* A list of indices, allowing you to repeat the same vertices (6 indices + 4 vertices = a quad)
* A shader program to output the vertex positions, and colour in the pixels (fragments)

We get our vertices somehow, and our indices somehow, and write them into a buffer, then call "draw".

*All code below is psuedo-code*

The next thing we need is some characters to output. A bitmap font comes as a simple PNG/BMP with a white background, and black pixels for characters. First, we can calculate the glyphs and put them into a hashmap:

```rs
struct Glyph {
    pixel_size: f32, // size in real pixels
    x_offset: f32, // next glyph start
    uv_coords: Vec2<f23>, // 0-1 normalized to texture size
    uv_size: Vec2<f32> // 0-1 normalized to texture size
}

let font = HashMap<char, Glyph>::new()
```

For each character in the fontset, we'd generate a glyph and store it. Now it's time to render some text. Let's start with a string: "cat"., Obviously we need to break it up into a list of characters.

```rs
fn render_text(text: &str) {
    let pos = Vec2<f32>::zero();
    for ch in text.chars() {
        let glyph = font.get(&ch).unwrap()
        let vertices = get_verts_for_glyph(&glyph, pos)
        let indices = get_indices_for_glyph(&glyph)
        bind_vertex_buffer(&vertices)
        bind_index_buffer(&indices)
        draw();
    }
}
```

`get_verts_for_glyph` is pretty simple - we'll just calculate our UV offset by looking at the glyph information and set it as our vertex UV coordinate. Then, we'll create vertices surrounding the glyph at the top left, top right, bottom left, and bottom right. Our indices are just 6 indices creating a quad, and there we have characters on the screen.

In the shader, it's very simple - we want to pass in an orthographic projection matrix the size of the screen, and we'll multiply our vertex position by this matrix - then just sample the font texture for our fragment shader - using the black/whiteness as a "mask" for the quad.

```glsl
fn vert() {
    out.position = camera.projection * in.position;
    out.uv = in.uv; // probably want a y-flip here
}

fn frag() {
    let mask = 1 - textureSample(font, in.uv).a;
    return (in.color.rgb, min(mask, in.color.a)); // only draw colour if the bitmap font has a value
}
```

If we render more than like, a handful of strings though, we'll start to notice our performance **tank**. Really we should be able to do 4000+ FPS on a good rig, and with a few hundred strings I could take that down to < *150*.

So what can we do less of? For starters, our vertices tell us what shape to render, right? But we always just render a quad. So let's use a single vertex buffer and a single index buffer, containing just the data to write a quad. But how can we move our characters in the string uniquely? We can do that using GPU instancing. This allows us to render the same vertices and indices over and over *very fast*, but provides us a small buffer we can write per-instance data into. We'll encode the UV coordinates into the *instance buffer* for the characters - as well as a base position for rendering them (as we lost this by making our vertices all the same). Also, bitmaps are fixed-size, so let's stop tracking pixel sizes entirely.


```rs
struct Glyph {
    uv_coords: Vec2<f23>, // 0-1 normalized to texture size
    uv_size: Vec2<f32> // 0-1 normalized to texture size
}

struct Font {
    glyphs: HashMap<char, Glyph>, // char -> glyph map
    pixel_size: Vec2<f32>, // all our glyphs should be the same size
    padding: Vec2<f32> // per-glyph padding
}

// render

fn render_setup() {
    bind_vertex_buffer(QUAD_VERTS)
    bind_index_buffer(QUAD_INDICES)
}

fn render_text(text: &str, base_position: Vec2<f32>) {
    let mut instances = vec![]
    let mut pos = base_position
    for ch in text.chars() {
        let glyph = font.get(&ch).unwrap()
        instances.push(pos, [
            glyph.uv_coords.x, glyph.uv_coords.y,
            glyph.uv_size.x, glyph.uv_size.y
        ]) // I store these in a [f32; 4] for alignment

    }
    draw(instances)
}
```

```glsl
fn vert() {
    let world_position = instance.position + in.position;
    out.position = camera.projection * world_position;
    out.uv = in.uv; // probably want a y-flip here
}
```

This works real nicely, but to take it one step further, we can actually batch repeated calls to render_text.

Roughly, say we have 

`Draw calls: [Text, Model, Text, Text, Model]`

We can batch calls 2 and 3 together in one render. We'd split our render_text function into a set_text() and render() function:

```rs
fn set_text(text: &str, pos: Vec2<f32>) -> Handle {
    /// store instance buffer start
    /// write into the instance buffer
    /// return instance buffer start + instance buffer len as handle
}

fn render_text_batch(handle: Handle) {
    /// render from handle.start -> handle.end
}
```

Cool, now we can potentially render dozens of small strings in a single draw call, with 4 vertices, 6 indices by making use of GPU instancing. What I love so much about WGPU is how obvious this feels by just reading the API. There's no hacky weirdness here, you don't feel like a genius figuring it out, and performant decisions feel obvious.