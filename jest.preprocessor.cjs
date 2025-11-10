// Preprocessor to replace import.meta.env with process.env before TypeScript compilation
const tsJest = require('ts-jest').default;

module.exports = {
  process(src, path, config, transformOptions) {
    // Replace import.meta.env with process.env before TypeScript compilation
    const transformedSrc = src
      .replace(/import\.meta\.env\.VITE_API_BASE_URL/g, "process.env.VITE_API_BASE_URL")
      .replace(/import\.meta\.env/g, "process.env");
    
    // Create ts-jest transformer with config
    const tsJestTransformer = tsJest.createTransformer({
      tsconfig: {
        module: 'esnext',
        target: 'esnext',
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
      },
    });
    
    // Use ts-jest transformer to compile the transformed source
    return tsJestTransformer.process(transformedSrc, path, config, transformOptions);
  },
  getCacheKey(fileData, filename, configString, options) {
    // Create a cache key that includes the transformation
    const tsJestTransformer = tsJest.createTransformer();
    const baseKey = tsJestTransformer.getCacheKey(fileData, filename, configString, options);
    return `${baseKey}-import-meta-transform`;
  },
};

