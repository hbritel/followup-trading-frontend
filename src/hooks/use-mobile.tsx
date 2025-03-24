
import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
  const [windowWidth, setWindowWidth] = React.useState<number | undefined>(
    typeof window !== 'undefined' ? window.innerWidth : undefined
  )

  React.useEffect(() => {
    // Initial check after a small delay to ensure accurate measurement
    const initialCheck = setTimeout(() => {
      if (typeof window !== 'undefined') {
        setWindowWidth(window.innerWidth)
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      }
    }, 50)
    
    // Debounced resize handler to prevent rapid changes during resizing
    let debounceTimer: NodeJS.Timeout | null = null
    
    const handleResize = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      
      debounceTimer = setTimeout(() => {
        if (typeof window !== 'undefined') {
          setWindowWidth(window.innerWidth)
          setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
        }
      }, 150)
    }
    
    // Add resize listener with debounce
    window.addEventListener('resize', handleResize)
    
    // Cleanup
    return () => {
      if (initialCheck) clearTimeout(initialCheck)
      if (debounceTimer) clearTimeout(debounceTimer)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return !!isMobile
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth
      setIsTablet(width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT)
    }
    
    // Check on initial render
    checkTablet()
    
    // Add debounced resize listener
    let debounceTimer: NodeJS.Timeout | null = null
    const handleResize = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      
      debounceTimer = setTimeout(() => {
        checkTablet()
      }, 150)
    }
    
    window.addEventListener('resize', handleResize)
    
    // Cleanup
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return !!isTablet
}

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= TABLET_BREAKPOINT)
    }
    
    // Check on initial render
    checkDesktop()
    
    // Add debounced resize listener
    let debounceTimer: NodeJS.Timeout | null = null
    const handleResize = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      
      debounceTimer = setTimeout(() => {
        checkDesktop()
      }, 150)
    }
    
    window.addEventListener('resize', handleResize)
    
    // Cleanup
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return !!isDesktop
}

export function useBreakpoint(breakpoint: number) {
  const [isLargerThan, setIsLargerThan] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkBreakpoint = () => {
      setIsLargerThan(window.innerWidth >= breakpoint)
    }
    
    // Check on initial render
    checkBreakpoint()
    
    // Add debounced resize listener
    let debounceTimer: NodeJS.Timeout | null = null
    const handleResize = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      
      debounceTimer = setTimeout(() => {
        checkBreakpoint()
      }, 150)
    }
    
    window.addEventListener('resize', handleResize)
    
    // Cleanup
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      window.removeEventListener('resize', handleResize)
    }
  }, [breakpoint])

  return !!isLargerThan
}
