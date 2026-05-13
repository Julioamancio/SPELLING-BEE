import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, setDoc, deleteDoc, doc, query, where } from 'firebase/firestore';

export function useFirestoreCollection<T extends { id: string }>(
  collectionName: string,
  initialData: T[] = []
): [T[], (newData: T[] | ((prev: T[]) => T[])) => void, boolean] {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, collectionName), 
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as T));
      
      if (fetchedData.length === 0 && initialData.length > 0) {
        setData(initialData);
        initialData.forEach(item => {
          setDoc(doc(db, collectionName, item.id), { ...item, userId: auth.currentUser!.uid });
        });
      } else {
        setData(fetchedData);
      }
      setLoading(false);
    }, (error) => {
      console.error('Firestore Error: ', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [collectionName]);

  const updateData = async (newDataOrUpdater: T[] | ((prev: T[]) => T[])) => {
    if (!auth.currentUser) return;

    setData((prevData) => {
      const nextData = typeof newDataOrUpdater === 'function'
        ? (newDataOrUpdater as (prev: T[]) => T[])(prevData)
        : newDataOrUpdater;

      const prevMap = new Map(prevData.map(item => [item.id, item]));
      const nextMap = new Map(nextData.map(item => [item.id, item]));

      for (const item of nextData) {
        const prevItem = prevMap.get(item.id);
        if (!prevItem || JSON.stringify(prevItem) !== JSON.stringify(item)) {
          setDoc(doc(db, collectionName, item.id), { ...item, userId: auth.currentUser!.uid });
        }
      }

      for (const item of prevData) {
        if (!nextMap.has(item.id)) {
          deleteDoc(doc(db, collectionName, item.id));
        }
      }

      return nextData;
    });
  };

  return [data, updateData, loading];
}
