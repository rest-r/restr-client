import MockAdapter from 'axios-mock-adapter';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event'
import { ApiClientProvider, useLazyRequest, useRequest } from '../../src';
import { create } from 'apisauce';

const api = create({ baseURL: 'https://example.org' });
const axiosMock = new MockAdapter(api.axiosInstance, { delayResponse: 50 });

const MockApp: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <ApiClientProvider client={api}>
    {children}
  </ApiClientProvider>
};

axiosMock.onGet('/lazy-request').reply(200, { ret: 'bread' });
const LazyRequest: React.FC = () => {
  const { result, refetch } = useLazyRequest<any>({ method: 'get', path: '/lazy-request' });

  return <div>
    <button onClick={() => refetch()}>Perform request</button>
    <p>{result.loading ? 'loading' : 'not loading'}</p>
    <p>{result.data?.ret || 'not called'}</p>
  </div>;
};

axiosMock.onGet('/request').reply(200, { ret: 'butter' });
const Request: React.FC = () => {
  const { data, loading } = useRequest<any>({ method: 'get', path: '/request' });

  return <div>
    <p>{loading ? 'loading' : 'not loading'}</p>
    <p>{data?.ret}</p>
  </div>;
};

describe('Request', () => {
  test('useLazyRequest', async () => {
    render(<MockApp><LazyRequest /></MockApp>);

    expect(screen.getByText('not called')).toBeInTheDocument();
    expect(screen.getByText('not loading')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Perform request'));
    expect(screen.getByText('loading')).toBeInTheDocument();

    expect(await screen.findByText('bread')).toBeInTheDocument();
    expect(screen.getByText('not loading')).toBeInTheDocument();
  });

  test('useRequest', async () => {
    render(<MockApp><Request/></MockApp>);

    expect(screen.getByText('loading')).toBeInTheDocument();
    expect(await screen.findByText('butter')).toBeInTheDocument();
    expect(screen.getByText('not loading')).toBeInTheDocument();
  });
});
