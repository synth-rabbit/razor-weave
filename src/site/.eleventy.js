module.exports = function(eleventyConfig) {
  // Pass through static assets
  eleventyConfig.addPassthroughCopy("src/styles");
  eleventyConfig.addPassthroughCopy("src/scripts");
  eleventyConfig.addPassthroughCopy("public");

  // Pass through images from public to root
  eleventyConfig.addPassthroughCopy({ "public/images": "images" });
  eleventyConfig.addPassthroughCopy({ "public/favicon.svg": "favicon.svg" });
  eleventyConfig.addPassthroughCopy({ "public/CNAME": "CNAME" });
  eleventyConfig.addPassthroughCopy({ "public/robots.txt": "robots.txt" });
  eleventyConfig.addPassthroughCopy({ "public/sitemap.xml": "sitemap.xml" });
  eleventyConfig.addPassthroughCopy({ "public/pdfs": "pdfs" });

  // Copy styles and scripts to expected paths
  eleventyConfig.addPassthroughCopy({ "src/styles": "styles" });
  eleventyConfig.addPassthroughCopy({ "src/scripts": "scripts" });

  // Watch for changes
  eleventyConfig.addWatchTarget("src/styles/");
  eleventyConfig.addWatchTarget("src/scripts/");

  // Dev server configuration
  eleventyConfig.setServerOptions({
    // Serve index.html for directory requests
    indexFileName: "index.html"
  });

  return {
    dir: {
      input: "pages",
      includes: "../_includes",
      output: "dist"
    },
    // Process these file types
    templateFormats: ["njk", "html", "md"],
    // Use Nunjucks for HTML files
    htmlTemplateEngine: "njk"
  };
};
