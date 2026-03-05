import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  get,
  remove,
  onValue,
  off,
  DataSnapshot
} from 'firebase/database';
import { Course } from '../types';

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

export const firebaseService = {
  subscribeToCourses(callback: (courses: Course[]) => void): () => void {
    const coursesRef = ref(db, COURSES_REF);

    const listener = onValue(coursesRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (!data) {
        callback([]);
        return;
      }
      const courses: Course[] = Object.values(data);
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
  }
};
