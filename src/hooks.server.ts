import startMonitor from "$lib/monitor";

startMonitor();

export const handle = async ({ event, resolve }) => {
  return resolve(event);
};