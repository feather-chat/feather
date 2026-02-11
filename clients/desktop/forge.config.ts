import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerDMG } from '@electron-forge/maker-dmg';
import path from 'path';
import fs from 'fs';

const config: ForgeConfig = {
  packagerConfig: {
    name: 'Feather',
    executableName: 'feather',
    asar: true,
    icon: './icons/icon',
  },
  hooks: {
    packageAfterCopy: async (_config, buildPath) => {
      const webDist = path.resolve(__dirname, '..', 'web', 'dist');
      const dest = path.join(buildPath, 'web-dist');
      if (!fs.existsSync(webDist)) {
        throw new Error(
          'clients/web/dist/ not found. Run "pnpm --filter @feather/web build" first.',
        );
      }
      fs.cpSync(webDist, dest, { recursive: true });
    },
  },
  makers: [
    new MakerSquirrel({}),
    new MakerDMG({}),
    new MakerZIP({}, ['darwin', 'linux']),
    new MakerDeb({}),
  ],
};

export default config;
