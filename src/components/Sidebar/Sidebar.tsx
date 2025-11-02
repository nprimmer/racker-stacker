import { useState, useEffect } from 'react'
import { ComponentType, RackComponent, RackConfig, COMPONENT_COLORS } from '../../types/rack'
import './Sidebar.css'

interface SidebarProps {
  onComponentAdd: (component: Omit<RackComponent, 'id'>) => void
  selectedComponent: RackComponent | null
  onComponentUpdate: (id: string, updates: Partial<RackComponent>) => void
  onComponentDelete: (id: string) => void
  rackConfig: RackConfig
}

const Sidebar: React.FC<SidebarProps> = ({
  onComponentAdd,
  selectedComponent,
  onComponentUpdate,
  onComponentDelete,
  rackConfig
}) => {
  const [newComponent, setNewComponent] = useState({
    name: '',
    height: 1,
    position: 1,
    type: 'compute' as ComponentType
  })
  const [error, setError] = useState<string>('')

  const componentTypes: ComponentType[] = ['compute', 'network', 'storage', 'power', 'cooling', 'other']

  // Calculate the next available position whenever rack config or component height changes
  useEffect(() => {
    const nextPosition = findNextAvailablePosition(newComponent.height)
    if (nextPosition && nextPosition !== newComponent.position) {
      setNewComponent(prev => ({ ...prev, position: nextPosition }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rackConfig.components.length, newComponent.height, rackConfig.height])

  const findNextAvailablePosition = (componentHeight: number): number | null => {
    // If rack is empty, start at the top (highest position number)
    if (rackConfig.components.length === 0) {
      return rackConfig.height - componentHeight + 1
    }

    // Try to find the highest available position (from top of rack down)
    // Position numbering: 1 is at bottom, rackConfig.height is at top
    for (let position = rackConfig.height - componentHeight + 1; position >= 1; position--) {
      const isAvailable = !rackConfig.components.some(comp => {
        const compEnd = comp.position + comp.height - 1
        const newEnd = position + componentHeight - 1
        return (position >= comp.position && position <= compEnd) ||
               (newEnd >= comp.position && newEnd <= compEnd) ||
               (position <= comp.position && newEnd >= compEnd)
      })

      if (isAvailable) {
        return position
      }
    }

    return 1 // Default to position 1 if no space available
  }

  const validateComponentPlacement = (position: number, height: number): boolean => {
    // Check if component would exceed rack bounds
    if (position < 1 || position + height - 1 > rackConfig.height) {
      return false
    }

    // Check for overlaps with existing components
    return !rackConfig.components.some(comp => {
      const compEnd = comp.position + comp.height - 1
      const newEnd = position + height - 1
      return (position >= comp.position && position <= compEnd) ||
             (newEnd >= comp.position && newEnd <= compEnd) ||
             (position <= comp.position && newEnd >= compEnd)
    })
  }

  const handleAddComponent = () => {
    if (!newComponent.name) {
      setError('Please enter a component name')
      return
    }

    if (!validateComponentPlacement(newComponent.position, newComponent.height)) {
      setError('Component would overlap with existing components or exceed rack bounds')
      return
    }

    onComponentAdd({
      ...newComponent,
      color: COMPONENT_COLORS[newComponent.type],
      metadata: {}
    })

    // Reset form
    setNewComponent({
      name: '',
      height: 1,
      position: findNextAvailablePosition(1) || 1,
      type: 'compute'
    })
    setError('')
  }

  const handleMetadataUpdate = (key: string, value: string) => {
    if (!selectedComponent) return

    onComponentUpdate(selectedComponent.id, {
      metadata: {
        ...selectedComponent.metadata,
        [key]: value
      }
    })
  }

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <h3>Add Component</h3>

        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={newComponent.name}
            onChange={(e) => {
              setNewComponent({ ...newComponent, name: e.target.value })
              setError('')
            }}
            placeholder="e.g., Web Server 1"
          />
        </div>

        <div className="form-group">
          <label>Height (U)</label>
          <input
            type="number"
            min="1"
            max={rackConfig.height}
            value={newComponent.height}
            onChange={(e) => {
              setNewComponent({ ...newComponent, height: parseInt(e.target.value) || 1 })
              setError('')
            }}
          />
        </div>

        <div className="form-group">
          <label>Starting Position (Auto-calculated)</label>
          <input
            type="number"
            min="1"
            max={rackConfig.height}
            value={newComponent.position}
            onChange={(e) => {
              setNewComponent({ ...newComponent, position: parseInt(e.target.value) || 1 })
              setError('')
            }}
          />
          <span className="form-hint">Position is automatically set to the highest available slot</span>
        </div>

        <div className="form-group">
          <label>Type</label>
          <select
            value={newComponent.type}
            onChange={(e) => setNewComponent({ ...newComponent, type: e.target.value as ComponentType })}
          >
            {componentTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <button className="btn btn-primary" onClick={handleAddComponent}>
          Add to Rack
        </button>
      </div>

      {selectedComponent && (
        <div className="sidebar-section">
          <h3>Component Details</h3>

          <div className="component-info">
            <strong>{selectedComponent.name}</strong>
            <div className="component-badge" style={{ backgroundColor: selectedComponent.color }}>
              {selectedComponent.type}
            </div>
          </div>

          <div className="form-group">
            <label>Device Name</label>
            <input
              type="text"
              value={selectedComponent.metadata?.deviceName || ''}
              onChange={(e) => handleMetadataUpdate('deviceName', e.target.value)}
              placeholder="e.g., prod-web-01"
            />
          </div>

          <div className="form-group">
            <label>IP Address</label>
            <input
              type="text"
              value={selectedComponent.metadata?.ipAddress || ''}
              onChange={(e) => handleMetadataUpdate('ipAddress', e.target.value)}
              placeholder="e.g., 192.168.1.100"
            />
          </div>

          <div className="form-group">
            <label>Subnet</label>
            <input
              type="text"
              value={selectedComponent.metadata?.subnet || ''}
              onChange={(e) => handleMetadataUpdate('subnet', e.target.value)}
              placeholder="e.g., 192.168.1.0/24"
            />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={selectedComponent.metadata?.notes || ''}
              onChange={(e) => handleMetadataUpdate('notes', e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <button
            className="btn btn-danger"
            onClick={() => onComponentDelete(selectedComponent.id)}
          >
            Delete Component
          </button>
        </div>
      )}
    </div>
  )
}

export default Sidebar