import { useCallback, useEffect, useRef, useState } from 'react';

const useLiveResource = (load, refreshInterval = 60000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const hasLoaded = useRef(false);

  const refresh = useCallback(() => setRefreshCount(count => count + 1), []);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(!hasLoaded.current);
      setError('');
      try {
        const result = await load();
        if (!active) return;
        setData(result);
        setLastUpdated(new Date());
        hasLoaded.current = true;
      } catch (requestError) {
        if (active) setError(requestError.message || 'Unable to load live data.');
      } finally {
        if (active) setLoading(false);
      }
    };

    const fetchWhenVisible = () => {
      if (document.visibilityState === 'visible') fetchData();
    };

    fetchData();
    const timer = window.setInterval(fetchWhenVisible, refreshInterval);
    window.addEventListener('focus', fetchWhenVisible);
    document.addEventListener('visibilitychange', fetchWhenVisible);

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', fetchWhenVisible);
      document.removeEventListener('visibilitychange', fetchWhenVisible);
    };
  }, [load, refreshCount, refreshInterval]);

  return { data, loading, error, lastUpdated, refresh };
};

export default useLiveResource;
