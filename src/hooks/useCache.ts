import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface UseCacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean; // Return stale data while fetching new data
}

export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCacheOptions = {}
) {
  const { ttl = 5 * 60 * 1000, staleWhileRevalidate = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cacheRef = useRef(new Map<string, CacheEntry<T>>());
  const activeRequestsRef = useRef(new Map<string, Promise<T>>());

  const isExpired = useCallback((entry: CacheEntry<T>) => {
    return Date.now() > entry.expiry;
  }, []);

  const getCachedData = useCallback((cacheKey: string): T | null => {
    const entry = cacheRef.current.get(cacheKey);
    if (!entry) return null;
    
    if (isExpired(entry)) {
      cacheRef.current.delete(cacheKey);
      return null;
    }
    
    return entry.data;
  }, [isExpired]);

  const setCachedData = useCallback((cacheKey: string, newData: T) => {
    const entry: CacheEntry<T> = {
      data: newData,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    };
    cacheRef.current.set(cacheKey, entry);
  }, [ttl]);

  const fetchData = useCallback(async (cacheKey: string, shouldUpdateLoading = true) => {
    const activeRequest = activeRequestsRef.current.get(cacheKey);
    if (activeRequest) {
      return activeRequest;
    }

    if (shouldUpdateLoading) {
      setIsLoading(true);
    }
    setError(null);

    const fetchPromise = fetcher()
      .then((result) => {
        setCachedData(cacheKey, result);
        setData(result);
        return result;
      })
      .catch((err) => {
        setError(err);
        throw err;
      })
      .finally(() => {
        if (shouldUpdateLoading) {
          setIsLoading(false);
        }
        activeRequestsRef.current.delete(cacheKey);
      });

    activeRequestsRef.current.set(cacheKey, fetchPromise);
    return fetchPromise;
  }, [fetcher, setCachedData]);

  const mutate = useCallback(async (newData?: T | ((current: T | null) => T)) => {
    if (typeof newData === 'function') {
      const currentData = getCachedData(key);
      const updatedData = (newData as (current: T | null) => T)(currentData);
      setCachedData(key, updatedData);
      setData(updatedData);
    } else if (newData !== undefined) {
      setCachedData(key, newData);
      setData(newData);
    } else {
      await fetchData(key);
    }
  }, [key, getCachedData, setCachedData, fetchData]);

  const invalidate = useCallback(() => {
    cacheRef.current.delete(key);
    setData(null);
    setError(null);
  }, [key]);

  useEffect(() => {
    const cachedData = getCachedData(key);
    
    if (cachedData) {
      setData(cachedData);
      
      const entry = cacheRef.current.get(key);
      if (entry && staleWhileRevalidate) {
        const isStale = Date.now() > (entry.timestamp + ttl * 0.8);
        if (isStale) {
          fetchData(key, false);
        }
      }
    } else {
      fetchData(key);
    }
  }, [key, getCachedData, fetchData, ttl, staleWhileRevalidate]);

  useEffect(() => {
    return () => {
      activeRequestsRef.current.delete(key);
    };
  }, [key]);

  return {
    data,
    isLoading,
    error,
    mutate,
    invalidate,
    refetch: () => fetchData(key)
  };
}

export const clearAllCache = () => {
};