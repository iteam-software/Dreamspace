'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Main navigation component
 * Displays primary navigation links
 */
export function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dream-book', label: 'Dream Book' },
    { href: '/dream-connect', label: 'Dream Connect' },
    { href: '/scorecard', label: 'Scorecard' },
    { href: '/dream-team', label: 'Dream Team' },
    { href: '/people', label: 'People' },
    { href: '/build-overview', label: 'Build Overview' },
    { href: '/health', label: 'Health' },
  ];

  return (
    <nav>
      <ul>
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <li key={link.href}>
              <Link href={link.href} aria-current={isActive ? 'page' : undefined}>
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
