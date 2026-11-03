import enrollmentService from './enrollment.service';
import tutorService from './tutor.service';
import { resolveAuthRedirect } from '../utils/authRedirect';

export function getPostAuthDestination(role, returnUrl) {
  return resolveAuthRedirect(role, returnUrl, {
    getEnrollments: (params) => enrollmentService.getMyEnrollments(params),
    getTutorApplication: () => tutorService.getMyTutorApplication(),
  });
}
