import React from 'react';
import { create } from 'apisauce';
import { render, screen } from '@testing-library/react';
import { ApiClientProvider } from '../../src';

const api = create({ baseURL: 'https://example.org' });

describe('ApiClientProvider', () => {
  it('renders without crashing', () => {
    render(<ApiClientProvider client={api}>
      <p>children</p>
    </ApiClientProvider>);

    expect(screen.getByText('children')).toBeInTheDocument();
  });
})
