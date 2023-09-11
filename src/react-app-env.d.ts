/// <reference types="react-scripts" />

declare module 'pdfjs-dist/webpack' {
  export * from 'pdfjs-dist';
}

declare module '*.pdf' {
  const src: string;
  export default src;
}
