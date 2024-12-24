'use client'

export default function VideoCallTemplate({
  children,
}: {
  children: React.ReactNode
}) {
  return children; // Render children directly without any wrapper to avoid inheriting main layout
}
