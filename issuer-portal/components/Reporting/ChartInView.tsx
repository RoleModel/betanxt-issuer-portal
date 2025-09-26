'use client'

import React from 'react'

interface ChartInViewProps {
  children: (visible: boolean) => React.ReactNode
  rootMargin?: string
  minHeight?: number | string
}

export default function ChartInView({
  children,
  rootMargin = '0px 0px -100px 0px',
}: ChartInViewProps) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    if (!ref.current || visible) return
    const el = ref.current
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.disconnect()
          }
        })
      },
      { root: null, rootMargin, threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [rootMargin, visible])

  return <div ref={ref}>{children(visible)}</div>
}
