import { useCallback, useEffect, useState } from 'react';
import { fetchGrid, fetchZones } from '../api/data.js';
import { FOCUS_FRAME } from '../data/frames.js';

/**
 * Loads what the map needs: the green and grey zones and the NDVI grid of the focus frame.
 * Returns { status: 'loading' | 'ready' | 'error', green, grey, grid, error, version, reload }.
 * `version` goes up by one after every successful load (the map uses it to redraw).
 */
export default function useMapData() {
  const [state, setState] = useState({ status: 'loading', green: null, grey: null, grid: null, error: null, version: 0 });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    Promise.all([fetchZones('green', { signal }), fetchZones('grey', { signal }), fetchGrid(FOCUS_FRAME.id, { signal })])
      .then(([green, grey, grid]) => {
        setState((prev) => ({ status: 'ready', green, grey, grid, error: null, version: prev.version + 1 }));
      })
      .catch((error) => {
        if (signal.aborted) return;
        console.error(error);
        setState((prev) => ({ ...prev, status: 'error', error }));
      });
    return () => controller.abort();
  }, [attempt]);

  const reload = useCallback(() => {
    setState((prev) => ({ ...prev, status: 'loading', error: null }));
    setAttempt((n) => n + 1);
  }, []);

  return { ...state, reload };
}
