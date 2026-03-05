import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  get,
  remove,
  update,
  onValue,
  off,
  DataSnapshot
} from 'firebase/database';
import { Course, User } from '../types';

// Firebase config (공개 가능 — 보안은 Database Rules에서 관리)
const firebaseConfig = {
  apiKey: "AIzaSyC8iy95qeEjmMYZ-h2NsOK9fRMvAAF0AAA",
  authDomain: "onlinecurri.firebaseapp.com",
  databaseURL: "https://onlinecurri-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "onlinecurri",
  storageBucket: "onlinecurri.firebasestorage.app",
  messagingSenderId: "998081443892",
  appId: "1:998081443892:web:a599b92763b81ba9d13261"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const COURSES_REF = 'courses';
const USERS_REF = 'users';

export const firebaseService = {
  subscribeToCourses(callback: (courses: Course[]) => void): () => void {
    const coursesRef = ref(db, COURSES_REF);

    const listener = onValue(coursesRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (!data) {
        callback([]);
        return;
      }
      const courses: Course[] = Object.values(data).map((c: any) => ({
        ...c,
        title: c.title || '',
        platform: c.platform || '',
        instructor: c.instructor || '',
        curriculum: (Array.isArray(c.curriculum) ? c.curriculum : []).map((major: any) => ({
          ...major,
          middles: (Array.isArray(major.middles) ? major.middles : []).map((mid: any) => ({
            ...mid,
            minors: Array.isArray(mid.minors) ? mid.minors : [],
          })),
        })),
      }));
      callback(courses);
    });

    return () => off(coursesRef, 'value', listener);
  },

  async saveCourse(course: Course): Promise<void> {
    const courseRef = ref(db, `${COURSES_REF}/${course.id}`);
    await set(courseRef, course);
  },

  async deleteCourse(courseId: string): Promise<void> {
    const courseRef = ref(db, `${COURSES_REF}/${courseId}`);
    await remove(courseRef);
  },

  async verifyAdminPassword(password: string): Promise<boolean> {
    const passwordRef = ref(db, 'admin/password');
    const snapshot = await get(passwordRef);
    const storedPassword = snapshot.val();
    if (storedPassword === null) {
      await set(passwordRef, '0000');
      return password === '0000';
    }
    return password === storedPassword;
  },

  async changeAdminPassword(newPassword: string): Promise<void> {
    const passwordRef = ref(db, 'admin/password');
    await set(passwordRef, newPassword);
  },

  // User management
  async registerUser(name: string, email: string, password: string): Promise<User> {
    const snapshot = await get(ref(db, USERS_REF));
    const data = snapshot.val();
    if (data) {
      const exists = Object.values(data as Record<string, User>).some(u => u.email === email);
      if (exists) throw new Error('EMAIL_EXISTS');
    }
    const id = crypto.randomUUID();
    const user: User = { id, name, email, password, approved: false, createdAt: Date.now() };
    await set(ref(db, `${USERS_REF}/${id}`), user);
    return user;
  },

  async loginUser(email: string, password: string): Promise<User> {
    const snapshot = await get(ref(db, USERS_REF));
    const data = snapshot.val();
    if (!data) throw new Error('USER_NOT_FOUND');
    const user = Object.values(data as Record<string, User>).find(u => u.email === email && u.password === password);
    if (!user) throw new Error('INVALID_CREDENTIALS');
    return user;
  },

  async getUser(userId: string): Promise<User | null> {
    const snapshot = await get(ref(db, `${USERS_REF}/${userId}`));
    return snapshot.val() as User | null;
  },

  subscribeToUsers(callback: (users: User[]) => void): () => void {
    const usersRef = ref(db, USERS_REF);
    const listener = onValue(usersRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      callback(data ? Object.values(data) : []);
    });
    return () => off(usersRef, 'value', listener);
  },

  async approveUser(userId: string): Promise<void> {
    await update(ref(db, `${USERS_REF}/${userId}`), { approved: true });
  },

  async rejectUser(userId: string): Promise<void> {
    await remove(ref(db, `${USERS_REF}/${userId}`));
  },

  // Material URL management
  async setMaterialUrl(courseId: string, materialUrl: string): Promise<void> {
    await update(ref(db, `${COURSES_REF}/${courseId}`), { materialUrl });
  },

  async removeMaterialUrl(courseId: string): Promise<void> {
    await update(ref(db, `${COURSES_REF}/${courseId}`), { materialUrl: null });
  }
};
