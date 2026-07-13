'use client'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { forwardRef } from 'react'

interface NavLinkCompatProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  activeClassName?: string
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, href, children, ...props }, ref) => {
    const pathname = usePathname()
    const isActive = pathname === href || pathname.startsWith(href + '/')
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
