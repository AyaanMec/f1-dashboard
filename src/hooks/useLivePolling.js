import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Generic polling hook.
 * @param {Function} fetchFn - async function to call
 * @param {number} intervalMs - polling interval in ms
 * @param {Array} deps - only start polling when all deps are truthy
 */
export default function useLivePolling(fetchFn, intervalMs, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const ready = deps.every(Boolean);

  const execute = useCallback(async () => {
    try {
      const result = await fetchFnRef.current();
      setData(result);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    execute();
    // intervalMs null/0 means fetch once only (e.g. finished session)
    if (!intervalMs) return;
    const id = setInterval(execute, intervalMs);
    return () => clearInterval(id);
  }, [ready, intervalMs, execute, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, lastUpdated, refetch: execute };
}
