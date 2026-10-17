import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { routeTree } from '@/routes/route-tree';

const renderHome = async () => {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  render(<RouterProvider router={router} />);
  await screen.findByRole('heading', { level: 1 });
};

const PAGES = [
  ['ОДЯГ', '/odyah'],
  ['МАНІФЕСТ', '/manifest'],
  ['ЕБАУТ', '/about'],
  ['ФОТО', '/photojournal'],
] as const;

describe('HomePage', () => {
  it('links every section from the corners and the mobile nav', async () => {
    await renderHome();
    for (const [label, href] of PAGES) {
      const links = screen.getAllByRole('link', { name: label });
      expect(links).toHaveLength(2);
      for (const link of links) expect(link).toHaveAttribute('href', href);
    }
  });

  it('shows the face in the centre', async () => {
    await renderHome();
    expect(screen.getByRole('img', { name: 'жека' })).toBeInTheDocument();
  });
});
