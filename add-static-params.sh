#!/bin/bash
set -e

echo "Adding generateStaticParams to all dynamic pages..."

# For simple static pages (privacy, terms, variants)
for file in app/[locale]/privacy/page.tsx app/[locale]/terms/page.tsx app/[locale]/variant-a/page.tsx app/[locale]/variant-b/page.tsx app/[locale]/variant-c/page.tsx app/[locale]/variant-d/page.tsx; do
  echo "Processing $file"
  # Add generateStaticParams after the imports
  sed -i '' '1s/^/export async function generateStaticParams() {\n  return [\n    { locale: "en" },\n    { locale: "es" }\n  ];\n}\n\n/' "$file"
done

echo "✅ All pages updated with generateStaticParams!" 