import '@testing-library/jest-dom';

// Polyfill for TextEncoder / TextDecoder (needed by react-router-dom in Jest)
import { TextEncoder, TextDecoder } from 'util';

(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder as any;

