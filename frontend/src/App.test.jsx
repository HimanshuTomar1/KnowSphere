import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import offlineStorage from './utils/offlineStorage';

describe('KnowSphere Frontend App & Offline Suite', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  test('renders KnowSphere application without crashing', () => {
    render(<App />);
    // Verify that Either Splash or KnowSphere branding is present in the DOM
    const logoOrTitle = screen.getByText(/KnowSphere|Kiwix/i);
    expect(logoOrTitle).toBeTruthy();
  });

  test('offlineStorage persists and retrieves downloads cache correctly', async () => {
    const mockDownloads = [
      {
        id: 'dl-test-1',
        title: 'Wikipedia Physics',
        sizeBytes: 1500000000,
        status: 'completed',
      },
    ];

    await offlineStorage.persistDownloads(mockDownloads);
    const retrieved = await offlineStorage.loadPersistedDownloads();

    expect(retrieved).toEqual(mockDownloads);
  });

  test('offlineStorage saves and recovers session telemetry logs', async () => {
    const mockTelemetry = {
      sessionStart: 123456789,
      stepTimes: { welcome: 10, interests: 5 },
      interactionCount: 42,
    };

    await offlineStorage.persistTelemetry(mockTelemetry);
    const retrieved = await offlineStorage.loadPersistedTelemetry();

    expect(retrieved).toEqual(mockTelemetry);
  });
});
