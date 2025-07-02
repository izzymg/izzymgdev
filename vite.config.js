
import markdownToComponents from './md-to-comp'
/** @type {import('vite').UserConfig} */
export default {
    plugins: [markdownToComponents()],
}