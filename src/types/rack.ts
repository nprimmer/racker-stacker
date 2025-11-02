export type ComponentType = 'compute' | 'network' | 'storage' | 'power' | 'cooling' | 'other'

export interface RackComponent {
  id: string
  name: string
  height: number // in rack units (U)
  position: number // starting rack unit from bottom (1-based)
  type: ComponentType
  color?: string
  metadata?: {
    deviceName?: string
    ipAddress?: string
    subnet?: string
    notes?: string
    [key: string]: string | undefined
  }
}

export interface RackConfig {
  id: string
  name: string
  height: number // total rack units (e.g., 42U)
  components: RackComponent[]
}

export interface Position {
  x: number
  y: number
}

export const COMPONENT_COLORS: Record<ComponentType, string> = {
  compute: '#3B82F6', // blue
  network: '#10B981', // green
  storage: '#F59E0B', // amber
  power: '#EF4444', // red
  cooling: '#06B6D4', // cyan
  other: '#6B7280', // gray
}

export const RACK_UNIT_HEIGHT = 44.45 // 1U = 1.75 inches = 44.45mm (for display purposes we'll use pixels)