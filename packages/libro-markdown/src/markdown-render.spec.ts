import 'reflect-metadata';
import assert from 'assert';

import { MarkdownRender } from './markdown-render.js';

// Declare jest globals to avoid compilation errors if types are missing
declare const describe: any;
declare const it: any;
declare const beforeEach: any;
declare const jest: any;

// Mock ConfigurationService
const mockConfigService = {
  get: jest.fn(),
};

describe('MarkdownRender', () => {
  let markdownRender: MarkdownRender;

  beforeEach(() => {
    // Reset mock and set default behavior
    mockConfigService.get.mockReset();
    mockConfigService.get.mockResolvedValue(false);

    markdownRender = new MarkdownRender();
    // Inject mock manually
    (markdownRender as any).configurationService = mockConfigService;
    // Manually call init to trigger postConstruct logic
    markdownRender.init();
  });

  it('should render basic markdown', () => {
    const md = '# Hello';
    const html = markdownRender.render(md);
    // h1 id="hello" comes from anchor plugin
    assert.ok(html.includes('<h1 id="hello">Hello</h1>'));
  });

  it('should highlight code blocks', () => {
    const md = '```javascript\nconst a = 1;\n```';
    const html = markdownRender.render(md);

    // Check for language class added by markdown-it/highlight.js
    assert.ok(html.includes('language-javascript'));

    // Check for highlight.js specific classes (indicating highlighting actually happened)
    // "const" is a keyword
    assert.ok(html.includes('hljs-keyword'));
  });

  it('should sanitize html', () => {
    const md = '<script>alert(1)</script>';
    const html = markdownRender.render(md);
    assert.ok(!html.includes('<script>'));
    assert.ok(!html.includes('alert(1)'));
  });

  it('should allow span tags with class attributes (needed for highlighting)', () => {
    // Manually construct a highlighted-like span to ensure sanitizer doesn't strip it
    // Note: markdown-it render output is sanitized.
    // If we input raw HTML, it might be stripped depending on settings.
    // But highlight.js output is generated internally.
    // Let's test with a code block that generates spans.

    const md = '```javascript\nconst a = 1;\n```';
    const html = markdownRender.render(md);

    // Check that span tags are preserved
    assert.ok(html.includes('<span class="hljs-keyword">const</span>'));
  });

  it('should support target="_blank" configuration', async () => {
    mockConfigService.get.mockResolvedValue(true);

    const renderer = new MarkdownRender();
    (renderer as any).configurationService = mockConfigService;
    renderer.init();

    // Wait for promise resolution in init (microtask)
    // Increase wait time to ensure the promise chain in init() completes
    await new Promise((resolve) => setTimeout(resolve, 100));

    const md = '[link](http://example.com)';
    const html = renderer.render(md);
    assert.ok(html.includes('target="_blank"'));
  });

  it('should NOT add target="_blank" when disabled', async () => {
    mockConfigService.get.mockResolvedValue(false);

    const renderer = new MarkdownRender();
    (renderer as any).configurationService = mockConfigService;
    renderer.init();

    // Wait for promise resolution in init
    await new Promise((resolve) => setTimeout(resolve, 100));

    const md = '[link](http://example.com)';
    const html = renderer.render(md);
    assert.ok(!html.includes('target="_blank"'));
  });
});
