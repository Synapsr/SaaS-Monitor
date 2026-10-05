// Re-export the native module. On web, it will be resolved to ScreenBridgeModule.web.ts
// and on native platforms to ScreenBridgeModule.ts
export { default } from './src/ScreenBridgeModule';
export * from './src/ScreenBridge.types';
