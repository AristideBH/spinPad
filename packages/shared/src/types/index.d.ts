// ═══════════════════════════════════════════════════════════════
//  types/index.ts — Centralized re-exports of all SpinPad types
//
//  Usage from anywhere in the monorepo:
//    import type { FullConfig, DeviceStatus, SerialStateSnapshot } from '@spinpad/shared/types';
//
//  The source types stay in their modules (config-schema.ts,
//  device-status-schema.ts, etc.) to avoid circular dependencies.
//  This file is only a re-export barrel.
// ═══════════════════════════════════════════════════════════════

// ── Config ───────────────────────────────────────────────────────
export type {
  LayerConfig,
  ProfileConfig,
  FullConfig,
  WidgetConfig,
  WidgetType,
  MacroStep,
  MacroStepType,
} from '$shared/constants/config-schema.js';

// ── Device Status ────────────────────────────────────────────────
export type {
  BatteryStatus,
  BatteryAbsent,
  BatteryPresent,
  BatterySource,
  BatteryPresentConfig,
  FirmwareInfo,
  ConnectionStatus,
  DeviceStatus,
} from '$shared/constants/device-status-schema.js';

// ── Icon ─────────────────────────────────────────────────────────
export type { BoolGrid } from '$shared/constants/profile-icon.js';
export type { IconLibraryEntry } from '$shared/constants/profile-icon-library.js';

// ── Presets ──────────────────────────────────────────────────────
export type {
  ProfilePreset,
  ProfilePresetSource,
} from '$shared/constants/profile-presets.js';

// ── Transport ────────────────────────────────────────────────────
export type {
  Transport,
  DeviceStatusTransport,
} from './transport';

// ── Serial ───────────────────────────────────────────────────────
export type {
  RpcQueueEntry,
  MessageHandler,
} from './serial';

// ── Dev Mode ─────────────────────────────────────────────────────
export type {
  BatteryScenario,
  ConnectionScenario,
  MockOptions,
} from './dev-mode';
