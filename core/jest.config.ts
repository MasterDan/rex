import type { Config } from '@jest/types';

export default async (): Promise<Config.InitialOptions> => {
  return {
    verbose: false,
    transform: {
      '\\.[jt]s$': 'ts-jest',
    },
  };
};
