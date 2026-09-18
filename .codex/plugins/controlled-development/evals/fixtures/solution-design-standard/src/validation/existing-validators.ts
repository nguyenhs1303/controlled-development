import { registerValidator } from './registry.js';

registerValidator('non-empty', (value) => value.length > 0);
registerValidator('trimmed', (value) => value === value.trim());
registerValidator('short', (value) => value.length <= 64);
