/**
 * Template Renderer
 *
 * Simple mustache-style template variable replacement.
 */

export interface TemplateVars {
  title: string;
  subtitle: string;
  author: string;
  toc: string;
  content: string;
}

/**
 * Replace {{placeholder}} with values
 */
export function renderTemplate(template: string, vars: TemplateVars): string {
  let result = template;

  for (const [key, value] of Object.entries(vars)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(pattern, value);
  }

  return result;
}
