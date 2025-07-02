import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

export default function markdownToComponents() {
  return {
    name: 'vite-plugin-md-to-wc',
    handleHotUpdate({ file, server }) {
      if (file.endsWith('.md')) {
        console.log(`[vite-plugin-md-to-wc] Reloading for: ${file}`);
        // Optional: re-run your processing logic here if you want to update output
        server.ws.send({ type: 'full-reload' }); // 👈 force browser reload
      }
    },
    async buildStart() {
      const postsDir = path.resolve('./src/posts');
      const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));

      let indexData = [];

      for (const file of files) {
        const fullPath = path.join(postsDir, file);
        const raw = fs.readFileSync(fullPath, 'utf-8');
        const { data, content } = matter(raw);
        const html = marked(content);
        const preview = html.slice(0, 200) + '...';

        const tagName = `post-${file.replace('.md', '')}`;

        const componentCode = `
class ${tagName.replace(/-/g, '_')} extends HTMLElement {
    connectedCallback() {
        this.innerHTML = \`
        <h2>${data.title}</h2>
        <p class="post-date">${new Date(data.date).toDateString()}</p>
        <div class="post-content">
        ${html}
        </div>
\`;
    }
}
customElements.define('${tagName}', ${tagName.replace(/-/g, '_')});
`;

        const outPath = path.resolve('./src/generated', `${tagName}.js`);
        fs.writeFileSync(outPath, componentCode, 'utf-8');

        indexData.push({
          title: data.title,
          date: data.date,
          preview,
          tagName
        });
      }

      // Write a post index JSON
      fs.writeFileSync('./src/generated/postIndex.json', JSON.stringify(indexData), 'utf-8');
    }
  };
}
