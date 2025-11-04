import { logger } from '@utils/logger';

// Track which tenants have completed seeding for each component
const seedingStatus = {
  roles: new Set<string>(),
  customers: new Set<string>(),
  users: new Set<string>(),
  academicYears: new Set<string>(),
  academicPeriods: new Set<string>(),
  classrooms: new Set<string>(),
  taxis: new Set<string>(),
  sessions: new Set<string>(),
  absences: new Set<string>(),
  posts: new Set<string>(),
  activities: new Set<string>(),
  inventory: new Set<string>(),
  elibrary: new Set<string>(),
  assets: new Set<string>(),
  messaging: new Set<string>(),
};

// List of all components being seeded
const components = [
  'roles',
  'customers',
  'users',
  'academicYears',
  'academicPeriods',
  'classrooms',
  'taxis',
  'sessions',
  'absences',
  'posts',
  'activities',
  'inventory',
  'elibrary',
  'assets',
  'messaging',
];

// Mark a component as completed for a tenant
export const markComponentComplete = (
  component:
    | 'roles'
    | 'customers'
    | 'users'
    | 'academicYears'
    | 'academicPeriods'
    | 'classrooms'
    | 'taxis'
    | 'sessions'
    | 'absences'
    | 'posts'
    | 'activities'
    | 'inventory'
    | 'elibrary'
    | 'assets'
    | 'messaging',
  tenant: string
) => {
  seedingStatus[component].add(tenant);

  // Check if this tenant has completed all components
  const allComponentsComplete = components.every((comp) =>
    seedingStatus[comp as keyof typeof seedingStatus].has(tenant)
  );

  if (allComponentsComplete) {
    logger.info(`✅ ALL SEEDERS COMPLETED for tenant: ${tenant}`);
  }
};

// Use this instead of individual component logging
export const logSeeding = (message: string, tenant?: string, isDebug = false) => {
  if (isDebug) {
    // Skip debug messages, we don't want to see them
    return;
  }

  if (tenant) {
    logger.info(`[${tenant}] ${message}`);
  } else {
    logger.info(message);
  }
};
