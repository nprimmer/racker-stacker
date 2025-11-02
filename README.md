# racker-stacker

A web-based tool for building and planning server rack configurations with drag-and-drop functionality.

## Quick Start

### Using Pre-built Docker Image (Easiest)
```bash
# Pull the latest image from GitHub Container Registry
docker pull ghcr.io/nprimmer/racker-stacker:latest

# Run the container
docker run -p 8080:80 ghcr.io/nprimmer/racker-stacker:latest
```

### Using Docker Compose (Development)
```bash
# Development mode with hot reload
docker-compose up dev

# Production mode
docker-compose up prod
```

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Access the application at:
- Development: http://localhost:5173
- Production: http://localhost:8080

## Features

This application is used for building a simple plan when preparing a server or network rack. The implemented features include:
- The ability to designate a single rack of a specific height (for example, 42u).
- The ability to add components of specific heights for placement within the rack (for example, a 1u, 2u, or 4u server)
- The ability to drag-and-drop components throughout the rack for placement.
- The ability to add a color-coded label to an individual component that indicates its class (compute, power, network, storage, cooling, etc)
- The ability to select two already-placed components in a rack plan and get a distance, in inches, between the two (for the purposes of cable planning)
- The ability to add text field data to a given component (device names, IP addresses, subnets)
- The ability to save a work-in-progress for later modification
- The ability to load a previously saved work-in-progress to allow further modification
- The ability to export to a spreadsheet (Excel format)
- The ability to export to a PNG image

## Important Notes

⚠️ **Data Persistence**: This is a client-side only application. Your rack configurations are not saved automatically. Always export your configuration to a JSON file before closing the application to save your work.

## Usage

1. **Create a Rack**: Start with a 42U rack or create a new rack with your desired height
2. **Add Components**: Use the sidebar to add components with specific heights and types
3. **Arrange Components**: Drag and drop components to reposition them within the rack
4. **Add Details**: Click on components to add metadata like device names, IP addresses, and notes
5. **Calculate Distances**: Select a component to see cable distances to all other components
6. **Save Your Work**: Use the "Save Configuration" button to download a JSON file
7. **Export**: Export your rack as an Excel spreadsheet or PNG image for documentation

## CI/CD Pipeline

This repository includes GitHub Actions for automatic Docker image building and deployment:

### Automatic Docker Publishing
- On every push to `main`, a Docker image is automatically built and published to GitHub Container Registry (GHCR)
- Images are tagged with:
  - `latest` - Always points to the most recent main branch build
  - `main-<sha>` - Specific commit SHA for versioning
  - `YYYYMMDD-HHmmss` - Timestamp for easy identification
- Multi-platform support: Images are built for both `linux/amd64` and `linux/arm64`

### Automatic Cleanup
- Old Docker images are automatically removed, keeping only the last 4 builds
- Cleanup runs on every push to main and weekly on Sundays
- Helps manage storage and keep the registry clean
