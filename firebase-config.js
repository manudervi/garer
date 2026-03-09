import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC5iX2PkWxSrbRObyPFzm2OIqPB8eed_0c",
  authDomain: "garer-777.firebaseapp.com",
  databaseURL: "https://garer-777-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "garer-777",
  storageBucket: "garer-777.firebasestorage.app",
  messagingSenderId: "353631922937",
  appId: "1:353631922937:web:d61249d6997e86ce3e9028"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
