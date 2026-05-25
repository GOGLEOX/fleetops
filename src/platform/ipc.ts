export interface DesktopRuntimeInfo {
  version: string
}

export function getDesktopRuntimeInfo(): DesktopRuntimeInfo | null {
  if (!window.fleetops) {
    return null
  }

  return {
    version: window.fleetops.version,
  }
}
