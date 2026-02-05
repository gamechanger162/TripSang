'use client';

import Link from 'next/link';

interface NavLinksProps {
    links: { name: string; href: string }[];
    linkColor: string;
}

export default function NavLinks({ links, linkColor }: NavLinksProps) {
    return (
        <>
            {links.map((link) => (
                <Link
                    key={link.name}
                    href={link.href}
                    className={`text-sm font-medium transition-colors ${linkColor}`}
                >
                    {link.name}
                </Link>
            ))}
        </>
    );
}
