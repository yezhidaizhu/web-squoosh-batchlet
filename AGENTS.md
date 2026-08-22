# AGENTS.md

<INSTRUCTIONS>
- Keep responses and changes concise and scoped.
- This project owns the main site at `https://vicoco.uk/` and the authoritative origin-root SEO files.
- SEO outputs are generated in `src/static-build/index.tsx`. Never hand-edit generated files in `build` or `.tmp`.
- When adding, renaming, removing, or materially changing an indexable page, review and update its title, meta description, canonical URL, robots meta, Open Graph data, JSON-LD, internal links, `llms.txt`, `robots.txt`, and `sitemap.xml` definitions.
- Keep the root `robots.txt` linked to both `/sitemap.xml` and `/squoosh-batch-image-compressor/sitemap-index.xml` while the SEO project remains deployed at that path.
- Keep `llms.txt` aligned with visible features, supported formats, privacy behavior, page URLs, and related Vicoco tools.
- Keep 404 and other non-indexable pages out of the sitemap and marked `noindex` where applicable.
- If the SEO project's base path or sitemap URL changes, update this project's robots, sitemap, llms, and internal links in the same change.
- Do not run a production build unless the user requests it.
</INSTRUCTIONS>
