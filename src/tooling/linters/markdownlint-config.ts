// Markdownlint configuration
export const markdownlintConfig = {
  // Disable line length (prioritize depth and clarity)
  MD013: false,

  // Enforce heading structure
  MD001: true, // Heading levels increment by one
  MD003: { style: 'atx' }, // Use # style headings

  // Enforce list consistency
  MD004: { style: 'dash' }, // Use - for unordered lists
  MD007: { indent: 2 }, // Unordered list indentation

  // Enforce link/image consistency
  MD034: true, // No bare URLs
  MD052: true, // Reference links should have labels

  // Enforce code block consistency
  MD040: true, // Fenced code blocks should have language
};
