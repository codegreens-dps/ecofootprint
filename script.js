// TODO: move off cdn imports before prod
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { 
    getFirestore, collection, addDoc, onSnapshot, 
    query, orderBy, updateDoc, doc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* DO NOT TOUCH THE CONFIG OR THE DB EXPLODES */
const conf = {apiKey:"AIzaSyBNO8SiOBW49CqL7YgHd572pF9mikE7ABo",authDomain:"ecofootprint-9c4ed.firebaseapp.com",projectId:"ecofootprint-9c4ed",storageBucket:"ecofootprint-9c4ed.firebasestorage.app",messagingSenderId:"425267033599",appId:"1:425267033599:web:3554770c24a204594ba3ca",measurementId:"G-NCNFZTHKS4"};
const fb_app = initializeApp(conf);
const db = getFirestore(fb_app);

// dumb innerHTML hack for xss
const san_node = document.createElement('div');
const cln = (s) => { 
    if(!s) return ""; 
    san_node.textContent = s; 
    return san_node.innerHTML; 
};

// lol konami
const k_code = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a']; 
let k_idx = 0;

document.addEventListener('keydown', (e) => {
    const pk = e.key.toLowerCase();
    
    if (pk === k_code[k_idx]) {
        k_idx++;
        console.log(`[SYS] Konami sequence: ${k_idx}/${k_code.length}`);
        
        if (k_idx === k_code.length) {
            console.log("[SYS] OVERRIDE ACCEPTED. Konami Activated!");
            
            const mod = document.getElementById('konami-modal');
            if (mod) mod.style.display = 'flex';
            document.body.classList.add('winner-mode');
            
            setTimeout(() => {
                document.body.classList.remove('winner-mode');
                if (mod) mod.style.display = 'none';
            }, 5000);
            
            k_idx = 0; 
        }
    } else { k_idx = 0; }
}, { passive: true });

// DOMContentLoaded > onload. users have no patience
window.addEventListener('DOMContentLoaded', () => { 
    
    const fetch_carbon = async (zone) => {
        const val_disp = document.getElementById("intensityValue");
        const mtr_fill = document.getElementById("intensityMeterFill");
        const stat_disp = document.getElementById("intensityStatus");
        
        // Easter Egg: Mars Colony Alpha
        if (zone === "MARS") {
            if (val_disp) val_disp.innerText = "-42";
            if (mtr_fill) { mtr_fill.style.width = "100%"; mtr_fill.style.backgroundColor = "#ff4500"; }
            if (stat_disp) { stat_disp.innerText = "Elon approves. 100% Nuclear/Solar. 🚀"; stat_disp.style.color = "#ff4500"; }
            return;
        }

        if (val_disp) val_disp.innerText = "Loading..."; 
        if (mtr_fill) mtr_fill.style.width = "0%";
        if (stat_disp) { stat_disp.innerText = "Checking grid health..."; stat_disp.style.color = "var(--text-color)"; }

        try {
            const dataUrl = `./data/${zone}.json`;
            const res = await fetch(dataUrl, { method: "GET" });
            
            if (!res.ok) throw new Error(`Resource not synchronized. Status: ${res.status}`);
            
            const data = await res.json();
            
            if (data?.carbonIntensity !== undefined) {
                const intensity = data.carbonIntensity; 
                if (val_disp) val_disp.innerText = intensity;
                
                if (mtr_fill && stat_disp) {
                    // doing this manually cuz Math.min was being weird in testing
                    let pct = (intensity / 800) * 100;
                    if (pct > 100) {
                        pct = 100;
                    }

                    requestAnimationFrame(() => {
                        mtr_fill.style.width = `${pct}%`;
                        
                        if (intensity < 250) { 
                            mtr_fill.style.backgroundColor = "var(--green)"; 
                            stat_disp.innerText = "Grid is looking clean today! 🌿"; 
                            stat_disp.style.color = "var(--green)"; 
                        } else if (intensity < 550) { 
                            mtr_fill.style.backgroundColor = "var(--yellow)"; 
                            stat_disp.innerText = "Moderate emissions. Meh. 🤷‍♂️"; 
                            stat_disp.style.color = "var(--yellow)"; 
                        } else { 
                            mtr_fill.style.backgroundColor = "var(--red)"; 
                            stat_disp.innerText = "Grid is literally coughing smog. 🏭"; 
                            stat_disp.style.color = "var(--red)"; 
                        }
                    });
                }
            }
        } catch (err) {
            console.error("[🚨] Static fetch system exception:", err.message);
            if (val_disp) val_disp.innerText = "N/A";
            if (stat_disp) { stat_disp.innerText = "Sync failure on cloud assets 💀"; stat_disp.style.color = "var(--red)"; }
        }
    };

    const reg_drop = document.getElementById("regionSelect");
    if (reg_drop) { 
        reg_drop.addEventListener("change", (e) => fetch_carbon(e.target.value)); 
        fetch_carbon(reg_drop.value); 
    }

    const ft_form = document.getElementById("footprintForm");
    if (ft_form) {
        ft_form.onsubmit = async (e) => {
            e.preventDefault(); 
            
            // grabbing scores manually bc forms are annoying
            const q_ids = ['q1', 'q2', 'q3', 'q4', 'q5'];
            let tot_score = 0;

            for (let i = 0; i < q_ids.length; i++) {
                let el = document.getElementById(q_ids[i]);
                if (el && el.value) {
                    tot_score += parseInt(el.value, 10);
                }
            }

            // yeet to db
            addDoc(collection(db, 'simulatorScores'), { 
                score: tot_score, 
                date: serverTimestamp() 
            }).catch(err => console.error("[🚨] DB Write Error:", err));

            const fb = document.getElementById("feedbackText");
            let emj = "", col = "", disp_score = tot_score;

            // EASTER EGG: Teleportation
            if (tot_score < 0) {
                emj = "🛸"; col = "var(--purple)"; disp_score = "ERROR: 999"; tot_score = 100;
                fb.innerText = "🌌 WAIT WHAT. You unlocked alien teleportation technology! Carbon emissions dropped to zero. You solved climate change with sci-fi."; 
                fb.style.color = "var(--purple)";
            } else if (tot_score > 79) {
                emj = "🌍"; col = "var(--green)"; 
                fb.innerText = "🔥 INCREDIBLE! You implemented a true sustainable framework. By shifting to renewables and enforcing a circular economy, we can reach Net-Zero!"; 
                fb.style.color = "var(--green)";
            } else if (tot_score > 39 && tot_score < 80) {
                emj = "⚠️"; col = "var(--yellow)"; 
                fb.innerText = "🌱 A GOOD START. But half-measures aren't enough. We need systemic shifts in lots of things. Try again!"; 
                fb.style.color = "var(--yellow)";
            } else {
                emj = "❌"; col = "var(--red)"; 
                fb.innerText = "🚨 DISASTER. Continuing the status quo guarantees severe global warming. We need massive policy shifts immediately."; 
                fb.style.color = "var(--red)";
            }

            document.getElementById("resultEmoji").innerText = emj; 
            document.getElementById('footprintForm').style.display = 'none'; 
            document.getElementById("resultBox").style.display = 'block';
            
            const score_ui = document.getElementById("scoreText");
            score_ui.innerText = "0";

            if (disp_score === "ERROR: 999") {
                score_ui.innerText = disp_score; 
                score_ui.classList.add("glitch-text");
            } else {
                // rAF > setInterval so the browser doesn't choke
                let curr = 0;
                const anim_score = () => {
                    curr += Math.max(1, Math.floor(tot_score / 30)); 
                    if (curr >= tot_score) {
                        score_ui.innerText = tot_score;
                    } else {
                        score_ui.innerText = curr;
                        requestAnimationFrame(anim_score);
                    }
                };
                requestAnimationFrame(anim_score);
            }
            
            setTimeout(() => { 
                const bar_fill = document.getElementById("barFill");
                if (bar_fill) {
                    bar_fill.style.width = `${tot_score}%`; 
                    bar_fill.style.backgroundColor = col; 
                }
            }, 150); 
        };
    }

    // fix this later if it scales - doing a raw dump is bad
    const q = query(collection(db, "listedItems"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
        const b = document.getElementById('live-board');
        const l = document.getElementById('claimed-list');
        if (!b || !l) return;

        // build string first, dom thrashing is a sin
        let b_html = "";
        let l_html = "";
        let i_c = 0, c_c = 0;

        snapshot.forEach((d) => {
            const o = d.data();
            const iid = d.id;
            const n1 = cln(o.name), c2 = cln(o.claimedBy), l3 = cln(o.lister), d4 = cln(o.description);
            const icon = cln(o.icon);

            if (o.status === "claimed") { 
                c_c++; 
                l_html += `<li>✅ <strong>${n1}</strong> was snagged by ${c2}!</li>`; 
            } else { 
                i_c++; 
                b_html += `
                    <div class='item-card neo-border hover-lift' id='card-${iid}'>
                        <div class='card-icon'>${icon}</div>
                        <h3>${n1}</h3>
                        <p class='lister-name mono-text'>Listed by: <span>${l3}</span></p>
                        <p>${d4}</p>
                        <button class='grab-btn brutal-btn' id='btn-${iid}' onclick='claimIt("${iid}")'>CLAIM FOR FREE ⚡</button>
                    </div>`; 
            }
        });

        requestAnimationFrame(() => {
            b.innerHTML = i_c === 0 ? "<h3 style='width:100%;text-align:center;color:var(--green);' class='blink-text'>No items available right now. Be the first to list something!</h3>" : b_html;
            l.innerHTML = c_c === 0 ? "<li class='empty-state'>No items claimed yet... be the first!</li>" : l_html;

            // fake gamification math
            const el = document.getElementById('landfillCounter'); 
            if (el) {
                const co2Saved = (c_c * 4.5).toFixed(1); 
                el.innerHTML = `${c_c}<div style='font-size: 0.35em; color: var(--yellow); text-shadow: 0 0 10px rgba(255,230,0,0.5); margin-top: 12px; font-family: monospace; letter-spacing: 0px;'>~${co2Saved} kg CO₂ saved!</div>`;
            }
        });
    });

    const add_frm = document.getElementById('addItemForm');
    if (add_frm) {
        add_frm.onsubmit = (ev) => {
            ev.preventDefault(); 
            const btn = document.querySelector(".post-btn");
            if(!btn) return;
            
            const txt = btn.innerText; 
            btn.innerText = "UPLOADING..."; 
            
            const n = document.getElementById('newItemName').value;
            const i = document.getElementById('newItemIcon').value;
            const lst = document.getElementById('newListerName').value;
            const desc = document.getElementById('newItemDesc').value;

            addDoc(collection(db, "listedItems"), { 
                name: n, icon: i, lister: lst, description: desc, status: "available", timestamp: serverTimestamp() 
            }).then(() => {
                if (i === "🛸") alert("Wait, where did you find Alien Tech?! 👽 It's live on the board!"); 
                else alert("It's live on the board! (unless the wifi blocked it)");
                
                add_frm.reset(); 
                btn.innerText = txt;
            }).catch((e) => { 
                console.error(e); 
                alert("Network error bro, our school blocklist probably blocked firebase again smh"); 
                btn.innerText = txt; 
            });
        };
    }
}); 

window.claimIt = (id) => {
    const un = prompt("♻️ Awesome! Enter your name & class so the owner knows who to give it to:"); 
    if (!un) return; 
    
    const btn = document.getElementById(`btn-${id}`);
    if (btn) { 
        btn.innerText = "CLAIMED!"; 
        btn.style.background = "var(--green)"; 
        btn.style.color = "#000"; 
        btn.disabled = true; 
    }

    setTimeout(() => {
        updateDoc(doc(db, "listedItems", id), { 
            status: "claimed", claimedBy: un 
        }).catch((e) => {
            console.error(e); 
            alert("🚨 ERROR: Couldn't connect to server! Try turning off your VPN maybe?");
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
    if(form) form.reset();
    
    const st = document.getElementById("scoreText");
    if(st) {
        st.innerText = "0"; 
        st.className = "glitch-score";
    }
    
    const bar = document.getElementById("barFill");
    if(bar) bar.style.width = "0%";
    
    const rb = document.getElementById("resultBox");
    if(rb) rb.style.display = "none";
    
    if(form) form.style.display = "block"; 
    
    const sim = document.getElementById('sim');
    if (sim) window.scrollTo({ top: sim.offsetTop, behavior: 'smooth' }); 
};

window.activateWinnerProtocol = () => {
    document.body.classList.add("winner-mode");
    
    const b = document.createElement('div'); 
    b.className = 'victory-banner';
    b.innerHTML = '<h1 style="font-family: \'Orbitron\', sans-serif; font-size: 5rem; color: #fff; text-shadow: 10px 10px 0px var(--orange);">HACKATHON WINNERS! 🏆</h1>'; 
    document.body.appendChild(b);
    
    setTimeout(() => { 
        if (b.parentNode) b.remove(); 
        document.body.classList.remove("winner-mode"); 
    }, 5000);
    console.log("[SYS] Judges: 'Wow, such clean code.'");
};

window.printReport = () => window.print();
