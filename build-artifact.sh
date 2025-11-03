#!/bin/bash

# Build script for creating static artifact for S3 or fileshare deployment
# This script builds the application and creates a tar.gz archive

set -e  # Exit on error

echo "🏗️  Building Racker-Stacker static artifact..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
VERSION=$(node -p "require('./package.json').version")
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BUILD_DIR="dist"
ARTIFACT_DIR="artifacts"
ARTIFACT_NAME="racker-stacker-v${VERSION}-${TIMESTAMP}"

# Clean previous builds
echo -e "${YELLOW}Cleaning previous builds...${NC}"
rm -rf $BUILD_DIR
rm -rf $ARTIFACT_DIR
mkdir -p $ARTIFACT_DIR

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Build the application
echo -e "${YELLOW}Building application...${NC}"
npm run build

# Check if build was successful
if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}Build failed! No dist directory found.${NC}"
    exit 1
fi

# Create the artifact with metadata
echo -e "${YELLOW}Creating deployment artifact...${NC}"

# Create a metadata file
cat > $BUILD_DIR/build-info.json <<EOF
{
  "name": "racker-stacker",
  "version": "${VERSION}",
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "timestamp": "${TIMESTAMP}",
  "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "gitBranch": "$(git branch --show-current 2>/dev/null || echo 'unknown')"
}
EOF

# Create the tar.gz archive
tar -czf "$ARTIFACT_DIR/${ARTIFACT_NAME}.tar.gz" -C $BUILD_DIR .

# Also create a "latest" version for easier deployment
cp "$ARTIFACT_DIR/${ARTIFACT_NAME}.tar.gz" "$ARTIFACT_DIR/racker-stacker-latest.tar.gz"

# Calculate file sizes
ARTIFACT_SIZE=$(du -h "$ARTIFACT_DIR/${ARTIFACT_NAME}.tar.gz" | cut -f1)

# Success message
echo -e "${GREEN}✅ Build complete!${NC}"
echo ""
echo "Artifact created:"
echo "  📦 $ARTIFACT_DIR/${ARTIFACT_NAME}.tar.gz (${ARTIFACT_SIZE})"
echo "  📦 $ARTIFACT_DIR/racker-stacker-latest.tar.gz (${ARTIFACT_SIZE})"
echo ""
echo "To deploy to S3:"
echo "  aws s3 cp $ARTIFACT_DIR/${ARTIFACT_NAME}.tar.gz s3://your-bucket/"
echo ""
echo "To extract the artifact:"
echo "  tar -xzf ${ARTIFACT_NAME}.tar.gz"