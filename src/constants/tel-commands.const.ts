export const telCommands = {
  start: '/start',
  debug: '/debug',
} as const;

export type TelCommandValue = (typeof telCommands)[keyof typeof telCommands];
export const telCommandsArray = Object.values(telCommands);
