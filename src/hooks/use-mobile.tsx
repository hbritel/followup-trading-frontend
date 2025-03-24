
import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Check on initial render
    checkMobile()
    
    // Add resize listener
    window.addEventListener('resize', checkMobile)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile)
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
    
    // Add resize listener
    window.addEventListener('resize', checkTablet)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkTablet)
  }, [])

  return !!isTablet
}

export function useBreakpoint(breakpoint: number) {
  const [isLargerThan, setIsLargerThan] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkBreakpoint = () => {
      setIsLargerThan(window.innerWidth >= breakpoint)
    }
    
    // Check on initial render
    checkBreakpoint()
    
    // Add resize listener
    window.addEventListener('resize', checkBreakpoint)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkBreakpoint)
  }, [breakpoint])

  return !!isLargerThan
}
