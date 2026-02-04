#!/bin/bash
echo "🔍 Verifying Migration"
echo "======================"
echo ""

# Check service directories
echo "📁 Service directories:"
ls -d apps/web/services/*/ 2>/dev/null | wc -l | xargs echo "  Found:"
echo ""

# Check barrel exports
echo "📦 Barrel exports:"
find apps/web/services -name "index.ts" | wc -l | xargs echo "  Found:"
echo ""

# Check service functions
echo "⚡ Service functions:"
find apps/web/services -name "*.ts" ! -name "index.ts" | wc -l | xargs echo "  Found:"
echo ""

# Check auth helpers
echo "🔐 Auth helpers:"
ls apps/web/lib/actions/with*.ts 2>/dev/null | wc -l | xargs echo "  Found:"
echo ""

# Check utilities
echo "🛠️  Utilities:"
ls apps/web/lib/utils/*.ts 2>/dev/null | wc -l | xargs echo "  Found:"
echo ""

echo "✅ Verification complete!"
