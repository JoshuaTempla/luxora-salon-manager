// Generic hook for API calls with loading and error states

import { useState, useCallback } from 'react';
import { ApiResponse } from '@/types';

export function useApi<T>() {
  const [state, setState] = useState<ApiResponse<T>>({
    data: null,
    error: null,
    loading: false,
  });

  const execute = useCallback(
    async (apiCall: () => Promise<T>): Promise<T | null> => {
      setState({ data: null, error: null, loading: true });

      try {
        const data = await apiCall();
        setState({ data, error: null, loading: false });
        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        setState({ data: null, error: errorMessage, loading: false });
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ data: null, error: null, loading: false });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}