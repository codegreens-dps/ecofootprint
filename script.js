// TODO: move off cdn imports before prod
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { 
    getFirestore, collection, addDoc, onSnapshot, 
    query, orderBy, updateDoc, doc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* DO NOT TOUCH THE CONFIG OR THE DB EXPLODES */
const conf = {apiKey:"AIzaSyBNO8SiOBW49CqL7YgHd572pF9mikE7ABo",authDomain:"ecofootprint-9c4ed.firebaseapp.com",
projectId:"ecofootprint-9c4ed",storageBucket:"ecofootprint-9c4ed.firebasestorage.app",messagingSenderId:"425267033599",
appId:"1:425267033599:web:3554770c24a204594ba3ca",measurementId:"G-NCNFZTHKS4"};
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
const k_seq = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a']; 
let k_idx = 0;

document.addEventListener('keydown', (e) => {
    const pk = e.key.toLowerCase();
    
    if (pk === k_seq[k_idx]) {
        k_idx++;
        console.log(`[SYS] Konami sequence: ${k_idx}/${k_seq.length}`);
        
        if (k_idx === k_seq.length) {
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
        const val_ui = document.getElementById("intensityValue");
        const mtr_bar = document.getElementById("intensityMeterFill");
        const stat_txt = document.getElementById("intensityStatus");
        
        // Easter Egg: Mars Colony Alpha
        if (zone === "MARS") {
            if (val_ui) val_ui.innerText = "-42";
            if (mtr_bar) { mtr_bar.style.width = "100%"; mtr_bar.style.backgroundColor = "#ff4500"; }
            if (stat_txt) { stat_txt.innerText = "Elon approves. 100% Nuclear/Solar. 🚀"; stat_txt.style.color = "#ff4500"; }
            return;
        }

        if (val_ui) val_ui.innerText = "Loading..."; 
        if (mtr_bar) mtr_bar.style.width = "0%";
        if (stat_txt) { stat_txt.innerText = "Checking grid health..."; stat_txt.style.color = "var(--text-color)"; }

        try {
            const res = await fetch(`./data/${zone}.json`, { method: "GET" });
            if (!res.ok) throw new Error(`Resource not synchronized. Status: ${res.status}`);
            
            const data = await res.json();
            
            if (data?.carbonIntensity !== undefined) {
                const int_val = data.carbonIntensity; 
                if (val_ui) val_ui.innerText = int_val;
                
                if (mtr_bar && stat_txt) {
                    // doing this manually cuz Math.min was being weird in testing
                    let pct = (int_val / 800) * 100;
                    if (pct > 100) {
                        pct = 100;
                    }

                    requestAnimationFrame(() => {
                        mtr_bar.style.width = `${pct}%`;
                        
                        if (int_val < 250) { 
                            mtr_bar.style.backgroundColor = "var(--green)"; 
                            stat_txt.innerText = "Grid is looking clean today! 🌿"; 
                            stat_txt.style.color = "var(--green)"; 
                        } else if (int_val < 550) { 
                            mtr_bar.style.backgroundColor = "var(--yellow)"; 
                            stat_txt.innerText = "Moderate emissions. Meh. 🤷‍♂️"; 
                            stat_txt.style.color = "var(--yellow)"; 
                        } else { 
                            mtr_bar.style.backgroundColor = "var(--red)"; 
                            stat_txt.innerText = "Grid is literally coughing smog. 🏭"; 
                            stat_txt.style.color = "var(--red)"; 
                        }
                    });
                }
            }
        } catch (err) {
            console.error("[🚨] Static fetch system exception:", err.message);
            if (val_ui) val_ui.innerText = "N/A";
            if (stat_txt) { stat_txt.innerText = "Sync failure on cloud assets 💀"; stat_txt.style.color = "var(--red)"; }
        }
    };

    const reg_dd = document.getElementById("regionSelect");
    if (reg_dd) { 
        reg_dd.addEventListener("change", (e) => fetch_carbon(e.target.value)); 
        fetch_carbon(reg_dd.value); 
    }

    const sim_form = document.getElementById("footprintForm");
    if (sim_form) {
        sim_form.onsubmit = async (e) => {
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
                score: tot_score, date: serverTimestamp() 
            }).catch(err => console.error("[🚨] DB Write Error:", err));

            const fb_el = document.getElementById("feedbackText");
            let emj = "", col = "", disp_sc = tot_score;

            // EASTER EGG: Teleportation
            if (tot_score < 0) {
                emj = "🛸"; col = "var(--purple)"; disp_sc = "ERROR: 999"; tot_score = 100;
                fb_el.innerText = "🌌 WAIT WHAT. You unlocked alien teleportation technology! Carbon emissions dropped to zero. You solved climate change with sci-fi."; 
                fb_el.style.color = "var(--purple)";
            } else if (tot_score > 79) {
                emj = "🌍"; col = "var(--green)"; 
                fb_el.innerText = "🔥 INCREDIBLE! You implemented a true sustainable framework. By shifting to renewables and enforcing a circular economy, we can reach Net-Zero!"; 
                fb_el.style.color = "var(--green)";
            } else if (tot_score > 39 && tot_score < 80) {
                emj = "⚠️"; col = "var(--yellow)"; 
                fb_el.innerText = "🌱 A GOOD START. But half-measures aren't enough. We need systemic shifts in lots of things. Try again!"; 
                fb_el.style.color = "var(--yellow)";
            } else {
                emj = "❌"; col = "var(--red)"; 
                fb_el.innerText = "🚨 DISASTER. Continuing the status quo guarantees severe global warming. We need massive policy shifts immediately."; 
                fb_el.style.color = "var(--red)";
            }

            document.getElementById("resultEmoji").innerText = emj; 
            sim_form.style.display = 'none'; 
            document.getElementById("resultBox").style.display = 'block';
            
            const score_ui = document.getElementById("scoreText");
            score_ui.innerText = "0";

            if (disp_sc === "ERROR: 999") {
                score_ui.innerText = disp_sc; 
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
                const bar_f = document.getElementById("barFill");
                if (bar_f) {
                    bar_f.style.width = `${tot_score}%`; 
                    bar_f.style.backgroundColor = col; 
                }
            }, 150); 
        };
    }

    // fix this later if it scales - doing a raw dump is bad
    const q = query(collection(db, "listedItems"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snap) => {
        const b_ui = document.getElementById('live-board');
        const l_ui = document.getElementById('claimed-list');
        if (!b_ui || !l_ui) return;

        // build string first, dom thrashing is a sin
        let b_html = "", l_html = "";
        let i_c = 0, c_c = 0;

        snap.forEach((d) => {
            const o = d.data();
            const iid = d.id;
            const n1 = cln(o.name), c2 = cln(o.claimedBy), l3 = cln(o.lister), d4 = cln(o.description);
            const icn = cln(o.icon);

            if (o.status === "claimed") { 
                c_c++; 
                l_html += `<li>✅ <strong>${n1}</strong> was snagged by ${c2}!</li>`; 
            } else { 
                i_c++; 
                b_html += `
                    <div class='item-card neo-border hover-lift' id='card-${iid}'>
                        <div class='card-icon'>${icn}</div>
                        <h3>${n1}</h3>
                        <p class='lister-name mono-text'>Listed by: <span>${l3}</span></p>
                        <p>${d4}</p>
                        <button class='grab-btn brutal-btn' id='btn-${iid}' onclick='claimIt("${iid}")'>CLAIM FOR FREE ⚡</button>
                    </div>`; 
            }
        });

        requestAnimationFrame(() => {
            b_ui.innerHTML = i_c === 0 ? "<h3 style='width:100%;text-align:center;color:var(--green);' class='blink-text'>No items available right now. Be the first to list something!</h3>" : b_html;
            l_ui.innerHTML = c_c === 0 ? "<li class='empty-state'>No items claimed yet... be the first!</li>" : l_html;

            // fake gamification math
            const el = document.getElementById('landfillCounter'); 
            if (el) {
                const co2_saved = (c_c * 4.5).toFixed(1); 
                el.innerHTML = `${c_c}<div style='font-size: 0.35em; color: var(--yellow); text-shadow: 0 0 10px rgba(255,230,0,0.5); margin-top: 12px; font-family: monospace; letter-spacing: 0px;'>~${co2_saved} kg CO₂ saved!</div>`;
            }
        });
    });

    const add_frm = document.getElementById('addItemForm');
    if (add_frm) {
        add_frm.onsubmit = (ev) => {
            ev.preventDefault(); 
            const btn = document.querySelector(".post-btn");
            if(!btn) return;
            
            const orig_txt = btn.innerText; 
            btn.innerText = "UPLOADING..."; 
            
            const itm_n = document.getElementById('newItemName').value;
            const itm_i = document.getElementById('newItemIcon').value;
            const itm_l = document.getElementById('newListerName').value;
            const itm_d = document.getElementById('newItemDesc').value;

            addDoc(collection(db, "listedItems"), { 
                name: itm_n, icon: itm_i, lister: itm_l, description: itm_d, status: "available", timestamp: serverTimestamp() 
            }).then(() => {
                if (itm_i === "🛸") alert("Wait, where did you find Alien Tech?! 👽 It's live on the board!"); 
                else alert("It's live on the board! (unless the wifi blocked it)");
                
                add_frm.reset(); 
                btn.innerText = orig_txt;
            }).catch((err) => { 
                console.error(err); 
                alert("Network error bro, our school blocklist probably blocked firebase again smh"); 
                btn.innerText = orig_txt; 
            });
        };
    }
}); 

window.claimIt = (id) => {
    const u_name = prompt("♻️ Awesome! Enter your name & class so the owner knows who to give it to:"); 
    if (!u_name) return; 
    
    const c_btn = document.getElementById(`btn-${id}`);
    if (c_btn) { 
        c_btn.innerText = "CLAIMED!"; 
        c_btn.style.background = "var(--green)"; 
        c_btn.style.color = "#000"; 
        c_btn.disabled = true; 
    }

    setTimeout(() => {
        updateDoc(doc(db, "listedItems", id), { 
            status: "claimed", claimedBy: u_name 
        }).catch((e) => {
            console.error(e); 
            alert("🚨 ERROR: Couldn't connect to server! Try turning off your VPN maybe?");
            if (c_btn) { 
                c_btn.innerText = "CLAIM FOR FREE ⚡"; 
                c_btn.style.background = ""; 
                c_btn.style.color = ""; 
                c_btn.disabled = false; 
            }
        });
    }, 800);
};

window.resetQuiz = () => {
    const frm = document.getElementById("footprintForm");
    if(frm) frm.reset();
    
    const st = document.getElementById("scoreText");
    if(st) {
        st.innerText = "0"; 
        st.className = "glitch-score";
    }
    
    const bf = document.getElementById("barFill");
    if(bf) bf.style.width = "0%";
    
    const rb = document.getElementById("resultBox");
    if(rb) rb.style.display = "none";
    
    if(frm) frm.style.display = "block"; 
    
    const sim_el = document.getElementById('sim');
    if (sim_el) window.scrollTo({ top: sim_el.offsetTop, behavior: 'smooth' }); 
};

window.activateWinnerProtocol = () => {
    document.body.classList.add("winner-mode");
    
    const vic_div = document.createElement('div'); 
    vic_div.className = 'victory-banner';
    vic_div.innerHTML = '<h1 style="font-family: \'Orbitron\', sans-serif; font-size: 5rem; color: #fff; text-shadow: 10px 10px 0px var(--orange);">HACKATHON WINNERS! 🏆</h1>'; 
    document.body.appendChild(vic_div);
    
    setTimeout(() => { 
        if (vic_div.parentNode) vic_div.remove(); 
        document.body.classList.remove("winner-mode"); 
    }, 5000);
    console.log("[SYS] Judges: 'Wow, such clean code.'");
};

window.printReport = () => window.print();
