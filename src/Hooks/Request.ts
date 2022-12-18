import { useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react';
import { ApiClientContext } from '../Containers';

export type Method = 'get' | 'delete' | 'head' | 'post' | 'put' | 'patch' | 'link' | 'unlink';

export interface QueryParams<T> {
  method: Method;
  path: string;
  body?: any;
  headers?: object;
  lazy?: boolean;
  afterFetch?: (result: QueryResult<T>) => void;
}

export interface QueryResult<T> {
  data: T | undefined;
  loading: boolean;
  error: string | undefined;
}

export const isObj = (o: any): o is object => o !== null && typeof o === 'object';
export const deepEquals = (obj1: any, obj2: any): boolean => {
  if (!isObj(obj1) || !isObj(obj2)) {
    return obj1 === obj2;
  }

  if (Object.keys(obj1).length !== Object.keys(obj2).length) {
    return false;
  }

  return Object.entries(obj1)
    .every(([key, value]) => {
      const oValue = (obj2 as any)[key];
      if (oValue === undefined) {
        return value === undefined;
      }

      if (isObj(value) && isObj(oValue)) {
        return deepEquals(value, oValue);
      }

      return value === oValue;
    });
};

const useDeepEqMemo = <TKey, TVal>(fn: () => TVal, key: TKey) => {
  const ref = useRef<{ key: TKey, value: TVal }>();

  if (!ref.current || !deepEquals(key, ref.current.key)) {
    ref.current = { key, value: fn() };
  }

  return ref.current.value;
};

export interface LazyResponse<T> {
  result: QueryResult<T>;
  refetch: (newParameters?: Partial<QueryParams<T>>) => void;
}

export const useLazyRequest = <TResult>(
  parameters: QueryParams<TResult>,
): LazyResponse<TResult> => {
  const { client } = useContext(ApiClientContext);

  const [params, setParams] = useState(parameters);
  const [executeCount, forceUpdate] = useReducer((x) => x + 1, 0);
  const [qResult, setQResult] = useState<QueryResult<TResult>>({
    data: undefined,
    loading: !(parameters.lazy === undefined ? true : parameters.lazy),
    error: undefined,
  });

  const refetch = useCallback((newParams?: Partial<QueryParams<TResult>>) => {
    if (newParams !== undefined) {
      setParams({ ...params, ...newParams });
    }
    forceUpdate();
  }, [params, forceUpdate]);

  useDeepEqMemo(async () => {
    const queryResult: QueryResult<TResult> = { ...qResult };
    if (executeCount === 0) {
      return queryResult;
    }

    if (client === null) {
      console.error('No HTTP client found in context. Perhaps you forgot to create an "ApiClientProvider" higher up in your component tree?');
      return queryResult;
    }

    queryResult.loading = true;
    setQResult({ ...queryResult });

    const { method, path, body, headers } = params;
    client[method]<TResult>(path, body || {}, { headers })
      .then((res) => {
        queryResult.loading = false;
        if (res.ok && res.data) {
          queryResult.data = res.data;
          queryResult.error = undefined;
        } else {
          queryResult.error = res.problem || 'UNKNOWN_ERROR';
        }
        setQResult({ ...queryResult });
        return queryResult;
      })
      .then((res) => {
        if (params.afterFetch !== undefined) {
          params.afterFetch(res);
        }
      });

    return queryResult;
  }, { params, executeCount });

  return { refetch, result: qResult };
};

export interface Response<ResultType> extends QueryResult<ResultType> {
  refetch: (newParameters?: Partial<QueryParams<ResultType>>) => void
}

export const useRequest = <T>(parameters: QueryParams<T>): Response<T> => {
  if (parameters.lazy) {
    console.warn('Do not set "lazy" yourself, if you need a lazy request, use "useLazyRequest" instead!');
  }
  const { refetch, result } = useLazyRequest<T>({ ...parameters, lazy: false });

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { ...result, refetch };
};
