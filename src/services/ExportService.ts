import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx'
import { RackConfig, RackComponent, SubComponent, NetworkInterface, NetworkAddress } from '../types/rack'

export class ExportService {
  /**
   * Export the rack display as a PNG image
   */
  static async exportToPNG(fileName?: string): Promise<void> {
    try {
      // Find the rack container element
      const rackContainer = document.querySelector('.racks-row')
      if (!rackContainer) {
        throw new Error('Rack display not found')
      }

      // Temporarily reset any zoom for the export
      const originalTransform = (rackContainer as HTMLElement).style.transform
      ;(rackContainer as HTMLElement).style.transform = 'scale(1)'

      // Capture the element as canvas
      const canvas = await html2canvas(rackContainer as HTMLElement, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        allowTaint: true
      })

      // Restore original transform
      ;(rackContainer as HTMLElement).style.transform = originalTransform

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = fileName || `rack-diagram-${Date.now()}.png`
          link.click()
          URL.revokeObjectURL(url)
        }
      })
    } catch (error) {
      console.error('Error exporting to PNG:', error)
      alert('Failed to export rack diagram as PNG. Please try again.')
    }
  }

  /**
   * Export rack configurations to Excel spreadsheet
   */
  static exportToSpreadsheet(racks: RackConfig[], fileName?: string): void {
    try {
      const workbook = XLSX.utils.book_new()

      // Create a sheet for each rack
      racks.forEach((rack) => {
        const sheetData: any[][] = []

        // Header row
        sheetData.push([
          'Component Name',
          'Type',
          'Height (U)',
          'Position',
          'Device Name',
          'Serial Number',
          'Model',
          'Manufacturer',
          'Power',
          'Tags',
          'Parent Component',
          'Sub-Position',
          'NIC Name',
          'MAC Address',
          'Link Speed',
          'Port Number',
          'VLAN',
          'IP Address',
          'Subnet',
          'Hostname',
          'Address Type',
          'Notes'
        ])

        // Process each component
        rack.components.forEach((component) => {
          // Add main component row
          const componentRow = this.createComponentRow(component)
          sheetData.push(componentRow)

          // Add network interfaces for the component
          if (component.networkInterfaces && component.networkInterfaces.length > 0) {
            component.networkInterfaces.forEach((nic) => {
              if (nic.addresses && nic.addresses.length > 0) {
                nic.addresses.forEach((addr) => {
                  sheetData.push(this.createNICRow(component.name, nic, addr))
                })
              } else {
                // NIC without addresses
                sheetData.push(this.createNICRow(component.name, nic))
              }
            })
          }

          // Add subcomponents
          if (component.subComponents && component.subComponents.length > 0) {
            component.subComponents.forEach((subComponent) => {
              // Add subcomponent row
              const subComponentRow = this.createSubComponentRow(component.name, subComponent)
              sheetData.push(subComponentRow)

              // Add network interfaces for the subcomponent
              if (subComponent.networkInterfaces && subComponent.networkInterfaces.length > 0) {
                subComponent.networkInterfaces.forEach((nic) => {
                  if (nic.addresses && nic.addresses.length > 0) {
                    nic.addresses.forEach((addr) => {
                      sheetData.push(this.createNICRow(subComponent.name, nic, addr, component.name))
                    })
                  } else {
                    // NIC without addresses
                    sheetData.push(this.createNICRow(subComponent.name, nic, undefined, component.name))
                  }
                })
              }
            })
          }
        })

        // Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData)

        // Set column widths
        worksheet['!cols'] = [
          { wch: 20 }, // Component Name
          { wch: 12 }, // Type
          { wch: 10 }, // Height
          { wch: 10 }, // Position
          { wch: 20 }, // Device Name
          { wch: 15 }, // Serial Number
          { wch: 15 }, // Model
          { wch: 15 }, // Manufacturer
          { wch: 10 }, // Power
          { wch: 30 }, // Tags
          { wch: 20 }, // Parent Component
          { wch: 12 }, // Sub-Position
          { wch: 15 }, // NIC Name
          { wch: 18 }, // MAC Address
          { wch: 12 }, // Link Speed
          { wch: 12 }, // Port Number
          { wch: 8 },  // VLAN
          { wch: 15 }, // IP Address
          { wch: 15 }, // Subnet
          { wch: 25 }, // Hostname
          { wch: 12 }, // Address Type
          { wch: 30 }, // Notes
        ]

        // Add worksheet to workbook with rack name as sheet name
        // Excel sheet names have a 31 character limit
        const sheetName = rack.name.substring(0, 31).replace(/[\\\/\[\]\*\?:]/g, '_')
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
      })

      // Generate Excel file and download
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName || `rack-inventory-${Date.now()}.xlsx`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting to spreadsheet:', error)
      alert('Failed to export rack configuration to spreadsheet. Please try again.')
    }
  }

  /**
   * Create a row for a main component
   */
  private static createComponentRow(component: RackComponent): any[] {
    return [
      component.name,                                              // Component Name
      component.type,                                              // Type
      component.height,                                            // Height
      component.position,                                          // Position
      component.metadata?.deviceName || '',                        // Device Name
      '',                                                          // Serial Number (empty for main components)
      '',                                                          // Model (empty for main components)
      '',                                                          // Manufacturer (empty for main components)
      component.metadata?.powerConsumption || '',                  // Power
      component.tags?.join(', ') || '',                           // Tags
      '',                                                          // Parent Component (empty for main components)
      '',                                                          // Sub-Position (empty for main components)
      '',                                                          // NIC Name
      '',                                                          // MAC Address
      '',                                                          // Link Speed
      '',                                                          // Port Number
      '',                                                          // VLAN
      '',                                                          // IP Address
      '',                                                          // Subnet
      '',                                                          // Hostname
      '',                                                          // Address Type
      component.metadata?.notes || ''                             // Notes
    ]
  }

  /**
   * Create a row for a subcomponent
   */
  private static createSubComponentRow(parentName: string, subComponent: SubComponent): any[] {
    return [
      subComponent.name,                                          // Component Name
      subComponent.type,                                          // Type
      '',                                                         // Height (subcomponents don't have height)
      '',                                                         // Position (use sub-position instead)
      subComponent.metadata?.deviceName || '',                    // Device Name
      subComponent.metadata?.serialNumber || '',                  // Serial Number
      subComponent.metadata?.model || '',                        // Model
      subComponent.metadata?.manufacturer || '',                  // Manufacturer
      subComponent.metadata?.powerConsumption || '',              // Power
      subComponent.tags?.join(', ') || '',                       // Tags
      parentName,                                                 // Parent Component
      subComponent.position || '',                               // Sub-Position
      '',                                                         // NIC Name
      '',                                                         // MAC Address
      '',                                                         // Link Speed
      '',                                                         // Port Number
      '',                                                         // VLAN
      '',                                                         // IP Address
      '',                                                         // Subnet
      '',                                                         // Hostname
      '',                                                         // Address Type
      subComponent.metadata?.notes || ''                         // Notes
    ]
  }

  /**
   * Create a row for a network interface
   */
  private static createNICRow(
    componentName: string,
    nic: NetworkInterface,
    address?: NetworkAddress,
    parentComponent?: string
  ): any[] {
    return [
      `  → ${componentName}`,                                    // Component Name (indented to show it's a NIC)
      'network',                                                 // Type
      '',                                                         // Height
      '',                                                         // Position
      '',                                                         // Device Name
      '',                                                         // Serial Number
      '',                                                         // Model
      '',                                                         // Manufacturer
      '',                                                         // Power
      '',                                                         // Tags
      parentComponent || '',                                     // Parent Component
      '',                                                         // Sub-Position
      nic.name,                                                  // NIC Name
      nic.macAddress || '',                                     // MAC Address
      nic.linkSpeed || '',                                      // Link Speed
      nic.portNumber || '',                                     // Port Number
      nic.vlan?.toString() || '',                              // VLAN
      address?.address || '',                                   // IP Address
      address?.subnet || '',                                    // Subnet
      address?.hostname || '',                                  // Hostname
      address?.type || '',                                      // Address Type
      address?.notes || nic.notes || ''                        // Notes
    ]
  }
}