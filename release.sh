#!/bin/bash

# WP ApexLink Release Script

VERSION="1.0.0"
PLUGIN_SLUG="wp-apexlink"
BUILD_DIR="build/wp-apexlink"

echo "🚀 Starting release build for version $VERSION..."

# 1. Clean previous build
rm -rf build
mkdir -p $BUILD_DIR

# 2. Run Production Build
echo "📦 Running npm build..."
npm install
npm run build

# 3. Copy files to build directory
echo "📂 Copying files..."
rsync -av --exclude='node_modules' \
          --exclude='.git' \
          --exclude='.github' \
          --exclude='src' \
          --exclude='tests' \
          --exclude='build' \
          --exclude='release.sh' \
          --exclude='composer.json' \
          --exclude='composer.lock' \
          --exclude='package.json' \
          --exclude='package-lock.json' \
          --exclude='webpack.config.js' \
          --exclude='.gitignore' \
          . $BUILD_DIR

# 4. Create ZIP
echo "🤐 Zipping package..."
cd build
zip -r ../$PLUGIN_SLUG-$VERSION.zip $PLUGIN_SLUG

echo "✅ Release ready: $PLUGIN_SLUG-$VERSION.zip"
