import { useRef, useState } from 'react'
import { RackConfig, RackComponent, COMPONENT_COLORS } from '../../types/rack'
import './Rack.css'

interface RackProps {
  config: RackConfig
  selectedComponent: RackComponent | null
  onComponentSelect: (component: RackComponent | null) => void
  onComponentUpdate: (id: string, updates: Partial<RackComponent>) => void
  isSelected: boolean
  onRackSelect: () => void
}

const Rack: React.FC<RackProps> = ({ config, selectedComponent, onComponentSelect, onComponentUpdate, isSelected, onRackSelect }) => {
  const [draggedComponent, setDraggedComponent] = useState<RackComponent | null>(null)
  const [dragOverPosition, setDragOverPosition] = useState<number | null>(null)
  const rackRef = useRef<HTMLDivElement>(null)

  const unitHeight = 30 // pixels per rack unit for display

  const handleDragStart = (e: React.DragEvent, component: RackComponent) => {
    setDraggedComponent(component)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    if (!rackRef.current || !draggedComponent) return

    const rect = rackRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top
    const unit = Math.max(1, Math.min(
      config.height - draggedComponent.height + 1,
      config.height - Math.floor(y / unitHeight)
    ))

    // Check if position is valid (no overlaps)
    const isValidPosition = !config.components.some(comp => {
      if (comp.id === draggedComponent.id) return false
      const compEnd = comp.position + comp.height - 1
      const dragEnd = unit + draggedComponent.height - 1
      return (unit >= comp.position && unit <= compEnd) ||
             (dragEnd >= comp.position && dragEnd <= compEnd) ||
             (unit <= comp.position && dragEnd >= compEnd)
    })

    setDragOverPosition(isValidPosition ? unit : null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()

    if (draggedComponent && dragOverPosition !== null) {
      onComponentUpdate(draggedComponent.id, { position: dragOverPosition })
    }

    setDraggedComponent(null)
    setDragOverPosition(null)
  }

  const handleDragEnd = () => {
    setDraggedComponent(null)
    setDragOverPosition(null)
  }

  const calculateDistance = (comp1: RackComponent, comp2: RackComponent): number => {
    const center1 = comp1.position + comp1.height / 2
    const center2 = comp2.position + comp2.height / 2
    const unitDistance = Math.abs(center1 - center2)
    return unitDistance * 1.75 // 1U = 1.75 inches
  }

  return (
    <div
      className={`rack-wrapper ${isSelected ? 'selected' : ''}`}
      onClick={onRackSelect}
    >
      <div className="rack-header">
        <h2>{config.name} ({config.height}U)</h2>
      </div>

      <div
        className="rack"
        ref={rackRef}
        style={{ height: config.height * unitHeight }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Rack unit markers */}
        <div className="rack-units">
          {Array.from({ length: config.height }, (_, i) => (
            <div key={i} className="rack-unit-marker">
              <span>{config.height - i}</span>
            </div>
          ))}
        </div>

        {/* Components */}
        <div className="rack-components">
          {config.components.map(component => (
            <div
              key={component.id}
              className={`rack-component ${selectedComponent?.id === component.id ? 'selected' : ''}`}
              style={{
                height: component.height * unitHeight - 2,
                bottom: (component.position - 1) * unitHeight,
                backgroundColor: component.color || COMPONENT_COLORS[component.type],
                opacity: draggedComponent?.id === component.id ? 0.5 : 1
              }}
              draggable
              onDragStart={(e) => handleDragStart(e, component)}
              onDragEnd={handleDragEnd}
              onClick={() => onComponentSelect(component)}
            >
              <div className="component-label">
                <span className="component-name">{component.name}</span>
                <span className="component-size">{component.height}U</span>
              </div>
              {component.metadata?.deviceName && (
                <div className="component-device">{component.metadata.deviceName}</div>
              )}
            </div>
          ))}

          {/* Drop preview */}
          {dragOverPosition !== null && draggedComponent && (
            <div
              className="rack-component-preview"
              style={{
                height: draggedComponent.height * unitHeight - 2,
                bottom: (dragOverPosition - 1) * unitHeight
              }}
            />
          )}
        </div>
      </div>

      {/* Distance measurement */}
      {selectedComponent && (
        <div className="distance-info">
          <h3>Distance to other components:</h3>
          <ul>
            {config.components
              .filter(c => c.id !== selectedComponent.id)
              .map(comp => (
                <li key={comp.id}>
                  {comp.name}: {calculateDistance(selectedComponent, comp).toFixed(2)} inches
                </li>
              ))
            }
          </ul>
        </div>
      )}
    </div>
  )
}

export default Rack