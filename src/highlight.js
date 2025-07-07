import hljs from "highlight.js"
import javascript from 'highlight.js/lib/languages/javascript';
import rust from 'highlight.js/lib/languages/rust';
import glsl from 'highlight.js/lib/languages/glsl';
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('glsl', glsl);

hljs.highlightAll();
