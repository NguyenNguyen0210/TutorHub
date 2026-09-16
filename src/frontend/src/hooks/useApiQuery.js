import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * P4: Hook wrapping TanStack Query for unified data fetching.
 * Automatically respects network retry policies and preserves structured ApiError.
 */
export function useApiQuery(queryKey, queryFn, options = {}) {
  return useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn,
    retry: (failureCount, error) => {
      // Don't retry 4xx errors (client errors)
      if (error?.status >= 400 && error?.status < 500) return false;
      return failureCount < (options.retryCount ?? 2);
    },
    ...options,
  });
}

export function useApiMutation(mutationFn, options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    ...options,
    onSuccess: (data, variables, context) => {
      if (options.invalidateKeys) {
        options.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
        });
      }
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
  });
}

export default useApiQuery;
