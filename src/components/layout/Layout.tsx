import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Nav } from './Nav';
import { Footer } from './Footer';

const titles: Record<string, string> = {
  '/': 'Powering Smarter Communities',
  '/how-it-works': 'How It Works',
  '/dashboard': 'Live Energy Dashboard',
  '/optimisation': 'Intelligent Optimisation',
  '/impact': 'Environmental & Economic Impact',
  '/about': 'About GridMind',
};

function ScrollManager() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const target = document.getElementById(location.hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname, location.hash]);

  return null;
}

function PageTitle() {
  const location = useLocation();

  useEffect(() => {
    const title = titles[location.pathname] ?? 'GridMind';
    document.title = `${title} — GridMind`;
  }, [location.pathname]);

  return null;
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <ScrollManager />
      <PageTitle />
      <Nav />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
