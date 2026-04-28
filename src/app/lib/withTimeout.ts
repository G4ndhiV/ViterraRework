/** Promise that rejects after `ms` if `promise` has not settled (para no bloquear la UI). */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = window.setTimeout(() => {
      reject(new Error(`${label}: tiempo de espera agotado (${Math.round(ms / 1000)} s)`));
    }, ms);
    promise.then(
      (v) => {
        window.clearTimeout(id);
        resolve(v);
      },
      (e: unknown) => {
        window.clearTimeout(id);
        reject(e);
      }
    );
  });
}
