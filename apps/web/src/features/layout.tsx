import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { MobileNav } from '@/features/nav';

type LayoutProps = {
  children: ReactNode;
};

export const Layout = ({ children }: LayoutProps) => (
  <div className="flex min-h-dvh flex-col bg-paper text-ink portrait:pb-24">
    <header className="border-ink/10 border-b px-6 py-4">
      <Link to="/" className="font-mono text-lg font-bold tracking-tight">
        sbjectv
      </Link>
    </header>
    <main className="flex-1 px-6 py-10">{children}</main>
    <footer className="border-ink/10 border-t px-6 py-4 text-ink/60 text-sm">
      © {new Date().getFullYear()} sbjectv
    </footer>
    <MobileNav />
  </div>
);
