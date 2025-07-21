#!/bin/bash
set -e

echo "🔧 Fixing all @/ import paths for production build..."

cd apps/web

# Fix remaining @/ imports in components
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
  -e "s|from '@/lib/|from '../../lib/|g" \
  -e "s|from '@/components/|from '../../components/|g" \
  -e "s|from '@/app/|from '../../app/|g"

# Fix specific patterns for different directory levels
find ./app -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
  -e "s|from '../../lib/|from '../../../lib/|g" \
  -e "s|from '../../components/|from '../../../components/|g"

find ./components/variants -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
  -e "s|from '../../lib/|from '../../../lib/|g" \
  -e "s|from '../../components/|from '../../|g"

echo "✅ Import paths fixed!"

# Show what was changed
echo "📊 Files modified:"
git diff --name-only 