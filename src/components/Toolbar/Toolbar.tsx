import { useRef, useState } from 'react'
import { RackConfig } from '../../types/rack'
import Modal from '../Modal/Modal'
import './Toolbar.css'

interface ToolbarProps {
  onSave: () => void
  onLoad: (data: RackConfig[] | RackConfig) => void
  onAddRack: (height: number, name: string) => void
  onStartOver: () => void
  hasRacks: boolean
}

const Toolbar: React.FC<ToolbarProps> = ({ onSave, onLoad, onAddRack, onStartOver, hasRacks }) => {
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