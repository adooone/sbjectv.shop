import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { HomePage } from './home-page';

const renderPage = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <HomePage />
    </QueryClientProvider>,
  );
};

describe('HomePage', () => {
  it('renders the heading', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    );
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Hello, sbjectv.',
    );
    expect(screen.getByTestId('api-status')).toHaveTextContent('checking');
  });
});
