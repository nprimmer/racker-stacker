import { useRef, useState } from 'react'
import { RackConfig, DistanceUnit, DISTANCE_UNITS } from '../../types/rack'
import { ExportService } from '../../services/ExportService'
import Modal from '../Modal/Modal'
import './Toolbar.css'

interface ToolbarProps {
  onSave: () => void
  onLoad: (data: RackConfig[] | RackConfig) => void
  onAddRack: (height: number, name: string) => void
  onStartOver: () => void
  hasRacks: boolean
  racks: RackConfig[]
  distanceUnit: DistanceUnit
  onDistanceUnitChange: (unit: DistanceUnit) => void
}

const Toolbar: React.FC<ToolbarProps> = ({ onSave, onLoad, onAddRack, onStartOver, hasRacks, racks, distanceUnit, onDistanceUnitChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showModal, setShowModal] = useState(false)
  const [showStartOverConfirmation, setShowStartOverConfirmation] = useState(false)

  const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)

        // Handle both old single-rack and new multi-rack formats
        if (Array.isArray(json)) {
          onLoad(json)
        } else if (json.id && json.height && Array.isArray(json.components)) {
          onLoad(json) // Single rack - will be converted to array
        } else {
          alert('Invalid rack configuration file')
        }
      } catch (error) {
        alert('Failed to load file. Please ensure it is a valid rack configuration.')
      }
    }
    reader.readAsText(file)
  }

  const handleNewRack = () => {
    setShowModal(true)
  }

  const handleStartOverClick = () => {
    if (hasRacks) {
      setShowStartOverConfirmation(true)
    }
  }

  const handleCreateRack = (height: number, name: string) => {
    onAddRack(height, name)
    setShowModal(false)
  }

  const handleExportPNG = async () => {
    if (!hasRacks) {
      alert('Please create at least one rack before exporting.')
      return
    }
    await ExportService.exportToPNG()
  }

  const handleExportSpreadsheet = () => {
    if (!hasRacks) {
      alert('Please create at least one rack before exporting.')
      return
    }
    ExportService.exportToSpreadsheet(racks)
  }

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={handleNewRack}>
            ➕ New Rack
          </button>

          <button className="toolbar-btn" onClick={handleStartOverClick}>
            🔄 Start Over
          </button>
        </div>

        <div className="toolbar-group">
          <label className="toolbar-label">Distance Unit:</label>
          <select
            className="toolbar-select"
            value={distanceUnit}
            onChange={(e) => onDistanceUnitChange(e.target.value as DistanceUnit)}
          >
            {DISTANCE_UNITS.map(unit => (
              <option key={unit.value} value={unit.value}>
                {unit.label}
              </option>
            ))}
          </select>
        </div>

        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={onSave}>
            💾 Save Configuration
          </button>

          <button className="toolbar-btn" onClick={() => fileInputRef.current?.click()}>
            📂 Load Configuration
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileLoad}
            style={{ display: 'none' }}
          />
        </div>

        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={handleExportPNG}>
            🖼️ Export as PNG
          </button>

          <button className="toolbar-btn" onClick={handleExportSpreadsheet}>
            📊 Export to Excel
          </button>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleCreateRack}
        title="Create New Rack"
      />

      {showStartOverConfirmation && (
        <div className="modal-overlay" onClick={() => setShowStartOverConfirmation(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Start Over?</h2>
            <p>This will clear all racks and components. Any unsaved changes will be lost. Are you sure you want to start over?</p>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-cancel" onClick={() => setShowStartOverConfirmation(false)}>
                Cancel
              </button>
              <button className="modal-btn modal-btn-confirm" onClick={() => {
                setShowStartOverConfirmation(false)
                onStartOver()
              }}>
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Toolbar