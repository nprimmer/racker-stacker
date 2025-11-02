import { useState } from 'react'
import './styles/App.css'
import Rack from './components/Rack/Rack'
import Sidebar from './components/Sidebar/Sidebar'
import Toolbar from './components/Toolbar/Toolbar'
import Modal from './components/Modal/Modal'
import { RackConfig, RackComponent, DistanceUnit } from './types/rack'

function App() {
  const [racks, setRacks] = useState<RackConfig[]>([])
  const [selectedRackId, setSelectedRackId] = useState<string | null>(null)
  const [selectedComponent, setSelectedComponent] = useState<RackComponent | null>(null)
  const [showInitialModal, setShowInitialModal] = useState(true)
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>('inches')

  const currentRack = racks.find(r => r.id === selectedRackId) || null

  // Get the selected component from the current rack to ensure it's always up to date
  const currentSelectedComponent = currentRack?.components.find(c => c.id === selectedComponent?.id) || selectedComponent

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
      id: `component-${Date.now()}`,
      // Initialize new fields if not present
      networkInterfaces: component.networkInterfaces || [],
      tags: component.tags || [],
      subComponents: component.subComponents || [],
      weight: component.weight ?? undefined,
      pduConfig: component.pduConfig || undefined,
      ethernetConfig: component.ethernetConfig || undefined
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

  const handleComponentMove = (componentId: string, sourceRackId: string, targetRackId: string, newPosition: number) => {
    if (sourceRackId === targetRackId) {
      // Moving within same rack - just update position
      handleComponentUpdate(sourceRackId, componentId, { position: newPosition })
      return
    }

    // Moving between racks
    setRacks(prev => {
      let movedComponent: RackComponent | undefined

      // Find and remove component from source rack
      const updatedRacks = prev.map(rack => {
        if (rack.id === sourceRackId) {
          const component = rack.components.find(c => c.id === componentId)
          if (component) {
            movedComponent = { ...component, position: newPosition }
          }
          return {
            ...rack,
            components: rack.components.filter(c => c.id !== componentId)
          }
        }
        return rack
      })

      // Add component to target rack
      if (movedComponent) {
        return updatedRacks.map(rack =>
          rack.id === targetRackId
            ? { ...rack, components: [...rack.components, movedComponent!] }
            : rack
        )
      }

      return updatedRacks
    })
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
    // Function to ensure components have new fields for backward compatibility
    const upgradeComponent = (comp: any): RackComponent => ({
      ...comp,
      networkInterfaces: comp.networkInterfaces || [],
      tags: comp.tags || [],
      subComponents: comp.subComponents || [],
      weight: comp.weight ?? undefined,
      // Handle old PDU config format
      pduConfig: comp.pduConfig ? (
        comp.pduConfig.frontBack ? comp.pduConfig : {
          count: comp.pduConfig.count || 0,
          frontBack: comp.pduConfig.placement === 'front' || comp.pduConfig.placement === 'back' ? comp.pduConfig.placement : 'back',
          side: comp.pduConfig.placement === 'left' || comp.pduConfig.placement === 'right' || comp.pduConfig.placement === 'center' ? comp.pduConfig.placement : 'center'
        }
      ) : undefined,
      // Handle old ethernet config format
      ethernetConfig: comp.ethernetConfig ? (
        comp.ethernetConfig.frontCount !== undefined ? comp.ethernetConfig : {
          frontCount: comp.ethernetConfig.placement === 'front' ? (comp.ethernetConfig.count || 0) : 0,
          backCount: comp.ethernetConfig.placement === 'back' ? (comp.ethernetConfig.count || 0) : 0
        }
      ) : undefined,
      // Migrate old IP/subnet fields to first network interface if present
      ...(comp.metadata?.ipAddress && !comp.networkInterfaces?.length ? {
        networkInterfaces: [{
          id: `nic-${Date.now()}`,
          name: 'eth0',
          addresses: [{
            id: `addr-${Date.now()}`,
            address: comp.metadata.ipAddress,
            subnet: comp.metadata.subnet,
            type: 'primary'
          }]
        }]
      } : {})
    })

    // Handle both old single rack format and new multi-rack format
    if (Array.isArray(data)) {
      const upgradedRacks = data.map(rack => ({
        ...rack,
        components: rack.components.map(upgradeComponent)
      }))
      setRacks(upgradedRacks)
      setSelectedRackId(upgradedRacks[0]?.id || null)
    } else {
      // Convert old format to new format
      const upgradedRack = {
        ...data,
        components: data.components.map(upgradeComponent)
      }
      setRacks([upgradedRack])
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
        racks={racks}
        distanceUnit={distanceUnit}
        onDistanceUnitChange={setDistanceUnit}
      />

      <div className="app-content">
        {currentRack && (
          <Sidebar
            onComponentAdd={handleComponentAdd}
            selectedComponent={currentSelectedComponent}
            onComponentUpdate={(id, updates) => {
              if (selectedRackId) {
                handleComponentUpdate(selectedRackId, id, updates)
              }
            }}
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
                selectedComponent={currentSelectedComponent}
                onComponentSelect={(comp) => {
                  setSelectedComponent(comp)
                  if (comp) {
                    setSelectedRackId(rack.id)
                  }
                }}
                onComponentUpdate={(componentId, updates) => handleComponentUpdate(rack.id, componentId, updates)}
                onComponentMove={handleComponentMove}
                isSelected={rack.id === selectedRackId}
                onRackSelect={() => setSelectedRackId(rack.id)}
                distanceUnit={distanceUnit}
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