import { useState } from 'react'
import { SubComponent, ComponentType, COMPONENT_COLORS, FRONT_BACK_OPTIONS, SIDE_OPTIONS } from '../../types/rack'
import NetworkInterfaceManager from '../NetworkInterfaceManager/NetworkInterfaceManager'
import TagsManager from '../TagsManager/TagsManager'
import './SubComponentManager.css'

interface SubComponentManagerProps {
  subComponents: SubComponent[]
  parentComponentId: string
  onChange: (subComponents: SubComponent[]) => void
}

export default function SubComponentManager({
  subComponents,
  parentComponentId,
  onChange
}: SubComponentManagerProps) {
  const [expandedSubComponent, setExpandedSubComponent] = useState<string | null>(null)

  const componentTypes: ComponentType[] = [
    'compute', 'network', 'storage', 'power', 'cooling', 'patch_panel', 'other'
  ]

  const handleAddSubComponent = () => {
    const newSubComponent: SubComponent = {
      id: `subcomp-${Date.now()}`,
      name: `Sub-Component ${subComponents.length + 1}`,
      type: 'compute',
      parentComponentId,
      position: `slot-${subComponents.length + 1}`,
      networkInterfaces: [],
      tags: [],
      weight: undefined,
      pduConfig: undefined,
      ethernetConfig: undefined,
      metadata: {}
    }
    onChange([...subComponents, newSubComponent])
    setExpandedSubComponent(newSubComponent.id)
  }

  const handleUpdateSubComponent = (id: string, updates: Partial<SubComponent>) => {
    onChange(subComponents.map(sub =>
      sub.id === id ? { ...sub, ...updates } : sub
    ))
  }

  const handleDeleteSubComponent = (id: string) => {
    onChange(subComponents.filter(sub => sub.id !== id))
    if (expandedSubComponent === id) {
      setExpandedSubComponent(null)
    }
  }

  const handleMetadataUpdate = (id: string, key: string, value: string) => {
    const subComponent = subComponents.find(s => s.id === id)
    if (subComponent) {
      handleUpdateSubComponent(id, {
        metadata: {
          ...subComponent.metadata,
          [key]: value
        }
      })
    }
  }

  const toggleExpanded = (id: string) => {
    setExpandedSubComponent(expandedSubComponent === id ? null : id)
  }

  const predefinedPositions = [
    'slot-1', 'slot-2', 'slot-3', 'slot-4',
    'left', 'right', 'center',
    'top', 'bottom',
    'blade-1', 'blade-2', 'blade-3', 'blade-4',
    'module-a', 'module-b', 'module-c',
    'front', 'rear'
  ]

  return (
    <div className="subcomponent-manager">
      <div className="section-header">
        <h4>Sub-Components</h4>
      </div>
      <button
        className="btn btn-small btn-primary"
        onClick={handleAddSubComponent}
      >
        + Add Sub-Component
      </button>

      {subComponents.length === 0 ? (
        <div className="empty-state">
          No sub-components configured. Use sub-components to divide a rack unit into multiple logical components.
        </div>
      ) : (
        <div className="subcomponents-list">
          {subComponents.map((subComponent) => (
            <div key={subComponent.id} className="subcomponent-item">
              <div
                className="subcomponent-header"
                onClick={() => toggleExpanded(subComponent.id)}
              >
                <span className="subcomponent-name">{subComponent.name}</span>
                <span
                  className="subcomponent-type"
                  style={{ backgroundColor: COMPONENT_COLORS[subComponent.type] }}
                >
                  {subComponent.type}
                </span>
                {subComponent.position && (
                  <span className="subcomponent-position">{subComponent.position}</span>
                )}
                <button
                  className="btn-icon delete"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteSubComponent(subComponent.id)
                  }}
                >
                  🗑️
                </button>
              </div>

              {expandedSubComponent === subComponent.id && (
                <div className="subcomponent-details">
                  <div className="form-row">
                    <label>Name:</label>
                    <input
                      type="text"
                      value={subComponent.name}
                      onChange={(e) => handleUpdateSubComponent(subComponent.id, {
                        name: e.target.value
                      })}
                      placeholder="Sub-component name"
                    />
                  </div>

                  <div className="form-row">
                    <label>Type:</label>
                    <select
                      value={subComponent.type}
                      onChange={(e) => handleUpdateSubComponent(subComponent.id, {
                        type: e.target.value as ComponentType
                      })}
                    >
                      {componentTypes.map(type => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <label>Position:</label>
                    <input
                      type="text"
                      value={subComponent.position || ''}
                      onChange={(e) => handleUpdateSubComponent(subComponent.id, {
                        position: e.target.value
                      })}
                      placeholder="e.g., slot-1, left, blade-2"
                      list={`positions-${subComponent.id}`}
                    />
                    <datalist id={`positions-${subComponent.id}`}>
                      {predefinedPositions.map(pos => (
                        <option key={pos} value={pos} />
                      ))}
                    </datalist>
                  </div>

                  <div className="metadata-section">
                    <h5>Metadata</h5>
                    <div className="form-row">
                      <label>Device Name:</label>
                      <input
                        type="text"
                        value={subComponent.metadata?.deviceName || ''}
                        onChange={(e) => handleMetadataUpdate(subComponent.id, 'deviceName', e.target.value)}
                        placeholder="e.g., blade-server-01"
                      />
                    </div>

                    <div className="form-row">
                      <label>Serial Number:</label>
                      <input
                        type="text"
                        value={subComponent.metadata?.serialNumber || ''}
                        onChange={(e) => handleMetadataUpdate(subComponent.id, 'serialNumber', e.target.value)}
                        placeholder="Serial number"
                      />
                    </div>

                    <div className="form-row">
                      <label>Model:</label>
                      <input
                        type="text"
                        value={subComponent.metadata?.model || ''}
                        onChange={(e) => handleMetadataUpdate(subComponent.id, 'model', e.target.value)}
                        placeholder="Model number"
                      />
                    </div>

                    <div className="form-row">
                      <label>Manufacturer:</label>
                      <input
                        type="text"
                        value={subComponent.metadata?.manufacturer || ''}
                        onChange={(e) => handleMetadataUpdate(subComponent.id, 'manufacturer', e.target.value)}
                        placeholder="Manufacturer name"
                      />
                    </div>

                    <div className="form-row">
                      <label>Weight (lbs):</label>
                      <input
                        type="number"
                        value={subComponent.weight ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleUpdateSubComponent(subComponent.id, {
                            weight: value === '' ? undefined : Number(value)
                          })
                        }}
                        placeholder="e.g., 25"
                        min="0"
                        step="0.1"
                      />
                    </div>

                    <div className="form-row">
                      <label>Power (W):</label>
                      <input
                        type="text"
                        value={subComponent.metadata?.powerConsumption || ''}
                        onChange={(e) => handleMetadataUpdate(subComponent.id, 'powerConsumption', e.target.value)}
                        placeholder="e.g., 250W"
                      />
                    </div>

                    <div className="form-row">
                      <label>PDU Config:</label>
                      <div className="config-inputs">
                        <input
                          type="number"
                          value={subComponent.pduConfig?.count || 0}
                          onChange={(e) => handleUpdateSubComponent(subComponent.id, {
                            pduConfig: {
                              count: Number(e.target.value) || 0,
                              frontBack: subComponent.pduConfig?.frontBack || 'back',
                              side: subComponent.pduConfig?.side || 'center'
                            }
                          })}
                          placeholder="Count"
                          min="0"
                          max="10"
                          className="count-input"
                        />
                        <select
                          value={subComponent.pduConfig?.frontBack || 'back'}
                          onChange={(e) => handleUpdateSubComponent(subComponent.id, {
                            pduConfig: {
                              count: subComponent.pduConfig?.count || 0,
                              frontBack: e.target.value as any,
                              side: subComponent.pduConfig?.side || 'center'
                            }
                          })}
                          className="placement-select"
                        >
                          {FRONT_BACK_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={subComponent.pduConfig?.side || 'center'}
                          onChange={(e) => handleUpdateSubComponent(subComponent.id, {
                            pduConfig: {
                              count: subComponent.pduConfig?.count || 0,
                              frontBack: subComponent.pduConfig?.frontBack || 'back',
                              side: e.target.value as any
                            }
                          })}
                          className="placement-select"
                        >
                          {SIDE_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <label>Ethernet Ports:</label>
                      <div className="ethernet-config">
                        <div className="config-inputs">
                          <span className="config-label">Front:</span>
                          <input
                            type="number"
                            value={subComponent.ethernetConfig?.frontCount || 0}
                            onChange={(e) => handleUpdateSubComponent(subComponent.id, {
                              ethernetConfig: {
                                frontCount: Number(e.target.value) || 0,
                                backCount: subComponent.ethernetConfig?.backCount || 0
                              }
                            })}
                            placeholder="Front"
                            min="0"
                            max="100"
                            className="ethernet-count-input"
                          />
                        </div>
                        <div className="config-inputs">
                          <span className="config-label">Back:</span>
                          <input
                            type="number"
                            value={subComponent.ethernetConfig?.backCount || 0}
                            onChange={(e) => handleUpdateSubComponent(subComponent.id, {
                              ethernetConfig: {
                                frontCount: subComponent.ethernetConfig?.frontCount || 0,
                                backCount: Number(e.target.value) || 0
                              }
                            })}
                            placeholder="Back"
                            min="0"
                            max="100"
                            className="ethernet-count-input"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-row">
                      <label>Notes:</label>
                      <textarea
                        value={subComponent.metadata?.notes || ''}
                        onChange={(e) => handleMetadataUpdate(subComponent.id, 'notes', e.target.value)}
                        placeholder="Additional notes..."
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="tags-section">
                    <h5>Tags</h5>
                    <TagsManager
                      tags={subComponent.tags}
                      onChange={(tags) => handleUpdateSubComponent(subComponent.id, { tags })}
                      placeholder="Add tags for this sub-component..."
                    />
                  </div>

                  <NetworkInterfaceManager
                    interfaces={subComponent.networkInterfaces}
                    onChange={(interfaces) => handleUpdateSubComponent(subComponent.id, {
                      networkInterfaces: interfaces
                    })}
                    isSubComponent={true}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}