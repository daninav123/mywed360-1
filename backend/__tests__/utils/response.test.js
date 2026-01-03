/**
 * Tests unitarios para backend/utils/response.js
 * Valida que las utilidades de respuesta sigan el formato estándar
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendInternalError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendRateLimit,
  sendServiceUnavailable,
  sendPaginated,
} from '../../utils/response.js';

describe('Response Utilities', () => {
  let mockRes;
  let mockReq;

  beforeEach(() => {
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockReq = {
      id: 'test-request-id-123',
    };
  });

  describe('sendSuccess', () => {
    it('should send success response with default status 200', () => {
      const data = { userId: '123', name: 'Test User' };
      sendSuccess(mockRes, data);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data,
      });
    });

    it('should send success response with custom status', () => {
      const data = { id: 'new-item' };
      sendSuccess(mockRes, data, 201);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data,
      });
    });

    it('should handle null data', () => {
      sendSuccess(mockRes, null);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: null,
      });
    });

    it('should handle empty object', () => {
      sendSuccess(mockRes, {});

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {},
      });
    });
  });

  describe('sendError', () => {
    it('should send error response with default status 400', () => {
      sendError(mockRes, 'validation_error', 'Invalid input', 400, mockReq);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'validation_error',
          message: 'Invalid input',
        },
        requestId: 'test-request-id-123',
      });
    });

    it('should send error response with custom status', () => {
      sendError(mockRes, 'not_found', 'Resource not found', 404, mockReq);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'not_found',
          message: 'Resource not found',
        },
        requestId: 'test-request-id-123',
      });
    });

    it('should work without requestId when req is null', () => {
      sendError(mockRes, 'error_code', 'Error message', 500, null);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'error_code',
          message: 'Error message',
        },
      });
    });

    it('should work without requestId when req.id is undefined', () => {
      const reqWithoutId = {};
      sendError(mockRes, 'error_code', 'Error message', 500, reqWithoutId);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'error_code',
          message: 'Error message',
        },
      });
    });
  });

  describe('sendValidationError', () => {
    it('should send validation error without details', () => {
      sendValidationError(mockRes, 'Email is required', null, mockReq);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'validation_error',
          message: 'Email is required',
        },
        requestId: 'test-request-id-123',
      });
    });

    it('should send validation error with details', () => {
      const details = 'Field must be between 5 and 100 characters';
      sendValidationError(mockRes, 'Invalid input', details, mockReq);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'validation_error',
          message: 'Invalid input',
          details,
        },
        requestId: 'test-request-id-123',
      });
    });
  });

  describe('sendInternalError', () => {
    it('should send internal error in production without details', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Database connection failed');
      sendInternalError(mockRes, error, mockReq);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'internal_error',
          message: 'Internal server error',
        },
        requestId: 'test-request-id-123',
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should send internal error in development with details', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Database connection failed');
      sendInternalError(mockRes, error, mockReq);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'internal_error',
          message: 'Database connection failed',
        },
        requestId: 'test-request-id-123',
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle error without message', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      sendInternalError(mockRes, {}, mockReq);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'internal_error',
          message: 'Internal server error',
        },
        requestId: 'test-request-id-123',
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('sendNotFound', () => {
    it('should send 404 with default message', () => {
      sendNotFound(mockRes, undefined, mockReq);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'not_found',
          message: 'Not found',
        },
        requestId: 'test-request-id-123',
      });
    });

    it('should send 404 with custom message', () => {
      sendNotFound(mockRes, 'User not found', mockReq);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'not_found',
          message: 'User not found',
        },
        requestId: 'test-request-id-123',
      });
    });
  });

  describe('sendUnauthorized', () => {
    it('should send 401 with default message', () => {
      sendUnauthorized(mockRes, undefined, mockReq);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'unauthorized',
          message: 'Unauthorized',
        },
        requestId: 'test-request-id-123',
      });
    });

    it('should send 401 with custom message', () => {
      sendUnauthorized(mockRes, 'Invalid token', mockReq);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'unauthorized',
          message: 'Invalid token',
        },
        requestId: 'test-request-id-123',
      });
    });
  });

  describe('sendForbidden', () => {
    it('should send 403 with default message', () => {
      sendForbidden(mockRes, undefined, mockReq);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'forbidden',
          message: 'Forbidden',
        },
        requestId: 'test-request-id-123',
      });
    });

    it('should send 403 with custom message', () => {
      sendForbidden(mockRes, 'Insufficient permissions', mockReq);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'forbidden',
          message: 'Insufficient permissions',
        },
        requestId: 'test-request-id-123',
      });
    });
  });

  describe('sendRateLimit', () => {
    it('should send 429 with default message', () => {
      sendRateLimit(mockRes, undefined, mockReq);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'rate_limit',
          message: 'Too many requests',
        },
        requestId: 'test-request-id-123',
      });
    });

    it('should send 429 with custom message', () => {
      sendRateLimit(mockRes, 'Rate limit exceeded. Try again in 60 seconds', mockReq);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'rate_limit',
          message: 'Rate limit exceeded. Try again in 60 seconds',
        },
        requestId: 'test-request-id-123',
      });
    });
  });

  describe('sendServiceUnavailable', () => {
    it('should send 503 with default message', () => {
      sendServiceUnavailable(mockRes, 'Service temporarily unavailable', mockReq);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'service_unavailable',
          message: 'Service temporarily unavailable',
        },
        requestId: 'test-request-id-123',
      });
    });

    it('should send 503 with custom message', () => {
      sendServiceUnavailable(mockRes, 'OpenAI API is down', mockReq);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'service_unavailable',
          message: 'OpenAI API is down',
        },
        requestId: 'test-request-id-123',
      });
    });
  });

  describe('sendPaginated', () => {
    it('should send paginated response without cursor', () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      sendPaginated(mockRes, items);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          items,
        },
      });
    });

    it('should send paginated response with cursor', () => {
      const items = [{ id: 1 }, { id: 2 }];
      const nextCursor = 'cursor-abc123';
      sendPaginated(mockRes, items, nextCursor);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          items,
          nextCursor,
        },
      });
    });

    it('should send paginated response with custom status', () => {
      const items = [{ id: 1 }];
      sendPaginated(mockRes, items, null, 201);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should handle empty items array', () => {
      sendPaginated(mockRes, []);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          items: [],
        },
      });
    });
  });
});
