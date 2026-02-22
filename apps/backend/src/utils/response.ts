import type { FastifyReply } from 'fastify';
import type { ApiResponseMessage } from '~/types/response';

export interface ApiResponse {
  readonly message: ApiResponseMessage;
  readonly detail?: string;
}

export type ApiResponseWith<T extends Record<string, unknown>> = ApiResponse & T;

export interface ResponseBuilder {
  readonly ok: <T extends Record<string, unknown>>(message: ApiResponseMessage, data?: T) => void;
  readonly badRequest: (message: ApiResponseMessage, detail?: string) => void;
  readonly unauthorized: (message: ApiResponseMessage, detail?: string) => void;
  readonly notFound: (message: ApiResponseMessage, detail?: string) => void;
  readonly status: <T extends Record<string, unknown>>(statusCode: number, message: ApiResponseMessage, data?: T) => void;
}

export function send(reply: FastifyReply): ResponseBuilder {
  const sendWithStatus = <T extends Record<string, unknown>>(statusCode: number, message: ApiResponseMessage, data?: T): void => {
    reply.status(statusCode).send({ message, ...data });
  };
  const sendError = (statusCode: number, message: ApiResponseMessage, detail?: string): void => {
    sendWithStatus(statusCode, message, detail ? { detail } : undefined);
  };
  return {
    ok: (message, data) => sendWithStatus(200, message, data),
    badRequest: (message, detail) => sendError(400, message, detail),
    unauthorized: (message, detail) => sendError(401, message, detail),
    notFound: (message, detail) => sendError(404, message, detail),
    status: sendWithStatus,
  };
}
