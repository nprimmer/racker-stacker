# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

racker-stacker is a web application for building and planning server/network rack configurations. The application allows users to visually design rack layouts with drag-and-drop functionality, component placement, and cable distance calculations.

## Core Features Implemented

The application currently supports:
1. **Rack Management**: Create racks with specific heights (e.g., 42u)
2. **Component Management**: Add components of various heights (1u, 2u, 4u, etc.)
3. **Drag-and-Drop Interface**: Reposition components within the rack
4. **Component Classification**: Color-coded labels for component types (compute, power, network, storage, cooling)
5. **Distance Calculation**: Measure cable distances between components in inches
6. **Component Details**: Add text field data (device names, IP addresses, subnets)
7. **Persistence**: Save and load rack configurations
8. **Export Features**: Export to spreadsheet and PNG formats

## Development Setup

The project is built with React/TypeScript and Vite, containerized with Docker.

### Local Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Docker Development
```bash
# Run development container with hot reload
docker-compose up dev

# Build and run production container
docker-compose up prod

# Build production Docker image
docker build -t racker-stacker .

# Run production container
docker run -p 8080:80 racker-stacker
```

### Key Libraries Used
- **UI Framework**: React with TypeScript for type safety
- **Build Tool**: Vite for fast development and optimized builds
- **Drag-and-Drop**: Native HTML5 drag-and-drop API
- **State Management**: React hooks (useState) for simplicity
- **Export**: xlsx for spreadsheet export, html2canvas for PNG export
- **Persistence**: JSON file download/upload for saving configurations

## Project Architecture

### Current Implementation Structure
```
src/
  components/
    Rack/           # Main rack visualization with drag-and-drop
    Sidebar/        # Component palette and properties editor
    Toolbar/        # File operations and export features
  styles/           # Global and component CSS files
  types/            # TypeScript type definitions
  App.tsx           # Main application component
  main.tsx          # Application entry point
```

### Key Data Models

**Rack Model**:
- id: unique identifier
- height: total rack units (e.g., 42)
- components: array of placed components

**Component Model**:
- id: unique identifier
- name: component name
- height: size in rack units
- position: starting rack unit position
- type: component classification (compute, network, etc.)
- color: visual indicator based on type
- metadata: additional fields (IP, subnet, etc.)

### State Management Considerations
- Maintain single source of truth for rack configuration
- Support undo/redo for drag-and-drop operations
- Validate component placement (no overlaps, within bounds)

## Testing Approach

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

Focus testing on:
- Component placement validation
- Distance calculations accuracy
- Export functionality
- Save/load integrity

## Common Development Tasks

### Adding a New Component Type
1. Update the component type enum/constants
2. Add corresponding color mapping
3. Update component palette UI
4. Add any specific validation rules

### Implementing Drag-and-Drop
- Ensure collision detection prevents overlapping components
- Maintain visual feedback during drag operations
- Snap to rack unit grid for precise placement

### Export Implementation
- For spreadsheet: Generate structured data with component details and positions
- For PNG: Render the rack view to canvas, then export as image

## Important Considerations

- **Rack Unit Standards**: 1u = 1.75 inches (44.45mm)
- **Cable Distance**: Calculate from center points of components
- **Validation**: Prevent component overlap and ensure within rack bounds
- **Accessibility**: Ensure keyboard navigation for component selection and movement
- **Data Persistence**: This is a client-side only application. Users must export their configurations as JSON files to save their work. The application clearly displays a warning reminding users to export their configurations