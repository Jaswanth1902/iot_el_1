const firebaseConfig = {
  apiKey: "AIzaSyBsJq5-bgl1jReTV7XL3nRVyBMajt6ZWjI",
  authDomain: "vaccine-cold-chain.firebaseapp.com",
  databaseURL: "https://vaccine-cold-chain-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "vaccine-cold-chain",
  storageBucket: "vaccine-cold-chain.firebasestorage.app",
  messagingSenderId: "307709369108",
  appId: "1:307709369108:web:994a1df850d7212b3f0001",
  measurementId: "G-Z080ZD7SVV"
};

const DEMO_MODE = false;

let rtdb = null;

function initFirebase() {
  try {
    console.log("Firebase library loaded:", firebase);

    firebase.initializeApp(firebaseConfig);
    rtdb = firebase.database();

    console.log("Firebase Connected");

    // Attach a test listener
    rtdb.ref("vaccineBox").on("value", snapshot => {
        console.log("Firebase Data:", snapshot.val());
    });

    return true;
  }
  catch (e) {
    console.error(e);
    return false;
  }
}
