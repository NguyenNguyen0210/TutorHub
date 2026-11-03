import { useQuery } from '@tanstack/react-query';
import tutorService from '@/services/tutor.service';

export const tutorApplicationKey = userId => ['tutor-application', userId];

/** Share the confirmed status between the account menu and the application page. */
export function useTutorApplication(userId, enabled) {
  return useQuery({
    queryKey: tutorApplicationKey(userId),
    queryFn: () => tutorService.getMyTutorApplication(),
    enabled: Boolean(userId && enabled),
    staleTime: 60000,
    retry: false,
    refetchOnWindowFocus: true,
    refetchInterval: enabled ? 60000 : false,
  });
}
