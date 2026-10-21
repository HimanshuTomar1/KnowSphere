/**
 * KnowSphere Domain Types & Data Contracts
 */

export interface ZimPackage {
  id: string;
  title: string;
  description: string;
  sizeBytes: number;
  sizeFormatted?: string;
  downloadTime?: string;
  language: string;
  category: string;
  tags?: string[];
  articleCount?: number;
  mediaCount?: number;
  downloadUrl?: string;
  browseUrl?: string;
  fitsInStorage?: boolean;
  recommended?: boolean;
  score?: number;
}

export interface Category {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export interface Language {
  code: string;
  label: string;
  native: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  verified: boolean;
  createdAt?: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: UserProfile;
  token?: string;
  requiresOtp?: boolean;
  otp?: string;
  email?: string;
}

export interface DownloadItem {
  id: string;
  downloadId: string;
  zimId: string;
  title: string;
  sizeBytes: number;
  downloadedBytes: number;
  status: 'downloading' | 'paused' | 'completed' | 'interrupted' | 'cancelled';
  progress?: string;
  downloadedFormatted?: string;
  totalFormatted?: string;
  startedAt?: number;
  pausedAt?: number | null;
  interruptedAt?: number | null;
  resumedAt?: number | null;
  chunkChecksum?: string;
  sourceUrl?: string;
  browseUrl?: string | null;
  error?: string | null;
}

export interface TelemetryMetrics {
  sessionStart: number;
  stepTimes: {
    welcome: number;
    interests: number;
    language: number;
    storage: number;
    recommendations: number;
    download: number;
    complete: number;
  };
  visitedSteps: string[];
  interactionCount: number;
  errorsCount: number;
  actualTtfrSec: number | null;
}

export interface StorageMetrics {
  totalAllocatedBytes: number;
  totalAllocatedFormatted: string;
  usedBytes: number;
  usedFormatted: string;
  leftUpBytes: number;
  leftUpFormatted: string;
  usedPercent: string;
  leftPercent: string;
}

export interface RecoveryAuditEntry {
  eventType: 'NETWORK_SEVERED' | 'STREAM_RESUMED';
  timestamp: string;
  downloadId: string;
  title: string;
  preservedBytes?: number;
  resumedFromByte?: number;
  totalBytes: number;
  progressAtDrop?: string;
  progressAtResume?: string;
  byteRollback: number;
  checksum?: string;
  protocol?: string;
  verdict: string;
}
