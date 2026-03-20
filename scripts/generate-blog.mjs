import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const blogDir = path.join(publicDir, 'blog');
const templatePath = path.join(publicDir, 'blog.html');
const dataPath = path.join(publicDir, 'assets/js/blogs-data.js');

console.log('--- StopReg Blog Generator ---');

// 1. Ensure blog directory exists
if (!fs.existsSync(blogDir)) {
    console.log(`Creating directory: ${blogDir}`);
    fs.mkdirSync(blogDir, { recursive: true });
}

// 2. Read Blog Data
console.log(`Reading data from: ${dataPath}`);
const dataContent = fs.readFileSync(dataPath, 'utf8');

// Industrial Standard: Execute in a mock window context
let BLOG_POSTS;
try {
    const mockWindow = {};
    // Strip the 'const' but keep the assignment if possible, 
    // or just execute and look at mockWindow
    const script = dataContent + '\nreturn BLOG_POSTS;';
    BLOG_POSTS = new Function('window', script)(mockWindow);
} catch (e) {
    console.error('Error parsing BLOG_POSTS:', e);
    process.exit(1);
}

// 3. Read Template
console.log(`Reading template from: ${templatePath}`);
const template = fs.readFileSync(templatePath, 'utf8');

// 4. Generate Files
console.log(`Generating posts...`);
for (const [slug, post] of Object.entries(BLOG_POSTS)) {
    let content = template;
    const prettyUrl = `https://stopreg.com/blog/${slug}.html`;
    const heroImage = `https://stopreg.com/assets/images/landing/blog/blog-bg.png`;

    // Static Pre-rendering of Meta Tags
    const replacements = [
        { regex: /<title>.*?<\/title>/, value: `<title>${post.title} | StopReg Blog</title>` },
        { regex: /<meta name="title" content=".*?" \/>/g, value: `<meta name="title" content="${post.title} | StopReg Blog" />` },
        { regex: /<meta name="description" content=".*?" \/>/g, value: `<meta name="description" content="${post.description}" />` },
        { regex: /<meta property="og:title" content=".*?" \/>/g, value: `<meta property="og:title" content="${post.title}" />` },
        { regex: /<meta property="og:description" content=".*?" \/>/g, value: `<meta property="og:description" content="${post.description}" />` },
        { regex: /<meta property="og:url" content=".*?" \/>/g, value: `<meta property="og:url" content="${prettyUrl}" />` },
        { regex: /<meta property="og:image" content=".*?" \/>/g, value: `<meta property="og:image" content="${heroImage}" />` },
        { regex: /<meta name="twitter:title" content=".*?" \/>/g, value: `<meta name="twitter:title" content="${post.title}" />` },
        { regex: /<meta name="twitter:description" content=".*?" \/>/g, value: `<meta name="twitter:description" content="${post.description}" />` },
        { regex: /<meta name="twitter:image" content=".*?" \/>/g, value: `<meta name="twitter:image" content="${heroImage}" />` },
        { regex: /<link rel="canonical" href=".*?" \/>/g, value: `<link rel="canonical" href="${prettyUrl}" />` }
    ];

    replacements.forEach(r => {
        content = content.replace(r.regex, r.value);
    });

    const outputPath = path.join(blogDir, `${slug}.html`);
    fs.writeFileSync(outputPath, content);
    console.log(`  ✓ Generated: ${slug}.html`);
}

console.log('--- Generation Complete! ---');
