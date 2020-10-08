declare module '*.less' {
  const styles: Record<string, string>;
  export = styles;
}

declare global {
  interface Window {
    appLocale?: any;
  }
}
