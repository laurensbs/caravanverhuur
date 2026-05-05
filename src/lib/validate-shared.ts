// Shared Zod primitives — used by both client (RHF resolvers) and server
// (API route validators). No Next/server imports here, so this module is
// safe to import from a 'use client' component.

import { z } from 'zod';

export const Email = z.string().trim().toLowerCase().email().max(254);

// Loose phone: digits, spaces, +, -, (), .. Real validation happens via
// downstream provider; we only block obvious garbage at the boundary.
export const Phone = z.string().trim().min(6).max(32).regex(/^[+0-9 ()\-./]+$/);

export const NonEmpty = (max = 500) => z.string().trim().min(1).max(max);
