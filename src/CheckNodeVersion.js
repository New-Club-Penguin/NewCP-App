'use strict';

const REQUIRED_MAJOR = 16;
const [major] = process.versions.node.split('.').map(Number);

if (major !== REQUIRED_MAJOR) {
  process.stderr.write(
    [
      '',
      '╔══════════════════════════════════════════════════════════════╗',
      '║           ⚠  INCORRECT NODE VERSION  ⚠                      ║',
      '╠══════════════════════════════════════════════════════════════╣',
      `║  Detected : Node ${process.versions.node.padEnd(43)}║`,
      `║  Required : Node ${REQUIRED_MAJOR}.x${''.padEnd(42)}║`,
      '╠══════════════════════════════════════════════════════════════╣',
      '║  Fix:                                                        ║',
      '║    nvm install 16 && nvm use 16                              ║',
      '║    (download: https://nodejs.org/dist/latest-v16.x/)         ║',
      '╠══════════════════════════════════════════════════════════════╣',
      '║                    Made by markut                            ║',
      '╚══════════════════════════════════════════════════════════════╝',
      '',
    ].join('\n')
  );
  process.exit(1);
}
