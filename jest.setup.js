// jest.setup.js

// Use require() for consistency with CommonJS
require('whatwg-fetch');

// These are for other modern APIs, which you already have
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// React Testing Library setup
require('@testing-library/jest-dom');