# GLTF Multi-Path Viewer with Grid Pathfinding

A React.js application that allows you to load GLTF/GLB 3D models and create interactive grids for pathfinding visualization using A* algorithm.

## Features

- **3D Model Loading**: Load GLTF/GLB files with complete scene hierarchy visualization
- **Interactive Hierarchy**: Toggle object visibility and select objects for grid generation
- **Multi-Floor Grid System**: Automatically detect multiple floor levels in your 3D models
- **Grid Pathfinding**: Create walkable/blocked areas and find optimal paths using A* algorithm
- **Real-time Visualization**: Interactive 3D environment with orbit controls
- **Path Animation**: Visual path highlighting with markers

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Navigate to the project directory:
   ```bash
   cd react-gltf-viewer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`)

## Usage

### 1. Loading a Model

1. Click "1. Load Model" button
2. Select a GLTF (.gltf) or GLB (.glb) file from your computer
3. The model will be loaded and displayed in the 3D viewer
4. The model hierarchy will appear in the sidebar

### 2. Setting up Grid Generation

1. In the Model Hierarchy section, check the green checkboxes next to objects you want to include in grid generation
2. The system will automatically detect floor levels
3. Grid controls will become available

### 3. Creating a Smart Grid

1. Set Cell Size (0.1-10 units) - determines resolution of the grid
2. Configure Grid Height (0-10 units) - how high above the path the grid appears
3. Click "Create Grid on Selected Path" to generate the pathfinding grid
   - **Smart Generation**: Grid cells are only created where your selected objects exist
   - **No Empty Space**: Unlike traditional grids, this only covers your actual path
   - **Precise Coverage**: Uses raycasting to detect object intersections

### 4. Grid Navigation

1. **Mark Walkable Areas**: Click "Mark Walkable" and click on grid cells to mark them as walkable (green)
2. **Mark Blocked Areas**: Click "Mark Blocked" and click on grid cells to mark them as blocked (red)
3. **Set Start/End Points**: 
   - Click "Set Start Cell" and click on a grid cell to set the starting position (cyan marker, automatically marked as walkable)
   - Click "Set End Cell" and click on a grid cell to set the destination (red marker, automatically marked as walkable)
4. **Find Path**: Click "Find Path" to calculate and visualize the optimal route
   - **Diagonal Movement**: Supports 8-directional pathfinding including diagonals
   - **Smart Corner Checking**: Prevents cutting through blocked corners
   - **Precise Path Visualization**: Yellow path line follows exact walkable route

### 5. Walking Animation

1. **After finding a path**, the walking controls will appear
2. **Walking Speed**: Adjust the speed slider (0.5x to 5.0x speed)
3. **Start Walking**: Click "Start Walking" to begin the animation - the character will walk from start to end
4. **Stop Walking**: Click "Stop Walking" to pause the animation
5. **Reset Position**: Click "Reset Position" to move the character back to the start
6. **Show/Hide Walker**: Toggle visibility of the walking character

### 5. Multi-Floor Navigation

- Use the Floor Management controls to switch between different floor levels
- Each floor maintains its own grid configuration
- Navigate between floors using the dropdown or Previous/Next buttons

## Controls

- **Mouse**: 
  - Left click and drag to orbit around the model
  - Scroll to zoom in/out
  - Click on grid cells when in selection mode
- **Keyboard**: Standard orbit controls

## File Formats Supported

- GLTF (.gltf) - JSON-based 3D format
- GLB (.glb) - Binary version of GLTF

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Technology Stack

- **React.js** - UI framework
- **Three.js** - 3D graphics library
- **Vite** - Build tool and development server
- **A* Algorithm** - Pathfinding implementation

## Features in Detail

### Grid System
- Automatic floor detection based on object Y-coordinates
- Configurable grid size and cell dimensions
- Visual feedback for walkable/blocked areas

### Pathfinding
- A* algorithm implementation for optimal path finding
- Real-time path visualization
- Support for multi-floor navigation

### 3D Interaction
- Full orbit controls for 3D navigation
- Object visibility toggles
- Interactive grid cell selection

## Troubleshooting

1. **Model not loading**: Ensure the file is a valid GLTF/GLB format
2. **Grid not appearing**: Make sure you've selected objects in the hierarchy with the grid checkboxes
3. **Path not found**: Ensure there are walkable cells connecting start and end positions
4. **Performance issues**: Try reducing grid size or model complexity

## Development

To contribute to this project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.