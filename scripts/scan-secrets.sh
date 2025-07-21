#!/bin/bash

# Secret scanning script for Astropal codebase
# This script scans for potentially committed secrets and API keys

set -e

echo "🔍 Scanning for secrets in codebase..."

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Track if any secrets were found
SECRETS_FOUND=0

# Patterns to search for
declare -a PATTERNS=(
    "sk_live_[a-zA-Z0-9]{24,}"          # Stripe live secret keys
    "pk_live_[a-zA-Z0-9]{24,}"          # Stripe live publishable keys
    "whsec_[a-zA-Z0-9]{32,}"            # Stripe webhook secrets
    "re_[a-zA-Z0-9]{24,}"               # Resend API keys
    "Bearer [a-zA-Z0-9]{20,}"           # Bearer tokens
    "xai-[a-zA-Z0-9]{40,}"              # Grok/X.AI API keys
    "sk-[a-zA-Z0-9]{48,}"               # OpenAI API keys
    "[a-f0-9]{64}"                      # 64-char hex strings (potential secrets)
    "password[\"'\\s]*[:=][\"'\\s]*[^\\s\"']{8,}"  # Hardcoded passwords
    "secret[\"'\\s]*[:=][\"'\\s]*[^\\s\"']{8,}"    # Hardcoded secrets
)

# Files and directories to exclude from scanning
EXCLUDE_PATTERNS=(
    "node_modules/"
    ".git/"
    "dist/"
    ".next/"
    "*.log"
    "*.env.example"
    ".cursorrules"
    "scan-secrets.sh"
    "*.md"
)

# Build grep exclude arguments
GREP_EXCLUDE=""
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    GREP_EXCLUDE="$GREP_EXCLUDE --exclude-dir=$pattern"
done

echo "Patterns to scan: ${#PATTERNS[@]}"
echo "Excluded paths: ${#EXCLUDE_PATTERNS[@]}"
echo ""

# Scan for each pattern
for pattern in "${PATTERNS[@]}"; do
    echo "Scanning for pattern: $pattern"
    
    # Use grep to find matches
    if results=$(grep -r -i -E "$pattern" . $GREP_EXCLUDE 2>/dev/null); then
        echo -e "${RED}⚠️  POTENTIAL SECRET FOUND:${NC}"
        echo "$results"
        echo ""
        SECRETS_FOUND=1
    fi
done

# Scan for specific file patterns that might contain secrets
echo "Scanning for suspicious files..."

# Look for .env files that aren't .env.example
if find . -name ".env*" -not -name "*.example" -not -path "./node_modules/*" | grep -q .; then
    echo -e "${YELLOW}⚠️  Environment files found (verify these don't contain secrets):${NC}"
    find . -name ".env*" -not -name "*.example" -not -path "./node_modules/*"
    echo ""
fi

# Look for key/cert files
if find . \( -name "*.key" -o -name "*.pem" -o -name "*.p12" -o -name "*.pfx" \) -not -path "./node_modules/*" | grep -q .; then
    echo -e "${YELLOW}⚠️  Key/certificate files found:${NC}"
    find . \( -name "*.key" -o -name "*.pem" -o -name "*.p12" -o -name "*.pfx" \) -not -path "./node_modules/*"
    echo ""
fi

# Scan for common secret variable names in code
echo "Scanning for suspicious variable names..."
suspicious_vars=$(grep -r -i -E "(api_key|api_secret|private_key|secret_key|access_token|refresh_token)\s*[:=]" . $GREP_EXCLUDE --include="*.ts" --include="*.js" --include="*.json" 2>/dev/null | grep -v "// Secrets" | grep -v "STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY" || true)

if [ ! -z "$suspicious_vars" ]; then
    echo -e "${YELLOW}⚠️  Suspicious variable assignments found (review these):${NC}"
    echo "$suspicious_vars"
    echo ""
fi

# Check for TODO comments about secrets
echo "Scanning for TODO comments about secrets..."
todos=$(grep -r -i -E "TODO.*secret|TODO.*key|TODO.*password" . $GREP_EXCLUDE --include="*.ts" --include="*.js" --include="*.md" 2>/dev/null || true)

if [ ! -z "$todos" ]; then
    echo -e "${YELLOW}ℹ️  TODO comments about secrets found:${NC}"
    echo "$todos"
    echo ""
fi

# Final result
echo "=========================================="
if [ $SECRETS_FOUND -eq 1 ]; then
    echo -e "${RED}❌ SECRETS DETECTED IN CODEBASE${NC}"
    echo "Please review and remove any actual secrets before committing."
    echo ""
    echo "If these are false positives, consider:"
    echo "1. Adding them to .gitignore"
    echo "2. Using environment variables"
    echo "3. Adding patterns to exclude list in this script"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ No secrets detected in codebase${NC}"
    echo "Scan completed successfully!"
fi 