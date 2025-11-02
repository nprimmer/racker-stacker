export type ComponentType = 'compute' | 'network' | 'storage' | 'power' | 'cooling' | 'patch_panel' | 'other'

export type LinkSpeed = '10M' | '100M' | '1000M' | '2.5G' | '10G' | '25G' | '40G' | '100G'

export type FrontBackPlacement = 'front' | 'back'
export type SidePlacement = 'left' | 'right' | 'center'
export type Placement = FrontBackPlacement | SidePlacement

export type DistanceUnit = 'U' | 'cm' | 'inches'

export interface PDUConfig {
  count: number
  frontBack: FrontBackPlacement
  side: SidePlacement
}

export interface EthernetConfig {
  frontCount: number
  backCount: number
}

export interface NetworkAddress {
  id: string
  address: string // IP address (IPv4 or IPv6)
  subnet?: string
  hostname?: string
  type?: 'primary' | 'secondary' | 'virtual' | 'management' | 'other'
  notes?: string
}

export interface NetworkInterface {
  id: string
  name: string // e.g., "eth0", "eno1", "Management Port", etc.
  macAddress?: string
  linkSpeed?: LinkSpeed
  addresses: NetworkAddress[] // Multiple addresses per interface
  vlan?: number
  portNumber?: string // Physical port number on device
  connectedTo?: string // ID of another component/interface this connects to
  notes?: string
}

export interface SubComponent {
  id: string
  name: string
  type: ComponentType
  parentComponentId: string
  position?: string // Position within the parent component (e.g., "left", "right", "slot-1", etc.)
  networkInterfaces: NetworkInterface[]
  tags: string[] // Freeform taxonomy
  pduConfig?: PDUConfig
  ethernetConfig?: EthernetConfig
  weight?: number // Weight in pounds or kg
  metadata?: {
    deviceName?: string
    serialNumber?: string
    model?: string
    manufacturer?: string
    powerConsumption?: string
    notes?: string
    [key: string]: string | undefined
  }
}

export interface RackComponent {
  id: string
  name: string
  height: number // in rack units (U)
  position: number // starting rack unit from bottom (1-based)
  type: ComponentType
  color?: string
  subComponents?: SubComponent[] // Optional array of subcomponents
  networkInterfaces: NetworkInterface[] // Array of network interfaces
  tags: string[] // Freeform taxonomy/categorization
  pduConfig?: PDUConfig
  ethernetConfig?: EthernetConfig
  weight?: number // Weight in pounds or kg
  metadata?: {
    deviceName?: string
    powerConsumption?: string
    ipAddress?: string // Kept for backward compatibility
    subnet?: string // Kept for backward compatibility
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
  patch_panel: '#8B5CF6', // purple
  other: '#6B7280', // gray
}

export const RACK_UNIT_HEIGHT = 44.45 // 1U = 1.75 inches = 44.45mm (for display purposes we'll use pixels)

export const LINK_SPEEDS: { value: LinkSpeed; label: string }[] = [
  { value: '10M', label: '10 Mbps' },
  { value: '100M', label: '100 Mbps' },
  { value: '1000M', label: '1 Gbps' },
  { value: '2.5G', label: '2.5 Gbps' },
  { value: '10G', label: '10 Gbps' },
  { value: '25G', label: '25 Gbps' },
  { value: '40G', label: '40 Gbps' },
  { value: '100G', label: '100 Gbps' },
]

export const ADDRESS_TYPES = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'management', label: 'Management' },
  { value: 'other', label: 'Other' },
]

export const FRONT_BACK_OPTIONS: { value: FrontBackPlacement; label: string }[] = [
  { value: 'front', label: 'Front' },
  { value: 'back', label: 'Back' },
]

export const SIDE_OPTIONS: { value: SidePlacement; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'center', label: 'Center' },
]

export const DISTANCE_UNITS: { value: DistanceUnit; label: string }[] = [
  { value: 'U', label: 'Rack Units (U)' },
  { value: 'cm', label: 'Centimeters' },
  { value: 'inches', label: 'Inches' },
]

// Conversion constants
export const RACK_UNIT_TO_CM = 4.445 // 1U = 4.445 cm
export const RACK_UNIT_TO_INCHES = 1.75 // 1U = 1.75 inches