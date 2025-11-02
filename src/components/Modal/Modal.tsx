import React, { useState } from 'react'
import './Modal.css'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (height: number, name: string) => void
  title: string
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onConfirm, title }) => {
  const [nameValue, setNameValue] = useState<string>('')
  const [heightValue, setHeightValue] = useState<string>('42')
  const [error, setError] = useState<string>('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate name
    if (!nameValue.trim()) {
      setError('Please enter a rack name')
      return
    }

    // Normalize height input - remove 'u' or 'U' suffix if present
    const normalizedValue = heightValue.trim().toLowerCase().replace(/u$/, '')
    const height = parseInt(normalizedValue)

    // Validation
    if (isNaN(height)) {
      setError('Please enter a valid height')
      return
    }

    if (height < 1) {
      setError('Rack height must be at least 1U')
      return
    }

    if (height > 100) {
      setError('Rack height cannot exceed 100U')
      return
    }

    onConfirm(height, nameValue.trim())
    setNameValue('')
    setHeightValue('42')
    setError('')
    onClose()
  }

  const handleCancel = () => {
    setNameValue('')
    setHeightValue('42')
    setError('')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <form onSubmit={handleSubmit}>
          <div className="modal-form-group">
            <label htmlFor="rack-name">Rack Name:</label>
            <input
              id="rack-name"
              type="text"
              value={nameValue}
              onChange={(e) => {
                setNameValue(e.target.value)
                setError('')
              }}
              placeholder="e.g., Main Rack"
              autoFocus
            />
          </div>
          <div className="modal-form-group">
            <label htmlFor="rack-height">Rack Height:</label>
            <input
              id="rack-height"
              type="text"
              value={heightValue}
              onChange={(e) => {
                setHeightValue(e.target.value)
                setError('')
              }}
              placeholder="e.g., 42 or 42u"
            />
            <span className="modal-hint">Enter a value between 1-100 (e.g., 42 or 42u)</span>
          </div>
          {error && <div className="modal-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="modal-btn modal-btn-cancel" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="modal-btn modal-btn-confirm">
              Create Rack
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Modal