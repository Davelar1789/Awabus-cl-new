import { AsyncLocalStorage } from 'node:async_hooks';

// Holds the "current school" for the lifetime of a request or a script run.
// This is what lets Model.find()/create()/etc calls inside controllers stay
// untouched while still being scoped to a tenant under the hood.
const als = new AsyncLocalStorage();

export const tenantContext = {
  /**
   * Run `fn` with `school` (an ObjectId or string) bound as the active tenant.
   * Any mongoose query/save made synchronously or asynchronously inside `fn`
   * will pick this up via the tenantScope plugin.
   */
  run(school, fn) {
    if (!school) throw new Error('[tenant] tenantContext.run() called without a school id');
    return als.run({ school: String(school) }, fn);
  },

  /**
   * Escape hatch for operations that must legitimately cross tenants:
   * platform-level superadmin screens, cron jobs that sweep all schools,
   * seed/migration scripts, etc. Use sparingly and explicitly.
   */
  runAsSystem(fn) {
    return als.run({ system: true }, fn);
  },

  getSchool() {
    return als.getStore()?.school || null;
  },

  isSystem() {
    return als.getStore()?.system === true;
  },
};

export default tenantContext;