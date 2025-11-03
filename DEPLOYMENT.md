# Deployment Guide for Racker-Stacker

This guide explains how to build and deploy Racker-Stacker as a static artifact to various platforms including S3, CDN, or any static file hosting service.

## Build Process

### Local Build

The application can be built into a static artifact using several methods:

#### Method 1: Using the Build Script (Recommended)
```bash
# This creates timestamped and latest versions of the artifact
npm run build:artifact

# Or directly run the script
./build-artifact.sh
```

This will:
1. Build the production-optimized application
2. Create a tar.gz archive with all static files
3. Include build metadata (version, timestamp, git info)
4. Generate both timestamped and "latest" versions

Output files:
- `artifacts/racker-stacker-v{version}-{timestamp}.tar.gz`
- `artifacts/racker-stacker-latest.tar.gz`

#### Method 2: Quick Build Commands
```bash
# Build and create timestamped archive
npm run build && npm run package:tar

# Build and create latest archive only
npm run package:tar:latest
```

### CI/CD Build

The repository includes GitHub Actions workflow that automatically builds artifacts:

- **On push to main**:
  - Creates and stores artifact as GitHub Actions artifact (30 day retention)
  - Publishes/updates a "latest" GitHub Release with the tar.gz files
- **On tag creation (v*)**: Creates versioned GitHub Release with artifact
- **Manual trigger**: Can optionally upload to S3

#### Accessing the Latest Build

The most recent build from the main branch is always available at:
```
https://github.com/nprimmer/racker-stacker/releases/tag/latest
```

Direct download link:
```
https://github.com/nprimmer/racker-stacker/releases/download/latest/racker-stacker-latest.tar.gz
```

## Deployment Options

### 1. AWS S3 Static Website Hosting

```bash
# Extract the artifact
tar -xzf racker-stacker-latest.tar.gz -C /tmp/deploy

# Upload to S3
aws s3 sync /tmp/deploy s3://your-bucket-name --acl public-read

# Or upload the tar.gz directly and extract on EC2/Lambda
aws s3 cp artifacts/racker-stacker-latest.tar.gz s3://your-bucket-
```

S3 Bucket Configuration:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

### 2. CloudFront CDN

1. Upload to S3 as above
2. Create CloudFront distribution pointing to S3 bucket
3. Configure index.html as default root object

### 3. Nginx Web Server

```bash
# Extract artifact to web root
sudo tar -xzf racker-stacker-latest.tar.gz -C /var/www/racker-stacker

# Nginx configuration
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/racker-stacker;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 4. Docker Deployment

```dockerfile
FROM nginx:alpine
COPY --from=artifact racker-stacker-latest.tar.gz /tmp/
RUN tar -xzf /tmp/racker-stacker-latest.tar.gz -C /usr/share/nginx/html && \
    rm /tmp/racker-stacker-latest.tar.gz
```

### 5. Netlify/Vercel/GitHub Pages

Extract the artifact and deploy the contents:

```bash
# Extract
tar -xzf racker-stacker-latest.tar.gz -C deploy-folder

# Deploy to Netlify
netlify deploy --dir=deploy-folder --prod

# Deploy to Vercel
vercel deploy-folder --prod
```

## Artifact Contents

The generated tar.gz artifact contains:

```
.
├── index.html           # Main HTML entry point
├── assets/
│   ├── index-*.js      # Minified JavaScript bundle
│   └── index-*.css     # Minified CSS styles
└── build-info.json     # Build metadata
```

## Build Metadata

Each artifact includes `build-info.json` with:
- Application name and version
- Build timestamp
- Git commit hash and branch
- Build time in UTC

## Environment Variables

The application is fully static and doesn't require runtime environment variables. All configuration is handled client-side.

## Automated Deployment with GitHub Actions

To enable automatic S3 deployment, add these secrets to your GitHub repository:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION` (optional, defaults to us-east-1)
- `S3_BUCKET` (optional, defaults to racker-stacker-artifacts)

Then:
1. Push a tag starting with 'v' for automatic release
2. Or manually trigger the workflow with S3 upload option

## Verification

After deployment, verify the application:

1. Check index.html loads: `https://your-domain.com/`
2. Verify assets load: Check browser console for errors
3. Test functionality: Create a rack, add components, export

## Performance Optimization

The artifact is already optimized with:
- Minified JavaScript and CSS
- Tree-shaking for unused code removal
- Efficient chunking strategy

For additional optimization:
- Enable gzip/brotli compression on your web server
- Set appropriate cache headers for assets
- Use a CDN for global distribution

## Rollback Strategy

Keep previous versions of artifacts for easy rollback:

```bash
# List available versions
ls -la artifacts/

# Deploy specific version
aws s3 sync extracted-version/ s3://your-bucket/ --delete

# Or swap symlinks on traditional web servers
ln -sfn /var/www/versions/v1.0.0 /var/www/current
```

## Troubleshooting

### Build Issues
- Ensure Node.js 20+ is installed
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npx tsc --noEmit`

### Deployment Issues
- Verify file permissions (644 for files, 755 for directories)
- Check web server mime types for .js and .css files
- Ensure index.html is set as default document
- Verify CORS headers if hosting assets separately

### Runtime Issues
- Check browser console for JavaScript errors
- Verify all asset URLs are correct (no 404s)
- Test in incognito mode to bypass cache issues