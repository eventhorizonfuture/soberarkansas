import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Arkansas search discovery', () => {
  it('directs crawlers to the public Arkansas sitemap', () => {
    const robots = readFileSync('public/robots.txt', 'utf8');
    const directives = robots.split('\n').filter((line) => line.startsWith('Sitemap:'));
    expect(directives).toEqual(['Sitemap: https://soberarkansas.com/sitemap.xml']);
  });

  it('points prerender and llms.txt at Arkansas URLs only', () => {
    const prerender = readFileSync('scripts/prerender.mjs', 'utf8');
    expect(prerender).toContain("const BASE_URL = 'https://soberarkansas.com'");
    expect(prerender).not.toContain('soberkentucky.com');
    expect(prerender).not.toContain('soberohio.com');
    expect(prerender).not.toContain('sobercalifornia.com');

    const llms = readFileSync('public/llms.txt', 'utf8');
    expect(llms).toContain('https://soberarkansas.com');
    expect(llms).toContain('agent-api-arkansas');
    expect(llms).not.toContain('soberkentucky.com');
  });
});
