import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
/* Remotion lädt in dieser Umgebung kein eigenes Chromium herunter; der Pfad kommt
   beim Aufruf über --browser-executable dazu (siehe README im Ordner video). */
