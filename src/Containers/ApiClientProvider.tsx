import React, { createContext, useEffect, useState } from 'react';
import { ApisauceInstance } from 'apisauce';

export interface IApiClientContext {
  client: ApisauceInstance | null;
}

export const ApiClientContext = createContext<IApiClientContext>({ client: null });

export interface IApiClientProviderProps extends React.PropsWithChildren {
  client: ApisauceInstance;
}

export const ApiClientProvider: React.FC<IApiClientProviderProps> = ({ children, client }) => {
  const [providerValue, setProviderValue] = useState<IApiClientContext>({ client });

  useEffect(() => {
    setProviderValue({ client });
  }, [client]);

  return <ApiClientContext.Provider value={providerValue}>
    {children}
  </ApiClientContext.Provider>;
};

export default ApiClientProvider;
