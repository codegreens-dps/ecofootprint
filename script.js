import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getFirestore, collection, addDoc, onSnapshot, 
    query, orderBy, updateDoc, doc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const fbConf = {
    apiKey: "AIzaSyBNO8SiOBW49CqL7YgHd572pF9mikE7ABo",
    authDomain: "ecofootprint-9c4ed.firebaseapp.com",
    projectId: "ecofootprint-9c4ed",
    storageBucket: "ecofootprint-9c4ed.firebasestorage.app",
    messagingSenderId: "425267033599",
    appId: "1:425267033599:web:3554770c24a204594ba3ca",
    measurementId: "G-NCNFZTHKS4"
};

const app = initializeApp(fbConf);
const db = getFirestore(app);

const dummyNode = document.createElement('div');
const sanitize = (rawStr) => { 
    if (!rawStr) return ""; 
    dummyNode.textContent = rawStr; 
    return dummyNode.innerHTML; 
};

const kCode = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a']; 
let kIdx = 0;

document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === kCode[kIdx]) {
        kIdx++;
        if (kIdx === kCode.length) {
            const modal = document.getElementById('konami-modal');
            if (modal) modal.style.display = 'flex';
            document.body.classList.add('winner-mode');
            
            setTimeout(() => {
                document.body.classList.remove('winner-mode');
                if (modal) modal.style.display = 'none';
            }, 5000);
            
            kIdx = 0; 
        }
    } else { 
        kIdx = 0; 
    }
}, { passive: true });

const bootApp = () => { 
    
    const loadCarbonData = async (zone) => {
        const valUI = document.getElementById("intensityValue");
        const barUI = document.getElementById("intensityMeterFill");
        const statusUI = document.getElementById("intensityStatus");
        
        if (zone === "MARS") {
            if (valUI) valUI.innerText = "-42";
            if (barUI) { 
                barUI.style.width = "100%"; 
                barUI.style.backgroundColor = "#ff4500"; 
            }
            if (statusUI) { 
                statusUI.innerText = "100% Nuclear and Solar."; 
                statusUI.style.color = "#ff4500"; 
            }
            return;
        }

        if (valUI) valUI.innerText = "Loading..."; 
        if (barUI) barUI.style.width = "0%";
        if (statusUI) { 
            statusUI.innerText = "Checking grid health..."; 
            statusUI.style.color = "var(--text-color)"; 
        }

        try {
            const res = await fetch(`./data/${zone}.json`);
            if (!res.ok) throw new Error("bad fetch");
            
            const gridStats = await res.json();
            
            if (gridStats.carbonIntensity !== undefined) {
                const co2Level = gridStats.carbonIntensity; 
                if (valUI) valUI.innerText = co2Level;
                 
                if (barUI && statusUI) {
                    let fillPct = (co2Level / 800) * 100;
                    if (fillPct > 100) fillPct = 100;

                    requestAnimationFrame(() => {
                        barUI.style.width = `${fillPct}%`;
                        
                        if (co2Level < 250) { 
                            barUI.style.backgroundColor = "var(--green)"; 
                            statusUI.innerText = "Grid is looking clean today! 🌿"; 
                            statusUI.style.color = "var(--green)"; 
                        } else if (co2Level < 550) { 
                            barUI.style.backgroundColor = "var(--yellow)"; 
                            statusUI.innerText = "Moderate emissions. Meh. 🤷‍♂️"; 
                            statusUI.style.color = "var(--yellow)"; 
                        } else { 
                            barUI.style.backgroundColor = "var(--red)"; 
                            statusUI.innerText = "Grid is literally coughing smog. 🏭"; 
                            statusUI.style.color = "var(--red)"; 
                        }
                    });
                }
            }
        } catch (err) {
            if (valUI) valUI.innerText = "N/A";
            if (statusUI) { 
                statusUI.innerText = "Sync failure on cloud assets"; 
                statusUI.style.color = "var(--red)"; 
            }
        }
    };

    const regionDd = document.getElementById("regionSelect");
    if (regionDd) { 
        regionDd.addEventListener("change", (e) => loadCarbonData(e.target.value)); 
        loadCarbonData(regionDd.value); 
    }

    const quizForm = document.getElementById("footprintForm");
    if (quizForm) {
        quizForm.onsubmit = (e) => {
            e.preventDefault(); 
            
            const qList = ['q1', 'q2', 'q3', 'q4', 'q5'];
            let calcScore = 0;

            for (let i = 0; i < qList.length; i++) {
                const node = document.getElementById(qList[i]);
                if (node && node.value) {
                    calcScore += parseInt(node.value, 10);
                }
            }

            addDoc(collection(db, 'simulatorScores'), { 
                score: calcScore, 
                date: serverTimestamp() 
            }).catch(console.error);
 
            const fbNode = document.getElementById("feedbackText");
            let emj = "", barColor = "", finalDisplay = calcScore;

            if (calcScore < 0) {
                emj = "🛸"; 
                barColor = "var(--purple)"; 
                finalDisplay = "ERROR: 999"; 
                calcScore = 100;
                fbNode.innerText = "🌌 WAIT WHAT. You unlocked alien teleportation technology! Carbon emissions dropped to zero. You solved climate change with sci-fi."; 
                fbNode.style.color = barColor;
            } else if (calcScore > 79) {
                emj = "🌍"; 
                barColor = "var(--green)"; 
                fbNode.innerText = "🔥 INCREDIBLE! You implemented a true sustainable framework. By shifting to renewables and enforcing a circular economy, we can reach Net-Zero!"; 
                fbNode.style.color = barColor;
            } else if (calcScore > 39 && calcScore < 80) {
                emj = "⚠️"; 
                barColor = "var(--yellow)"; 
                fbNode.innerText = "🌱 A GOOD START. But half-measures aren't enough. We need systemic shifts in lots of things. Try again!"; 
                fbNode.style.color = barColor;
            } else {
                emj = "❌"; 
                barColor = "var(--red)"; 
                fbNode.innerText = "🚨 DISASTER. Continuing the status quo guarantees severe global warming. We need massive policy shifts immediately."; 
                fbNode.style.color = barColor;
            }

            document.getElementById("resultEmoji").innerText = emj; 
            quizForm.style.display = 'none'; 
            document.getElementById("resultBox").style.display = 'block';
            
            const scoreUI = document.getElementById("scoreText");
            scoreUI.innerText = "0";

            if (finalDisplay === "ERROR: 999") {
                scoreUI.innerText = finalDisplay; 
                scoreUI.classList.add("glitch-text");
            } else {
                let tick = 0;
                const rollNumbers = () => {
                    tick += Math.max(1, Math.floor(calcScore / 30)); 
                    if (tick >= calcScore) {
                        scoreUI.innerText = calcScore;
                    } else {
                        scoreUI.innerText = tick;
                        requestAnimationFrame(rollNumbers);
                    }
                };
                requestAnimationFrame(rollNumbers);
            }
            
            setTimeout(() => { 
                const fill = document.getElementById("barFill");
                if (fill) {
                    fill.style.width = `${calcScore}%`; 
                    fill.style.backgroundColor = barColor; 
                }
            }, 150); 
        };
    }

    const itemsRef = query(collection(db, "listedItems"), orderBy("timestamp", "desc"));
    onSnapshot(itemsRef, (snap) => {
        const board = document.getElementById('live-board');
        const claimedList = document.getElementById('claimed-list');
        if (!board || !claimedList) return;

        let liveStr = "";
        let takenStr = "";
        let liveCount = 0;
        let takenCount = 0;

        const docs = snap.docs;
        for (let i = 0; i < docs.length; i++) {
            const docSnap = docs[i];
            const listing = docSnap.data();
            const listingId = docSnap.id;
            
            const cleanName = sanitize(listing.name);
            const cleanClaimer = sanitize(listing.claimedBy);
            const cleanLister = sanitize(listing.lister);
            const cleanDesc = sanitize(listing.description);
            const cleanIcon = sanitize(listing.icon);

            if (listing.status === "claimed") { 
                takenCount++; 
                takenStr += `<li>✅ <strong>${cleanName}</strong> was snagged by ${cleanClaimer}!</li>`; 
            } else { 
                liveCount++; 
                liveStr += `
                    <div class='item-card neo-border hover-lift' id='card-${listingId}'>
                        <div class='card-icon'>${cleanIcon}</div>
                        <h3>${cleanName}</h3>
                        <p class='lister-name mono-text'>Listed by: <span>${cleanLister}</span></p>
                        <p>${cleanDesc}</p>
                        <button class='grab-btn brutal-btn' id='btn-${listingId}' onclick='claimIt("${listingId}")'>CLAIM FOR FREE ⚡</button>
                    </div>`; 
            }
        }

        requestAnimationFrame(() => {
            board.innerHTML = liveCount === 0 
                ? "<h3 style='width:100%;text-align:center;color:var(--green);' class='blink-text'>No items available right now. Be the first to list something!</h3>" 
                : liveStr;
                
            claimedList.innerHTML = takenCount === 0 
                ? "<li class='empty-state'>No items claimed yet... be the first!</li>" 
                : takenStr;

            const metricBox = document.getElementById('landfillCounter'); 
            if (metricBox) {
                const savedKilos = (takenCount * 4.5).toFixed(1); 
                metricBox.innerHTML = `${takenCount}<div style='font-size: 0.35em; color: var(--yellow); text-shadow: 0 0 10px rgba(255,230,0,0.5); margin-top: 12px; font-family: monospace; letter-spacing: 0px;'>~${savedKilos} kg CO₂ saved!</div>`;
            }
        });
    });

    const newPostForm = document.getElementById('addItemForm');
    if (newPostForm) {
        newPostForm.onsubmit = (e) => {
            e.preventDefault(); 
            const postBtn = document.querySelector(".post-btn");
            if (!postBtn) return;
            
            const oldTxt = postBtn.innerText; 
            postBtn.innerText = "UPLOADING..."; 
            
            const n = document.getElementById('newItemName').value;
            const i = document.getElementById('newItemIcon').value;
            const l = document.getElementById('newListerName').value;
            const d = document.getElementById('newItemDesc').value;

            addDoc(collection(db, "listedItems"), { 
                name: n, 
                icon: i, 
                lister: l, 
                description: d, 
                status: "available", 
                timestamp: serverTimestamp() 
            }).then(() => {
                if (i === "🛸") alert("Wait, where did you find Alien Tech?! 👽 It's live on the board!"); 
                else alert("It's live on the board!");
                
                newPostForm.reset(); 
                postBtn.innerText = oldTxt;
            }).catch(() => { 
                alert("Network error. Try again."); 
                postBtn.innerText = oldTxt; 
            });
        };
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootApp);
} else {
    bootApp();
}

// Inline module bindings need to sit on window
window.claimIt = (id) => {
    const who = prompt("♻️ Awesome! Enter your name & class so the owner knows who to give it to:"); 
    if (!who) return; 
    
    const btn = document.getElementById(`btn-${id}`);
    if (btn) { 
        btn.innerText = "CLAIMED!"; 
        btn.style.background = "var(--green)"; 
        btn.style.color = "#000"; 
        btn.disabled = true; 
    }

    setTimeout(() => {
        updateDoc(doc(db, "listedItems", id), { 
            status: "claimed", 
            claimedBy: who 
        }).catch(() => {
            alert("🚨 Couldn't connect to server. Check your connection/VPN.");
            if (btn) { 
                btn.innerText = "CLAIM FOR FREE ⚡"; 
                btn.style.background = ""; 
                btn.style.color = ""; 
                btn.disabled = false; 
            }
        });
    }, 800);
};

window.resetQuiz = () => {
    const form = document.getElementById("footprintForm");
    if (form) form.reset();
    
    const scoreUI = document.getElementById("scoreText");
    if (scoreUI) {
        scoreUI.innerText = "0"; 
        scoreUI.className = "glitch-score";
    }
    
    const bar = document.getElementById("barFill");
    if (bar) bar.style.width = "0%";
    
    const box = document.getElementById("resultBox");
    if (box) box.style.display = "none";
    if (form) form.style.display = "block"; 
    
    const simDiv = document.getElementById('sim');
    if (simDiv) window.scrollTo({ top: simDiv.offsetTop, behavior: 'smooth' }); 
};

window.activateWinnerProtocol = () => {
    document.body.classList.add("winner-mode");
    
    const banner = document.createElement('div'); 
    banner.className = 'victory-banner';
    banner.innerHTML = '<h1 style="font-family: \'Orbitron\', sans-serif; font-size: 5rem; color: #fff; text-shadow: 10px 10px 0px var(--orange);">HACKATHON WINNERS! 🏆</h1>'; 
    document.body.appendChild(banner);
    
    setTimeout(() => { 
        if (banner.parentNode) banner.remove(); 
        document.body.classList.remove("winner-mode"); 
    }, 5000);
};

window.printReport = () => window.print();
