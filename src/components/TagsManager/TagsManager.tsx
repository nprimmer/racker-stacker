import React, { useState } from 'react'
import './TagsManager.css'

interface TagsManagerProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

export default function TagsManager({
  tags,
  onChange,
  placeholder = 'Type a tag and press Enter...'
}: TagsManagerProps) {
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])

  // Common tag suggestions for datacenter equipment
  const commonTags = [
    'production', 'staging', 'development', 'test',
    'critical', 'non-critical', 'redundant',
    'primary', 'secondary', 'backup',
    'managed', 'unmanaged',
    'dmz', 'internal', 'external',
    'web', 'database', 'application',
    'virtualization', 'storage', 'networking',
    'monitoring', 'security',
    'active', 'passive', 'maintenance',
    'legacy', 'migration-pending',
    'customer-facing', 'internal-only'
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    // Show suggestions based on input
    if (value.trim()) {
      const filtered = commonTags.filter(
        tag => tag.toLowerCase().includes(value.toLowerCase()) &&
               !tags.includes(tag)
      )
      setSuggestions(filtered.slice(0, 5))
    } else {
      setSuggestions([])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      addTag(inputValue.trim())
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Remove last tag when backspace is pressed with empty input
      removeTag(tags[tags.length - 1])
    }
  }

  const addTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().replace(/\s+/g, '-')
    if (!tags.includes(normalizedTag)) {
      onChange([...tags, normalizedTag])
    }
    setInputValue('')
    setSuggestions([])
  }

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion)
  }

  return (
    <div className="tags-manager">
      <div className="tags-input-container">
        <input
          type="text"
          className="tag-input-field"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
      </div>

      {tags.length > 0 && (
        <div className="tags-display">
          {tags.map(tag => (
            <span key={tag} className="tag">
              {tag}
              <button
                className="tag-remove"
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag} tag`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="tag-suggestions">
          {suggestions.map(suggestion => (
            <button
              key={suggestion}
              className="tag-suggestion"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {tags.length === 0 && inputValue === '' && (
        <div className="tags-hint">
          Common tags: production, staging, critical, primary, backup, etc.
        </div>
      )}
    </div>
  )
}