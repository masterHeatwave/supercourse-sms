import { AsyncLocalStorage } from 'async_hooks';
// import mongoose from 'mongoose'; // mongoose import no longer needed here

// Define the type of the context we'll store.
// It will be the tenantId (string) or undefined if no tenant context.
export type RequestContext = string | undefined;

// Create the AsyncLocalStorage instance
export const requestContextLocalStorage = new AsyncLocalStorage<RequestContext>();
