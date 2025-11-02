import { useState } from 'react'
import './styles/App.css'
import Rack from './components/Rack/Rack'
import Sidebar from './components/Sidebar/Sidebar'
import Toolbar from './components/Toolbar/Toolbar'
import Modal from './components/Modal/Modal'
import { RackConfig, RackComponent } from './types/rack'

function App() {
  const [racks, setRacks] = useState<RackConfig[]>([])
  const [selectedRackId, setSelectedRackId] = useState<string | null>(null)
  const [selectedComponent, setSelectedComponent] = useState<RackComponent | null>(null)
  const [showInitialModal, setShowInitialModal] = useState(true)
  const [zoomLevel, setZoomLevel] = useState<number>(1)

  const currentRack = racks.find(r => r.id === selectedRackId) || null

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 2))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5))
  }

  const handleZoomReset = () => {
    setZoomLevel(1)
  }

  const handleComponentAdd = (component: Omit<RackComponent, 'id'>) => {
    if (!selectedRackId) return

    const newComponent: RackComponent = {
      ...component,
      id: `component-${Date.now()}`
    }

    setRacks(prev => prev.map(rack =>
      rack.id === selectedRackId
        ? { ...rack, components: [...rack.components, newComponent] }
        : rack
    ))
  }

  const handleComponentUpdate = (rackId: string, componentId: string, updates: Partial<RackComponent>) => {
    setRacks(prev => prev.map(rack =>
      rack.id === rackId
        ? {
            ...rack,
            components: rack.components.map(comp =>
              comp.id === componentId ? { ...comp, ...updates } : comp
            )
          }
        : rack
    ))
  }

  const handleComponentDelete = (id: string) => {
    if (!selectedRackId) return

    setRacks(prev => prev.map(rack =>
      rack.id === selectedRackId
        ? { ...rack, components: rack.components.filter(comp => comp.id !== id) }
        : rack
    ))
    setSelectedComponent(null)
  }

  const handleAddRack = (height: number, name: string) => {
    const newRack: RackConfig = {
      id: `rack-${Date.now()}`,
      name: name || `Rack ${racks.length + 1}`,
      height,
      components: []
    }
    setRacks(prev => [...prev, newRack])
    setSelectedRackId(newRack.id)
    setShowInitialModal(false)
  }

  const handleStartOver = () => {
    setRacks([])
    setSelectedRackId(null)
    setSelectedComponent(null)
    setShowInitialModal(true)
  }

  const handleSave = () => {
    const dataStr = JSON.stringify(racks, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)

    const exportFileDefaultName = `rack-config-${Date.now()}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleLoad = (data: RackConfig[] | RackConfig) => {
    // Handle both old single rack format and new multi-rack format
    if (Array.isArray(data)) {
      setRacks(data)
      setSelectedRackId(data[0]?.id || null)
    } else {
      // Convert old format to new format
      setRacks([data])
      setSelectedRackId(data.id)
    }
    setSelectedComponent(null)
    setShowInitialModal(false)
  }

  return (
    <div className="app">
      <div className="app-header">
        <h1>Racker Stacker</h1>
        <div className="save-notice">
          ⚠️ Remember to save your configuration to preserve your work locally
        </div>
      </div>

      <Toolbar
        onSave={handleSave}
        onLoad={handleLoad}
        onAddRack={handleAddRack}
        onStartOver={handleStartOver}
        hasRacks={racks.length > 0}
      />

      <div className="app-content">
        {currentRack && (
          <Sidebar
            onComponentAdd={handleComponentAdd}
            selectedComponent={selectedComponent}
            onComponentUpdate={(id, updates) => handleComponentUpdate(selectedRackId!, id, updates)}
            onComponentDelete={handleComponentDelete}
            rackConfig={currentRack}
          />
        )}

        <div className="rack-container">
          {racks.length > 0 && (
            <div className="zoom-controls-container">
              <div className="zoom-controls">
                <button className="zoom-btn" onClick={handleZoomOut} disabled={zoomLevel <= 0.5}>
                  ➖
                </button>
                <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
                <button className="zoom-btn" onClick={handleZoomIn} disabled={zoomLevel >= 2}>
                  ➕
                </button>
                <button className="zoom-btn" onClick={handleZoomReset}>
                  Reset
                </button>
              </div>
            </div>
          )}
          <div className="racks-row" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}>
            {racks.map(rack => (
              <Rack
                key={rack.id}
                config={rack}
                selectedComponent={selectedComponent}
                onComponentSelect={setSelectedComponent}
                onComponentUpdate={(componentId, updates) => handleComponentUpdate(rack.id, componentId, updates)}
                isSelected={rack.id === selectedRackId}
                onRackSelect={() => setSelectedRackId(rack.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showInitialModal}
        onClose={() => setShowInitialModal(false)}
        onConfirm={handleAddRack}
        title="Create Your First Rack"
      />
    </div>
  )
}

export default App