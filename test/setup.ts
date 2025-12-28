/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

// Jest test setup file
import { jest } from '@jest/globals';

// Set test timeout
jest.setTimeout(30000);

// Mock n8n-workflow module
jest.mock('n8n-workflow', () => ({
  IExecuteFunctions: {},
  INodeType: {},
  INodeTypeDescription: {},
  ICredentialType: {},
  INodeProperties: {},
  INodePropertyOptions: {},
  IDataObject: {},
  NodeOperationError: class NodeOperationError extends Error {
    constructor(node: unknown, message: string) {
      super(message);
      this.name = 'NodeOperationError';
    }
  },
}));

// Global test utilities
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error,
};

// Clean up after tests
afterAll(() => {
  jest.clearAllMocks();
});
