import React from 'react';
import { render, screen, act } from '@testing-library/react';
import App from './App';
import TtfrTracker from './components/TtfrTracker';
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

  test('TtfrTracker stays dynamic during steps 1-6 and stops when all seven steps are completed', () => {
    jest.useFakeTimers();
    const startTime = Date.now();

    // In steps 1 through 6 (e.g. stepIndex 0), TTFR is dynamic and running
    const { rerender } = render(
      <TtfrTracker startTime={startTime} stepIndex={0} />
    );
    expect(screen.getByText(/TTFR Clock:/i)).toBeTruthy();

    // Advance 5 seconds - dynamic tick updates
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // When all seven steps are completed (stepIndex 6, Step 7 of 7), TTFR stops
    rerender(
      <TtfrTracker
        startTime={startTime}
        stepIndex={6}
        firstResourceTime={startTime + 5000}
      />
    );
    expect(screen.getByText(/TTFR Achieved:/i)).toBeTruthy();
    expect(screen.getByText(/0:05/)).toBeTruthy();

    jest.useRealTimers();
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
