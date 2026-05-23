const raw = /* @__PURE__ */ Object.assign({});
function getDocsManifest() {
  return Object.entries(raw).map(([filePath, content]) => {
    const slug = filePath.replace("../../../../docs/", "").replace(/\.md$/, "");
    const parts = slug.split("/");
    const group = parts.length > 1 ? parts[0] : null;
    const title = content.match(/^#\s+(.+)/m)?.[1] ?? parts[parts.length - 1];
    return { slug, title, group };
  }).sort((a, b) => a.slug.localeCompare(b.slug));
}
function getDocBySlug(slug) {
  const filePath = Object.keys(raw).find(
    (p) => p.replace("../../../../docs/", "").replace(/\.md$/, "") === slug
  );
  if (!filePath) return null;
  const content = raw[filePath];
  const title = content.match(/^#\s+(.+)/m)?.[1] ?? slug;
  return { slug, title, content };
}
export {
  getDocsManifest as a,
  getDocBySlug as g
};
