import { type } from 'arktype';

import { ValidationMessage } from '~/types/response';
import { send } from '~/utils/response';

import type { Type } from 'arktype';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Guard } from '~/types/middleware';

export interface ValidationSchema {
  readonly body?: Type;
  readonly params?: Type;
  readonly querystring?: Type;
}

export function validate(schema: ValidationSchema): Guard {
  return (request: FastifyRequest, reply: FastifyReply): FastifyRequest | undefined => {
    if (schema.body) {
      const result = schema.body(request.body);
      if (result instanceof type.errors) {
        send(reply).badRequest(ValidationMessage.VALIDATION_ERROR, result.summary);
        return undefined;
      }
      Object.assign(request, { body: result });
    }
    if (schema.params) {
      const result = schema.params(request.params);
      if (result instanceof type.errors) {
        send(reply).badRequest(ValidationMessage.VALIDATION_ERROR, result.summary);
        return undefined;
      }
      Object.assign(request, { params: result });
    }
    if (schema.querystring) {
      const result = schema.querystring(request.query);
      if (result instanceof type.errors) {
        send(reply).badRequest(ValidationMessage.VALIDATION_ERROR, result.summary);
        return undefined;
      }
      Object.assign(request, { query: result });
    }
    return request;
  };
}
