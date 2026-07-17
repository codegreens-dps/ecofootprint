// firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// DO NOT TOUCH THIS CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyBNO8SiOBW49CqL7YgHd572pF9mikE7ABo",
    authDomain: "ecofootprint-9c4ed.firebaseapp.com",
    projectId: "ecofootprint-9c4ed",
    storageBucket: "ecofootprint-9c4ed.firebasestorage.app",
    messagingSenderId: "425267033599",
    appId: "1:425267033599:web:3554770c24a204594ba3ca",
    measurementId: "G-NCNFZTHKS4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- QUIZ LOGIC ---
document.getElementById('footprintForm').addEventListener('submit', async function(e) {
    e.preventDefault(); // stops page from refreshing

    let val1 = Number(document.getElementById("q1").value);
    let val2 = Number(document.getElementById("q2").value);
    let val3 = Number(document.getElementById("q3").value);
    let val4 = Number(document.getElementById("q4").value);
    let val5 = Number(document.getElementById("q5").value);
    
    let total = val1 + val2 + val3 + val4 + val5;

    // save it to cloud
    try {
        await addDoc(collection(db, "simulatorScores"), {
            score: total,
            timeSaved: new Date().toISOString()
        });
    } catch (err) {
        console.log("firebase error: ", err);
    }

    let feedback = document.getElementById("feedbackText");
    let emoji = "";
    let barColor = "";

    // set up the ui based on score
    if (total >= 80) {
        emoji = "🌍🏆";
        barColor = "#2ecc71"; // green
        feedback.innerHTML = "🔥 INCREDIBLE! You implemented a true sustainable framework. By shifting to renewables and enforcing a circular economy, we can reach Net-Zero!";
        feedback.style.color = "#27ae60"; 
    } else if (total >= 40 && total < 80) {
        emoji = "⚠️📉";
        barColor = "#ffeb3b"; // yellow
        feedback.innerHTML = "🌱 A GOOD START. But half-measures like EVs aren't enough. We need systemic shifts in agriculture and public transit. Try again!";
        feedback.style.color = "#d35400"; 
    } else {
        emoji = "🏭❌";
        barColor = "#ff5252"; // red
        feedback.innerHTML = "🚨 DISASTER. Continuing the status quo guarantees severe global warming. We need radical policy shifts immediately.";
        feedback.style.color = "#c0392b"; 
    }

    document.getElementById("resultEmoji").innerHTML = emoji;
    document.getElementById('footprintForm').style.display = 'none';
    document.getElementById("resultBox").style.display = "block";

    // counter animation
    let count = 0;
    document.getElementById("scoreText").innerHTML = "0"; 
    
    let timer = setInterval(() => {
        if (count >= total) {
            clearInterval(timer);
            document.getElementById("scoreText").innerHTML = total; 
        } else {
            count++;
            document.getElementById("scoreText").innerHTML = count;
        }
    }, 20); 

    // fill the progress bar
    setTimeout(() => {
        document.getElementById("barFill").style.width = total + "%";
        document.getElementById("barFill").style.backgroundColor = barColor;
    }, 100);
});

// --- THE LIVE BOARD LOGIC ---
const boardRef = collection(db, "listedItems");
const q = query(boardRef, orderBy("timestamp", "desc"));

// listen for database changes instantly
onSnapshot(q, (snapshot) => {
    let boardHTML = document.getElementById('live-board');
    boardHTML.innerHTML = ""; // clear old stuff
    
    let activeItems = 0; 

    snapshot.forEach((docSnap) => {
        let item = docSnap.data();
        let id = docSnap.id; 

        // if it's already claimed, ignore it
        if (item.status === "claimed") {
            return; 
        }

        activeItems++; 

        let makeCard = `
            <div class="item-card" id="card-${id}">
                <div class="card-icon">${item.icon}</div>
                <h3>${item.name}</h3>
                <p class="lister-name">Listed by: ${item.lister}</p>
                <p>${item.description}</p>
                <button class="grab-btn" id="btn-${id}" onclick="claimItem('${id}')">CLAIM FOR FREE</button>
            </div>
        `;
        boardHTML.insertAdjacentHTML('beforeend', makeCard);
    });
    
    if (activeItems === 0) {
        boardHTML.innerHTML = "<h3 style='width:100%; text-align:center; color:#555;'>No items available right now. Be the first to list something! ♻️</h3>";
    }
});

// adding a new item
document.getElementById('addItemForm').addEventListener('submit', async function(e) {
    e.preventDefault(); 

    let formBtn = document.querySelector(".post-btn");
    formBtn.innerHTML = "LISTING... ⏳";
    
    try {
        await addDoc(collection(db, "listedItems"), {
            name: document.getElementById('newItemName').value,
            icon: document.getElementById('newItemIcon').value,
            lister: document.getElementById('newListerName').value,
            description: document.getElementById('newItemDesc').value,
            status: "available",
            timestamp: new Date().toISOString()
        });

        alert("📦 Item is live on the board!");
        document.getElementById('addItemForm').reset();

    } catch (err) {
        console.error("error uploading: ", err);
        alert("Network error.");
    } finally {
        formBtn.innerHTML = "LIST ITEM SECURELY 🔒";
    }
});

// clicking claim on an item
window.claimItem = async (id) => {
    let userName = prompt("♻️ Awesome! Enter your name & class so the owner knows who to give it to:");

    // if they click cancel
    if (!userName || userName.trim() === "") {
        return; 
    }

    let cardDiv = document.getElementById("card-" + id);
    let claimBtn = document.getElementById("btn-" + id);

    // change UI instantly so it feels fast
    if(claimBtn) {
        claimBtn.innerHTML = "🎉 CLAIMED BY " + userName.toUpperCase() + "!";
        claimBtn.style.backgroundColor = "#2ecc71"; 
        claimBtn.style.color = "#fff";
        claimBtn.disabled = true;
    }

    if(cardDiv) {
        cardDiv.style.borderColor = "#2ecc71";
        cardDiv.style.boxShadow = "8px 8px 0px #2ecc71";
    }

    // fade it out after 1.5s
    setTimeout(async () => {
        
        if (cardDiv) {
            cardDiv.style.opacity = "0";
            cardDiv.style.transform = "scale(0.9) translateY(20px)";
        }

        setTimeout(async () => {
            try {
                // tell firebase it was claimed
                const itemDoc = doc(db, "listedItems", id);
                await updateDoc(itemDoc, {
                    status: "claimed",
                    claimedBy: userName
                });
                
            } catch (err) {
                console.log("Firebase error: ", err);
                alert("🚨 ERROR: Connection failed! Check console.");
                
                // bring it back if it failed
                if(claimBtn) {
                    claimBtn.innerHTML = "CLAIM FOR FREE";
                    claimBtn.style.backgroundColor = "#ffeb3b";
                    claimBtn.style.color = "#000";
                    claimBtn.disabled = false;
                }
                if(cardDiv) {
                    cardDiv.style.borderColor = "#000";
                    cardDiv.style.boxShadow = "8px 8px 0px #ffeb3b";
                    cardDiv.style.opacity = "1";
                    cardDiv.style.transform = "none";
                }
            }
        }, 300);

    }, 1500); 
};

// reset button function
window.resetQuiz = () => {
    document.getElementById("footprintForm").reset();
    document.getElementById("scoreText").innerHTML = "0";
    document.getElementById("barFill").style.width = "0%";
    document.getElementById("resultBox").style.display = "none";
    document.getElementById("footprintForm").style.display = "block";
    document.getElementById('sim-area').scrollIntoView({ behavior: 'smooth' });
};
