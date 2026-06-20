import Link from 'next/link'
import { forwardRef } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavLinkCompatProps {
  href: string
  className?: string
  activeClassName?: string
  children?: React.ReactNode
  [key: string]: unknown
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, href, children, ...props }, ref) => {
    const pathname = usePathname()
    const isActive = href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname === href || pathname.startsWith(href + '/')
    const isPending = false // Next.js doesn't have pending state like React Router

    return (
      <Link
        ref={ref}
        href={href}
        className={cn(className, isActive && activeClassName)}
        {...props}
      >
        {children}
      </Link>
    )
  },
)

NavLink.displayName = 'NavLink'

export { NavLink }