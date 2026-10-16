import type { ReactNode } from 'react';

type LayoutProps = {
  children: ReactNode;
};

export const Layout = ({ children }: LayoutProps) => (
  <div className="min-h-dvh flex flex-col">
    <header className="border-b border-ink/10 px-6 py-4">
      <a href="/" className="font-mono text-lg font-bold tracking-tight">
        sbjectv.shop
      </a>
    </header>
    <main className="flex-1 px-6 py-10">{children}</main>
    <footer className="border-t border-ink/10 px-6 py-4 text-sm text-ink/60">
      © {new Date().getFullYear()} sbjectv
    </footer>
  </div>
);
