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

describe('HomePage', () => {
  it('links the four corners to their pages', async () => {
    await renderHome();
    expect(screen.getByRole('link', { name: 'ОДЯГ' })).toHaveAttribute(
      'href',
      '/odyah',
    );
    expect(screen.getByRole('link', { name: 'МАНІФЕСТ' })).toHaveAttribute(
      'href',
      '/manifest',
    );
    expect(screen.getByRole('link', { name: 'ЕБАУТ' })).toHaveAttribute(
      'href',
      '/about',
    );
    expect(screen.getByRole('link', { name: 'ФОТОЖУРНАЛ' })).toHaveAttribute(
      'href',
      '/photojournal',
    );
  });

  it('shows the face in the centre', async () => {
    await renderHome();
    expect(screen.getByRole('img', { name: 'жека' })).toBeInTheDocument();
  });
});
