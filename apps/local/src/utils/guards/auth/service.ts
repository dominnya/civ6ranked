import { config } from '~/config';
import { AuthMessage } from '~/types/response';
import { send } from '~/utils/response';

import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ServiceAuthAugmentation } from '~/types/auth';
import type { Guard } from '~/types/middleware';

/** Extracts a Bearer token from the Authorization header. */
function extractBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  return match ? match[1] : null;
}

export const serviceAuth: Guard<ServiceAuthAugmentation> = (
  request: FastifyRequest,
  reply: FastifyReply
): (FastifyRequest & ServiceAuthAugmentation) | undefined => {
  const token = extractBearerToken(request.headers.authorization as string | undefined);
  if (!token) {
    send(reply).unauthorized(AuthMessage.MISSING_SERVICE_TOKEN);
    return undefined;
  }
  if (token !== config.serviceToken) {
    send(reply).unauthorized(AuthMessage.INVALID_SERVICE_TOKEN);
    return undefined;
  }
  return Object.assign(request, { serviceAuthorized: true } as ServiceAuthAugmentation);
};
