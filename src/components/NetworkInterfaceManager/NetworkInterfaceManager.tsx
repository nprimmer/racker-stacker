import { useState } from 'react'
import { NetworkInterface, NetworkAddress, LinkSpeed, LINK_SPEEDS, ADDRESS_TYPES } from '../../types/rack'
import './NetworkInterfaceManager.css'

interface NetworkInterfaceManagerProps {
  interfaces: NetworkInterface[]
  onChange: (interfaces: NetworkInterface[]) => void
  isSubComponent?: boolean
}

export default function NetworkInterfaceManager({
  interfaces,
  onChange,
  isSubComponent = false
}: NetworkInterfaceManagerProps) {
  const [expandedInterface, setExpandedInterface] = useState<string | null>(null)

  const handleAddInterface = () => {
    const newInterface: NetworkInterface = {
      id: `nic-${Date.now()}`,
      name: `eth${interfaces.length}`,
      addresses: [],
      notes: ''
    }
    onChange([...interfaces, newInterface])
    setExpandedInterface(newInterface.id)
  }

  const handleUpdateInterface = (id: string, updates: Partial<NetworkInterface>) => {
    onChange(interfaces.map(iface =>
      iface.id === id ? { ...iface, ...updates } : iface
    ))
  }

  const handleDeleteInterface = (id: string) => {
    onChange(interfaces.filter(iface => iface.id !== id))
    if (expandedInterface === id) {
      setExpandedInterface(null)
    }
  }

  const handleAddAddress = (interfaceId: string) => {
    const newAddress: NetworkAddress = {
      id: `addr-${Date.now()}`,
      address: '',
      type: 'primary'
    }

    const iface = interfaces.find(i => i.id === interfaceId)
    if (iface) {
      handleUpdateInterface(interfaceId, {
        addresses: [...(iface.addresses || []), newAddress]
      })
    }
  }

  const handleUpdateAddress = (interfaceId: string, addressId: string, updates: Partial<NetworkAddress>) => {
    const iface = interfaces.find(i => i.id === interfaceId)
    if (iface) {
      handleUpdateInterface(interfaceId, {
        addresses: iface.addresses.map(addr =>
          addr.id === addressId ? { ...addr, ...updates } : addr
        )
      })
    }
  }

  const handleDeleteAddress = (interfaceId: string, addressId: string) => {
    const iface = interfaces.find(i => i.id === interfaceId)
    if (iface) {
      handleUpdateInterface(interfaceId, {
        addresses: iface.addresses.filter(addr => addr.id !== addressId)
      })
    }
  }

  const toggleExpanded = (id: string) => {
    setExpandedInterface(expandedInterface === id ? null : id)
  }

  return (
    <div className="network-interface-manager">
      <div className="section-header">
        <h4>{isSubComponent ? 'Sub-Component' : 'Component'} Network Interfaces</h4>
      </div>
      <button
        className="btn btn-small btn-primary"
        onClick={handleAddInterface}
      >
        + Add Interface
      </button>

      {interfaces.length === 0 ? (
        <div className="empty-state">No network interfaces configured</div>
      ) : (
        <div className="interfaces-list">
          {interfaces.map((iface) => (
            <div key={iface.id} className="interface-item">
              <div
                className="interface-header"
                onClick={() => toggleExpanded(iface.id)}
              >
                <span className="interface-name">{iface.name}</span>
                {iface.macAddress && (
                  <span className="interface-mac">{iface.macAddress}</span>
                )}
                {iface.linkSpeed && (
                  <span className="interface-speed">
                    {LINK_SPEEDS.find(s => s.value === iface.linkSpeed)?.label}
                  </span>
                )}
                <button
                  className="btn-icon delete"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteInterface(iface.id)
                  }}
                >
                  🗑️
                </button>
              </div>

              {expandedInterface === iface.id && (
                <div className="interface-details">
                  <div className="form-row">
                    <label>Interface Name:</label>
                    <input
                      type="text"
                      value={iface.name}
                      onChange={(e) => handleUpdateInterface(iface.id, { name: e.target.value })}
                      placeholder="e.g., eth0, eno1, Management"
                    />
                  </div>

                  <div className="form-row">
                    <label>MAC Address:</label>
                    <input
                      type="text"
                      value={iface.macAddress || ''}
                      onChange={(e) => handleUpdateInterface(iface.id, { macAddress: e.target.value })}
                      placeholder="00:00:00:00:00:00"
                    />
                  </div>

                  <div className="form-row">
                    <label>Link Speed:</label>
                    <select
                      value={iface.linkSpeed || ''}
                      onChange={(e) => handleUpdateInterface(iface.id, {
                        linkSpeed: e.target.value as LinkSpeed || undefined
                      })}
                    >
                      <option value="">Select speed...</option>
                      {LINK_SPEEDS.map(speed => (
                        <option key={speed.value} value={speed.value}>
                          {speed.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <label>Port Number:</label>
                    <input
                      type="text"
                      value={iface.portNumber || ''}
                      onChange={(e) => handleUpdateInterface(iface.id, { portNumber: e.target.value })}
                      placeholder="e.g., Port 1, Gi0/1"
                    />
                  </div>

                  <div className="form-row">
                    <label>VLAN:</label>
                    <input
                      type="number"
                      value={iface.vlan || ''}
                      onChange={(e) => handleUpdateInterface(iface.id, {
                        vlan: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                      placeholder="1-4094"
                      min="1"
                      max="4094"
                    />
                  </div>

                  <div className="form-row">
                    <label>Notes:</label>
                    <textarea
                      value={iface.notes || ''}
                      onChange={(e) => handleUpdateInterface(iface.id, { notes: e.target.value })}
                      placeholder="Additional notes..."
                      rows={2}
                    />
                  </div>

                  <div className="addresses-section">
                    <div className="subsection-header">
                      <h5>IP Addresses</h5>
                      <button
                        className="btn btn-small"
                        onClick={() => handleAddAddress(iface.id)}
                      >
                        + Add Address
                      </button>
                    </div>

                    {iface.addresses.length === 0 ? (
                      <div className="empty-state-small">No IP addresses configured</div>
                    ) : (
                      <div className="addresses-list">
                        {iface.addresses.map((addr) => (
                          <div key={addr.id} className="address-item">
                            <div className="address-row">
                              <input
                                type="text"
                                value={addr.address}
                                onChange={(e) => handleUpdateAddress(iface.id, addr.id, {
                                  address: e.target.value
                                })}
                                placeholder="IP Address"
                                className="address-input"
                              />
                              <input
                                type="text"
                                value={addr.subnet || ''}
                                onChange={(e) => handleUpdateAddress(iface.id, addr.id, {
                                  subnet: e.target.value
                                })}
                                placeholder="Subnet"
                                className="subnet-input"
                              />
                              <select
                                value={addr.type || 'primary'}
                                onChange={(e) => handleUpdateAddress(iface.id, addr.id, {
                                  type: e.target.value as NetworkAddress['type']
                                })}
                                className="type-select"
                              >
                                {ADDRESS_TYPES.map(type => (
                                  <option key={type.value} value={type.value}>
                                    {type.label}
                                  </option>
                                ))}
                              </select>
                              <button
                                className="btn-icon delete"
                                onClick={() => handleDeleteAddress(iface.id, addr.id)}
                              >
                                ✕
                              </button>
                            </div>
                            <div className="address-row">
                              <input
                                type="text"
                                value={addr.hostname || ''}
                                onChange={(e) => handleUpdateAddress(iface.id, addr.id, {
                                  hostname: e.target.value
                                })}
                                placeholder="Hostname (optional)"
                                className="hostname-input"
                              />
                              <input
                                type="text"
                                value={addr.notes || ''}
                                onChange={(e) => handleUpdateAddress(iface.id, addr.id, {
                                  notes: e.target.value
                                })}
                                placeholder="Notes (optional)"
                                className="notes-input"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}