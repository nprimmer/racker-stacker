import { useRef, useState } from 'react'
import { RackConfig, RackComponent, COMPONENT_COLORS, DistanceUnit, RACK_UNIT_TO_CM, RACK_UNIT_TO_INCHES } from '../../types/rack'
import './Rack.css'

interface RackProps {
  config: RackConfig
  selectedComponent: RackComponent | null
  onComponentSelect: (component: RackComponent | null) => void
  onComponentUpdate: (id: string, updates: Partial<RackComponent>) => void
  onComponentMove?: (componentId: string, sourceRackId: string, targetRackId: string, newPosition: number) => void
  isSelected: boolean
  onRackSelect: () => void
  distanceUnit?: DistanceUnit
}

const Rack: React.FC<RackProps> = ({ config, selectedComponent, onComponentSelect, onComponentUpdate, onComponentMove, isSelected, onRackSelect, distanceUnit = 'inches' }) => {
  const [draggedComponent, setDraggedComponent] = useState<RackComponent | null>(null)
  const [draggedFromRackId, setDraggedFromRackId] = useState<string | null>(null)
  const [dragOverPosition, setDragOverPosition] = useState<number | null>(null)
  const rackRef = useRef<HTMLDivElement>(null)

  const unitHeight = 30 // pixels per rack unit for display

  const handleDragStart = (e: React.DragEvent, component: RackComponent) => {
    setDraggedComponent(component)
    setDraggedFromRackId(config.id)
    // Store both component data and source rack ID
    e.dataTransfer.setData('application/json', JSON.stringify({
      component,
      sourceRackId: config.id
    }))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    if (!rackRef.current) return

    // For now, we'll only show preview if we're dragging from this rack
    // Cross-rack preview is limited by HTML5 drag API
    if (!draggedComponent) return

    const rect = rackRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top
    const unit = Math.max(1, Math.min(
      config.height - draggedComponent.height + 1,
      config.height - Math.floor(y / unitHeight)
    ))

    // Check if position is valid (no overlaps)
    const isValidPosition = !config.components.some(comp => {
      // If dragging within same rack, exclude the dragged component
      if (draggedFromRackId === config.id && comp.id === draggedComponent.id) return false

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

    // Calculate drop position if we don't have one (for cross-rack drops)
    let dropPosition = dragOverPosition

    if (dropPosition === null && rackRef.current) {
      const rect = rackRef.current.getBoundingClientRect()
      const y = e.clientY - rect.top
      dropPosition = config.height - Math.floor(y / unitHeight)
      dropPosition = Math.max(1, Math.min(config.height, dropPosition))
    }

    // Try to get the drag data
    try {
      const dragDataStr = e.dataTransfer.getData('application/json')
      if (dragDataStr) {
        const dragData = JSON.parse(dragDataStr)
        const { component, sourceRackId } = dragData

        // Check if position is valid for cross-rack drops
        if (dropPosition !== null) {
          const isValid = !config.components.some(comp => {
            const compEnd = comp.position + comp.height - 1
            const dragEnd = dropPosition! + component.height - 1
            return (dropPosition! >= comp.position && dropPosition! <= compEnd) ||
                   (dragEnd >= comp.position && dragEnd <= compEnd) ||
                   (dropPosition! <= comp.position && dragEnd >= compEnd)
          })

          if (isValid && onComponentMove) {
            onComponentMove(component.id, sourceRackId, config.id, dropPosition)
          }
        }
      }
    } catch (error) {
      // Fallback to local drag data if available
      if (draggedComponent && draggedFromRackId === config.id && dropPosition !== null) {
        onComponentUpdate(draggedComponent.id, { position: dropPosition })
      }
    }

    setDraggedComponent(null)
    setDraggedFromRackId(null)
    setDragOverPosition(null)
  }

  const handleDragEnd = () => {
    setDraggedComponent(null)
    setDraggedFromRackId(null)
    setDragOverPosition(null)
  }

  const handleDragLeave = () => {
    // Clear the drag preview when leaving the rack
    setDragOverPosition(null)
  }

  const calculateDistance = (comp1: RackComponent, comp2: RackComponent): string => {
    // For components > 1U, calculate range from closest to farthest points
    const comp1Top = comp1.position + comp1.height - 1
    const comp1Bottom = comp1.position
    const comp2Top = comp2.position + comp2.height - 1
    const comp2Bottom = comp2.position

    let minDistance: number
    let maxDistance: number

    if (comp1Top < comp2Bottom) {
      // comp1 is completely below comp2
      minDistance = comp2Bottom - comp1Top
      maxDistance = comp2Top - comp1Bottom
    } else if (comp2Top < comp1Bottom) {
      // comp2 is completely below comp1
      minDistance = comp1Bottom - comp2Top
      maxDistance = comp1Top - comp2Bottom
    } else {
      // Components overlap
      minDistance = 0
      maxDistance = Math.max(
        Math.abs(comp1Top - comp2Bottom),
        Math.abs(comp2Top - comp1Bottom)
      )
    }

    // Convert to selected unit
    let unitLabel = ''
    let conversionFactor = 1

    switch (distanceUnit) {
      case 'U':
        unitLabel = 'U'
        conversionFactor = 1
        break
      case 'cm':
        unitLabel = 'cm'
        conversionFactor = RACK_UNIT_TO_CM
        break
      case 'inches':
      default:
        unitLabel = 'in'
        conversionFactor = RACK_UNIT_TO_INCHES
        break
    }

    const convertedMin = minDistance * conversionFactor
    const convertedMax = maxDistance * conversionFactor

    // If both components are 1U or the distance is the same, show single value
    if (comp1.height === 1 && comp2.height === 1) {
      const center1 = comp1.position + 0.5
      const center2 = comp2.position + 0.5
      const centerDistance = Math.abs(center1 - center2) * conversionFactor
      return `${centerDistance.toFixed(1)} ${unitLabel}`
    }

    // Show range for multi-U components
    if (Math.abs(convertedMin - convertedMax) < 0.1) {
      return `${convertedMin.toFixed(1)} ${unitLabel}`
    }

    return `${convertedMin.toFixed(1)}-${convertedMax.toFixed(1)} ${unitLabel}`
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
        onDragLeave={handleDragLeave}
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
              className={`rack-component ${selectedComponent?.id === component.id ? 'selected' : ''} ${component.subComponents && component.subComponents.length > 0 ? 'has-subcomponents' : ''}`}
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
              {/* Render subcomponents as vertical divisions */}
              {component.subComponents && component.subComponents.length > 0 && (
                <div className="subcomponent-divisions">
                  {component.subComponents.map((subComp, index) => (
                    <div
                      key={subComp.id}
                      className="subcomponent-division"
                      style={{
                        width: `${100 / component.subComponents!.length}%`,
                        left: `${(100 / component.subComponents!.length) * index}%`
                      }}
                      title={`${subComp.name}${subComp.position ? ` (${subComp.position})` : ''}${subComp.metadata?.deviceName ? ` - ${subComp.metadata.deviceName}` : ''}`}
                    >
                      <div className="division-label">
                        {subComp.name.substring(0, 3)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Main component content overlayed */}
              <div className="component-content">
                <div className="component-label">
                  <span className="component-name">{component.name}</span>
                  <span className="component-size">{component.height}U</span>
                </div>
                {component.metadata?.deviceName && (
                  <div className="component-device">{component.metadata.deviceName}</div>
                )}
              </div>
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

      {/* Distance measurement - only show if selected component is in this rack */}
      {selectedComponent && config.components.some(c => c.id === selectedComponent.id) && (
        <div className="distance-info">
          <h3>Distance to other components:</h3>
          <ul>
            {config.components
              .filter(c => c.id !== selectedComponent.id)
              .map(comp => (
                <li key={comp.id}>
                  {comp.name}: {calculateDistance(selectedComponent, comp)}
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