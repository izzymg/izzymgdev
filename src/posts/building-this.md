---
title: Building this 
date: 2025-07-02
---

I wanted to get a little blog thing here I could write some posts on, but I don't like setting up whole CMS systems for such a small and meaningless requirement. I decided to integrate Vite into my otherwise fully vanilla JS website here, and wrote a small plugin for it that transforms each of these markdown posts into web components. Through some admittedly hacky URL watching, I replace the contents of the DOM with the post when you click one/load the page with a hash marker.

The site is hosted on Netlify with a Github integration ([source code](https://github.com/izzymg/izzymgdev)) so it's fairly easy to just write and commit some markdown, and have posts now. In general I'm a big fan of minimalist solutions that deliver to very very tiny requirements in short timeframes. It's great to throw a huge library together and have an all-in-one solution, but sometimes all you have to ask is "what do I actually *want* to accomplish here", and that to me tonight came down to "get some markdown files viewable on my page", so that's what I did.

I'm rambling and trying to make a point out of this because it's nice to have more than one post on the blog to test it. Cya!