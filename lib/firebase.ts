import { initializeApp } from "firebase/app";
import {
    getFirestore,
    collection,
    getDocs,
    query,
    where,
    doc,
    setDoc,
    addDoc,
    deleteDoc,
    orderBy,
    startAt,
    endAt,
    getDoc // ✅ getDoc 추가
} from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAndxmjKRA3ZDrOZ0aALjnTPFHC7Q-jpXw",
    authDomain: "gaguiboo.firebaseapp.com",
    projectId: "gaguiboo",
    storageBucket: "gaguiboo.firebasestorage.app",
    messagingSenderId: "545475332778",
    appId: "1:545475332778:web:c879423ce3010694805ed3"
};

// ✅ Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ Firebase 관련 함수 및 객체 export
export {
    db,
    collection,
    getDocs,
    query,
    where,
    doc,
    setDoc,
    addDoc,
    deleteDoc,
    orderBy,
    startAt,
    endAt,
    getDoc // ✅ getDoc 추가
};
