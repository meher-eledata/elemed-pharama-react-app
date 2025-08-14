

/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

declare module "*.svg" {
  import React from 'react';
  const content: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default content;
}
// declare module '*.jpeg' {
//   const value: string;
//   export default value;
// }
// declare module '*.jpg' {
//   const value: string;
//   export default value;
// }
// declare module '*.gif' {
//   const value: string;
//   export default value;
// }