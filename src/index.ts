/**
 * Digia React Native SDK
 * 
 * Main entry point for the SDK exports.
 */

// Core initialization
export { DigiaUI } from './init/digia_ui';
export { DigiaUIManager, getDigiaUIManager } from './init/digia_ui_manager';
export type { DigiaUIOptions } from './init/options';
export { Flavors, InitStrategies } from './init/flavor';
export { Environment } from './init/environment';
export type {
  Flavor,
  DebugFlavor,
  StagingFlavor,
  VersionedFlavor,
  ReleaseFlavor,
  DSLInitStrategy,
  NetworkFirstStrategy,
  CacheFirstStrategy,
  LocalFirstStrategy,
} from './init/flavor';

// App components
export * from './app';

// UI Factory
export { DUIFactory, getDUIFactory } from './components/ui_factory';
export { DUIPageScreen } from './components/DUIPageScreen';

// Configuration
export * from './dui_config';
export { ConfigResolver } from './config/ConfigResolver';
export { DUIConfig } from './config/model';

// Storage
export { storage, type StorageAdapter } from './storage/storage';
export { PreferencesStore, getPreferencesStore } from './preferences_store';

// Network
export { NetworkClient } from './network/network_client';

// App State Management
export * from './config/app_state';

// Analytics
export * from './analytics';

// Framework utilities
export * from './framework/utils';
export {
  MessageBus,
  Message,
  DigiaUIScope,
  useDigiaUIScope,
  useMessageBus,
  useAnalytics,
} from './framework';

// Data types
export * from './framework/data_type/data_type';
export { Variable } from './framework/data_type/variable';

// Navigation - Export all navigation utilities
export {
  navigatorRef,
  getNavigator,
  navigate,
  push,
  goBack,
  canGoBack,
  reset,
  replace,
  popUntil,
  getCurrentRouteName,
  getState,
} from './framework/navigation/ref';

// Framework types

// Base widget classes
export * from './components/base';

// Actions
export * from './framework/actions';

export * from '../src/components/iiiii';
