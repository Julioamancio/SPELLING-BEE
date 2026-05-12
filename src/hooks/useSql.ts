import { useState, useEffect } from 'react';

const getHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export function useSqlCollection<T extends { id: string }>(
  collectionName: string,
  initialData: T[] = []
): [T[], (newData: T[] | ((prev: T[]) => T[])) => void, boolean] {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const res = await fetch(`/api/${collectionName}`, { headers: getHeaders() });
        if (!res.ok) throw new Error("Unauthorized");
        const fetchedData = await res.json();
        
        if (mounted) {
          if (fetchedData.length === 0 && initialData.length > 0) {
            setData(initialData);
            initialData.forEach(item => {
              fetch(`/api/${collectionName}`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(item)
              });
            });
          } else {
            setData(fetchedData);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (mounted) setLoading(false);
      }
    };
    
    loadData();
    return () => { mounted = false; };
  }, [collectionName]);

  const updateData = async (newDataOrUpdater: T[] | ((prev: T[]) => T[])) => {
    setData((prevData) => {
      const nextData = typeof newDataOrUpdater === 'function'
        ? (newDataOrUpdater as (prev: T[]) => T[])(prevData)
        : newDataOrUpdater;

      const prevMap = new Map(prevData.map(item => [item.id, item]));
      const nextMap = new Map(nextData.map(item => [item.id, item]));

      for (const item of nextData) {
        const prevItem = prevMap.get(item.id);
        if (!prevItem || JSON.stringify(prevItem) !== JSON.stringify(item)) {
          fetch(`/api/${collectionName}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(item)
          });
        }
      }

      for (const item of prevData) {
        if (!nextMap.has(item.id)) {
          fetch(`/api/${collectionName}/${item.id}`, { 
            method: 'DELETE',
            headers: getHeaders()
          });
        }
      }

      return nextData;
    });
  };

  return [data, updateData, loading];
}
