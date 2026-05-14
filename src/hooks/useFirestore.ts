import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, setDoc, deleteDoc, doc, query, where } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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
        initialData.forEach(async item => {
          try {
            await setDoc(doc(db, collectionName, item.id), { ...item, userId: auth.currentUser!.uid });
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, collectionName);
          }
        });
      } else {
        setData(fetchedData);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionName);
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

      const syncToFirestore = async () => {
        for (const item of nextData) {
          const prevItem = prevMap.get(item.id);
          // Simple JSON.stringify comparison is brittle if property order changes, 
          // but works for now as long as we clone it
          if (!prevItem || JSON.stringify(prevItem) !== JSON.stringify(item)) {
            try {
              await setDoc(doc(db, collectionName, item.id), { ...item, userId: auth.currentUser!.uid });
            } catch (error) {
               handleFirestoreError(error, OperationType.UPDATE, collectionName);
            }
          }
        }

        for (const item of prevData) {
          if (!nextMap.has(item.id)) {
            try {
              await deleteDoc(doc(db, collectionName, item.id));
            } catch (error) {
              handleFirestoreError(error, OperationType.DELETE, collectionName);
            }
          }
        }
      };

      // Run async without blocking UI
      syncToFirestore().catch(console.error);

      return nextData;
    });
  };

  return [data, updateData, loading];
}
