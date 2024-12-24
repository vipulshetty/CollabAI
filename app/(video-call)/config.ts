// This configuration ensures the video call route is completely isolated
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const runtime = 'edge'

// Disable all parent layouts
export const layoutConfig = {
  // Disable the root layout
  root: false,
  // Disable the dashboard layout
  dashboard: false
}
