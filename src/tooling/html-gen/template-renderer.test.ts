import { describe, it, expect } from 'vitest';
import { renderTemplate, type TemplateVars } from './template-renderer.js';

describe('template-renderer', () => {
  describe('renderTemplate', () => {
    it('replaces title placeholder', () => {
      const template = '<title>{{title}}</title>';
      const vars: TemplateVars = {
        title: 'Razorweave',
        subtitle: 'Core Rulebook',
        author: 'Panda Edwards',
        toc: '',
        content: '',
      };

      const result = renderTemplate(template, vars);

      expect(result).toBe('<title>Razorweave</title>');
    });

    it('replaces all placeholders', () => {
      const template = '{{title}} - {{subtitle}} by {{author}}\n{{toc}}\n{{content}}';
      const vars: TemplateVars = {
        title: 'Title',
        subtitle: 'Subtitle',
        author: 'Author',
        toc: '<nav>TOC</nav>',
        content: '<main>Content</main>',
      };

      const result = renderTemplate(template, vars);

      expect(result).toContain('Title - Subtitle by Author');
      expect(result).toContain('<nav>TOC</nav>');
      expect(result).toContain('<main>Content</main>');
    });

    it('handles multiple occurrences of same placeholder', () => {
      const template = '{{title}} and {{title}} again';
      const vars: TemplateVars = {
        title: 'Test',
        subtitle: '',
        author: '',
        toc: '',
        content: '',
      };

      const result = renderTemplate(template, vars);

      expect(result).toBe('Test and Test again');
    });
  });
});
