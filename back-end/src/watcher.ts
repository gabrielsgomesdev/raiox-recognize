import 'dotenv/config';
import path from 'path';
import { watchFolder } from './services/watcherService.js';

const WATCH_DIR = process.env.WATCH_DIR || path.join(process.cwd(), 'imagens-inbox');

watchFolder(WATCH_DIR);
