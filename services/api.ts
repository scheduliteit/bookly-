
import { Appointment, Client, User } from '../types';
import { db, auth, doc, getDoc, collection, query, where, onSnapshot, setDoc, updateDoc, deleteDoc, addDoc, handleFirestoreError, OperationType } from '../firebase';

export const api = {
  appointments: {
    list: (callback: (data: Appointment[]) => void) => {
      const userId = auth.currentUser?.uid;
      if (!userId) return () => {};
      
      const q = query(collection(db, 'appointments'), where('userId', '==', userId));
      return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Appointment));
        callback(data);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'appointments');
      });
    },
    create: async (data: Appointment): Promise<Appointment> => {
      const docRef = doc(collection(db, 'appointments'));
      const newApt = { ...data, id: docRef.id };
      try {
        await setDoc(docRef, newApt);
        return newApt;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'appointments');
        throw error;
      }
    },
    delete: async (id: string): Promise<void> => {
      try {
        await deleteDoc(doc(db, 'appointments', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'appointments');
        throw error;
      }
    },
    update: async (data: Appointment): Promise<Appointment> => {
      try {
        await updateDoc(doc(db, 'appointments', data.id), { ...data });
        return data;
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'appointments');
        throw error;
      }
    }
  },
  clients: {
    list: (callback: (data: Client[]) => void) => {
      const userId = auth.currentUser?.uid;
      if (!userId) return () => {};
      
      const q = query(collection(db, 'clients'), where('userId', '==', userId));
      return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Client));
        callback(data);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'clients');
      });
    },
    create: async (data: Client): Promise<Client> => {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');
      
      const docRef = doc(collection(db, 'clients'));
      const newClient = { ...data, id: docRef.id, userId };
      try {
        await setDoc(docRef, newClient);
        return newClient;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'clients');
        throw error;
      }
    },
    delete: async (id: string): Promise<void> => {
      try {
        await deleteDoc(doc(db, 'clients', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'clients');
        throw error;
      }
    }
  },
  user: {
    get: async (userId: string): Promise<User | null> => {
      try {
        const docSnap = await getDoc(doc(db, 'users', userId));
        if (docSnap.exists()) {
          return docSnap.data() as User;
        }
        return null;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${userId}`);
        throw error;
      }
    },
    save: async (user: User): Promise<void> => {
      try {
        await setDoc(doc(db, 'users', user.id), user, { merge: true });
        
        // Also update public profile
        const publicRef = doc(db, 'public_profiles', user.id);
        await setDoc(publicRef, {
          userId: user.id,
          businessName: user.businessName,
          businessCategory: user.businessCategory,
          services: user.services,
          currency: user.currency,
          legalData: user.legalData
        }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.id}`);
        throw error;
      }
    },
    sync: (userId: string, callback: (data: User) => void) => {
      return onSnapshot(doc(db, 'users', userId), (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as User);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${userId}`);
      });
    }
  },
  publicProfile: {
    get: async (userId: string): Promise<any | null> => {
      try {
        const docSnap = await getDoc(doc(db, 'public_profiles', userId));
        if (docSnap.exists()) {
          return docSnap.data();
        }
        return null;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `public_profiles/${userId}`);
        throw error;
      }
    }
  },
  system: {
    checkAvailability: async (date: string): Promise<string[]> => {
      // For now, keep it simple or implement logic based on appointments
      return ["09:00", "10:00", "11:00", "12:00", "13:30", "14:30", "15:30", "16:30"];
    }
  }
};
