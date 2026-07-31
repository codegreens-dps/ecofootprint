import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseKeys = {
    apiKey: "AIzaSyBNO8SiOBW49CqL7YgHd572pF9mikE7ABo",
    authDomain: "ecofootprint-9c4ed.firebaseapp.com",
    projectId: "ecofootprint-9c4ed",
    storageBucket: "ecofootprint-9c4ed.firebasestorage.app",
    messagingSenderId: "425267033599",
    appId: "1:425267033599:web:3554770c24a204594ba3ca",
    measurementId: "G-NCNFZTHKS4"
};

const app = initializeApp(firebaseKeys);
const db = getFirestore(app);

//xss protection (hacky but it works)
const secNode = document.createElement('div');
function nukeTags(dirtyHtml) {
    if (!dirtyHtml) return "";
    secNode.textContent = dirtyHtml;
    return secNode.innerHTML;
}

const cheatCode = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
let cheatPos = 0;

document.addEventListener('keydown', function(e) {
    if (e.key.toLowerCase() === cheatCode[cheatPos]) {
        cheatPos++;
        if (cheatPos === cheatCode.length) {
            document.getElementById('konami-modal').style.display = 'flex';
            document.body.classList.add('winner-mode');

            setTimeout(() => {
                document.body.classList.remove('winner-mode');
                document.getElementById('konami-modal').style.display = 'none';
            }, 5000);

            cheatPos = 0;
        }
    } else {
        cheatPos = 0;
    }
}, { passive: true });

async function pingElectricityMaps(regionCode) {
    const valLabel = document.getElementById("co2-value-label");
    const barUi = document.getElementById("grid-intensity-bar");
    const statusMsg = document.getElementById("grid-status-msg");

    if (regionCode === "MARS") {
        valLabel.innerText = "-42";
        barUi.style.width = "100%";
        barUi.style.backgroundColor = "#ff4500";
        statusMsg.innerText = "100% Nuclear and Solar.";
        statusMsg.style.color = "#ff4500";
        return;
    }

    valLabel.innerText = "Loading...";
    barUi.style.width = "0%";
    statusMsg.innerText = "Checking grid health...";
    statusMsg.style.color = "var(--text-color)";

    try {
        const res = await fetch(`./data/${regionCode}.json`);
        if (!res.ok) throw new Error("bad fetch");

        const carbonPayload = await res.json();

        if (carbonPayload.carbonIntensity !== undefined) {
            const emissions = carbonPayload.carbonIntensity;
            valLabel.innerText = emissions;

            let fillPct = (emissions / 800) * 100;
            if (fillPct > 100) fillPct = 100;

            requestAnimationFrame(() => {
                barUi.style.width = `${fillPct}%`;

                if (emissions < 250) {
                    barUi.style.backgroundColor = "var(--green)";
                    statusMsg.innerText = "Grid is looking clean today!";
                    statusMsg.style.color = "var(--green)";
                } else if (emissions < 550) {
                    barUi.style.backgroundColor = "var(--yellow)";
                    statusMsg.innerText = "Moderate emissions.";
                    statusMsg.style.color = "var(--yellow)";
                } else {
                    barUi.style.backgroundColor = "var(--red)";
                    statusMsg.innerText = "Grid is literally coughing smog.";
                    statusMsg.style.color = "var(--red)";
                }
            });
        }
    } catch (err) {
        valLabel.innerText = "N/A";
        statusMsg.innerText = "Sync failure on cloud assets";
        statusMsg.style.color = "var(--red)";
    }
}

document.getElementById("grid-region-picker").addEventListener("change", (e) => pingElectricityMaps(e.target.value));
pingElectricityMaps(document.getElementById("grid-region-picker").value);

document.getElementById("policy-form").onsubmit = function(e) {
    e.preventDefault();

    const policyInputs = ['pol-energy', 'pol-nature', 'pol-food', 'pol-transit', 'pol-waste'];
    let totalImpact = 0;

    for (let x of policyInputs) {
        totalImpact += parseInt(document.getElementById(x).value, 10);
    }

    addDoc(collection(db, 'simulatorScores'), {
        score: totalImpact,
        date: serverTimestamp()
    });

    const feedbackEl = document.getElementById("snarky-feedback");
    let reactionEmoji = "";
    let themeHex = "";
    let rawScore = totalImpact;

    if (totalImpact < 0) {
        reactionEmoji = "🛸";
        themeHex = "var(--purple)";
        rawScore = "ERROR: 999";
        totalImpact = 100;
        feedbackEl.innerText = "🌌 WAIT WHAT. You unlocked alien teleportation technology! Carbon emissions dropped to zero. You solved climate change with sci-fi.";
        feedbackEl.style.color = themeHex;
    } else if (totalImpact > 79) {
        reactionEmoji = "🌍";
        themeHex = "var(--green)";
        feedbackEl.innerText = "🔥 INCREDIBLE! You implemented a true sustainable framework. By shifting to renewables and enforcing a circular economy, we can reach Net-Zero!";
        feedbackEl.style.color = themeHex;
    } else if (totalImpact > 39 && totalImpact < 80) {
        reactionEmoji = "⚠️";
        themeHex = "var(--yellow)";
        feedbackEl.innerText = "🌱 A GOOD START. But half-measures aren't enough. We need systemic shifts in lots of things. Try again!";
        feedbackEl.style.color = themeHex;
    } else {
        reactionEmoji = "❌";
        themeHex = "var(--red)";
        feedbackEl.innerText = "🚨 DISASTER. Continuing the status quo guarantees severe global warming. We need massive policy shifts immediately.";
        feedbackEl.style.color = themeHex;
    }

    document.getElementById("verdict-emoji").innerText = reactionEmoji;
    document.getElementById("policy-form").style.display = 'none';
    document.getElementById("dossier-panel").style.display = 'block';

    const scoreUi = document.getElementById("final-score-val");
    scoreUi.innerText = "0";

    if (rawScore === "ERROR: 999") {
        scoreUi.innerText = rawScore;
        scoreUi.classList.add("glitch-text");
    } else {
        let ticker = 0;
        function rollNumbers() {
            ticker += Math.max(1, Math.floor(totalImpact / 30));
            if (ticker >= totalImpact) {
                scoreUi.innerText = totalImpact;
            } else {
                scoreUi.innerText = ticker;
                requestAnimationFrame(rollNumbers);
            }
        }
        requestAnimationFrame(rollNumbers);
    }

    setTimeout(() => {
        document.getElementById("score-progress").style.width = `${totalImpact}%`;
        document.getElementById("score-progress").style.backgroundColor = themeHex;
    }, 150);
};

onSnapshot(query(collection(db, "listedItems"), orderBy("timestamp", "desc")), (liveSnapshot) => {
    const feed = document.getElementById('market-feed');
    const gloryList = document.getElementById('hall-of-fame');

    let activeHtml = "";
    let deadHtml = "";
    let activeLoot = 0;
    let claimedLoot = 0;

    for (let i = 0; i < liveSnapshot.docs.length; i++) {
        const row = liveSnapshot.docs[i];
        const itemPayload = row.data();
        const lootId = row.id;

        const safeName = nukeTags(itemPayload.name);
        const safeClaimer = nukeTags(itemPayload.claimedBy);
        const safeLister = nukeTags(itemPayload.lister);
        const safeDesc = nukeTags(itemPayload.description);
        const safeIcon = nukeTags(itemPayload.icon);

        if (itemPayload.status === "claimed") {
            claimedLoot++;
            deadHtml += `<li>✅ <strong>${safeName}</strong> was snagged by ${safeClaimer}!</li>`;
        } else {
            activeLoot++;
            activeHtml += `
                <div class='item-card neo-border hover-lift' id='loot-${lootId}'>
                    <div class='card-icon'>${safeIcon}</div>
                    <h3>${safeName}</h3>
                    <p class='lister-name mono-text'>Listed by: <span>${safeLister}</span></p>
                    <p>${safeDesc}</p>
                    <button class='grab-btn brutal-btn' id='grab-${lootId}' onclick='claimSwag("${lootId}")'>CLAIM FOR FREE ⚡</button>
                </div>`;
        }
    }

    feed.innerHTML = activeLoot === 0
        ? "<h3 style='width:100%;text-align:center;color:var(--green);' class='blink-text'>No items available right now. Be the first to list something!</h3>"
        : activeHtml;

    gloryList.innerHTML = claimedLoot === 0
        ? "<li class='empty-state'>No items claimed yet... be the first!</li>"
        : deadHtml;

    const savedKilos = (claimedLoot * 4.5).toFixed(1);
    document.getElementById('trash-saved-count').innerHTML = `${claimedLoot}<div style='font-size: 0.35em; color: var(--yellow); text-shadow: 0 0 10px rgba(255,230,0,0.5); margin-top: 12px; font-family: monospace; letter-spacing: 0px;'>~${savedKilos} kg CO₂ saved!</div>`;
});

document.getElementById('new-loot-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = document.querySelector(".post-btn");

    const ogText = btn.innerText;
    btn.innerText = "UPLOADING...";

    addDoc(collection(db, "listedItems"), {
        name: document.getElementById('swag-title').value,
        icon: document.getElementById('swag-icon').value,
        lister: document.getElementById('donor-name').value,
        description: document.getElementById('swag-condition').value,
        status: "available",
        timestamp: serverTimestamp()
    }).then(() => {
        if (document.getElementById('swag-icon').value === "🛸") {
            alert("Wait, where did you find Alien Tech?! 👽 It's live on the board!");
        } else {
            alert("It's live on the board!");
        }

        document.getElementById('new-loot-form').reset();
        btn.innerText = ogText;
    }).catch(() => {
        alert("Network error. Try again.");
        btn.innerText = ogText;
    });
});

// Inline bindings for HTML onClick events
window.claimSwag = function(lootId) {
    const username = prompt("♻️ Awesome! Enter your name & class so the owner knows who to give it to:");
    if (!username) return;

    const grabBtn = document.getElementById(`grab-${lootId}`);
    grabBtn.innerText = "CLAIMED!";
    grabBtn.style.background = "var(--green)";
    grabBtn.style.color = "#000";
    grabBtn.disabled = true;

    setTimeout(() => {
        updateDoc(doc(db, "listedItems", lootId), {
            status: "claimed",
            claimedBy: username
        }).catch(() => {
            alert("🚨 Couldn't connect to server. Check your connection/VPN.");
            grabBtn.innerText = "CLAIM FOR FREE ⚡";
            grabBtn.style.background = "";
            grabBtn.style.color = "";
            grabBtn.disabled = false;
        });
    }, 800);
};

window.resetDossier = () => {
    document.getElementById("policy-form").reset();
    document.getElementById("final-score-val").innerText = "0";
    document.getElementById("final-score-val").className = "glitch-score";
    document.getElementById("score-progress").style.width = "0%";

    document.getElementById("dossier-panel").style.display = "none";
    document.getElementById("policy-form").style.display = "block";
    window.scrollTo({ top: document.getElementById('sim').offsetTop, behavior: 'smooth' });
};

window.triggerVictory = function() {
    document.body.classList.add("winner-mode");
    const banner = document.createElement('div');
    banner.className = 'victory-banner';
    banner.innerHTML = '<h1 style="font-family: \'Orbitron\', sans-serif; font-size: 5rem; color: #fff; text-shadow: 10px 10px 0px var(--orange);">HACKATHON WINNERS! 🏆</h1>';
    document.body.appendChild(banner);

    setTimeout(() => {
        banner.remove();
        document.body.classList.remove("winner-mode");
    }, 5000);
};
