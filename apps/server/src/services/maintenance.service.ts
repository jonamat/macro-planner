import prisma from '../config/prisma';

const SIX_MONTHS_AGO = () => {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 6);
  return cutoff;
};

export async function deleteInactiveAccounts() {
  const cutoff = SIX_MONTHS_AGO();
  const result = await prisma.user.deleteMany({
    where: {
      lastActiveAt: {
        lt: cutoff
      }
    }
  });
  return result.count;
}

export function startMaintenanceTasks(logger: Pick<Console, 'info' | 'error'> = console) {
  const intervalMs = Number(process.env.INACTIVE_ACCOUNT_PRUNE_INTERVAL_MS ?? 1000 * 60 * 60 * 24);

  const runCleanup = async () => {
    try {
      const deleted = await deleteInactiveAccounts();
      if (deleted > 0) {
        logger.info(`[maintenance] Removed ${deleted} inactive account(s) older than 6 months.`);
      } else {
        logger.info('[maintenance] No inactive accounts found for removal.');
      }
    } catch (err) {
      logger.error('[maintenance] Failed to remove inactive accounts:', err);
    }
  };

  // Run immediately on startup
  void runCleanup();

  const timer = setInterval(() => {
    void runCleanup();
  }, intervalMs);

  // Allow the process to exit naturally
  if (typeof timer.unref === 'function') {
    timer.unref();
  }
}
