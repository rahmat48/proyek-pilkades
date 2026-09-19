import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, runTransaction, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAp-mbK180U-v6LrHMach0rqjBW-fDjaPo",
    authDomain: "pilkades-2027.firebaseapp.com",
    databaseURL: "https://pilkades-2027-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "pilkades-2027",
    storageBucket: "pilkades-2027.firebasestorage.app",
    messagingSenderId: "915113371581",
    appId: "1:915113371581:web:554b0efb42ec3e8eef14d4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const suaraRef = ref(db, 'SUARA');
const pengumumanRef = ref(db, 'Pengumuman');

const computeSuratMasuk = (data = {}) => {
    return (Number(data.A) || 0) + (Number(data.B) || 0) + (Number(data.Rusak) || 0);
};

const THEME_KEY = 'pilkades-theme';

const applyTheme = (theme) => {
    const isLight = theme === 'light';
    document.body.classList.toggle('light-theme', isLight);
    document.body.classList.toggle('dark-theme', !isLight);

    document.querySelectorAll('.theme-toggle').forEach((button) => {
        button.setAttribute('title', isLight ? 'Mode Gelap' : 'Mode Terang');
        button.innerHTML = isLight ? '☾' : '☀';
    });
};

const defaultTheme = document.getElementById('display-page') ? 'light' : 'dark';
const savedTheme = localStorage.getItem(THEME_KEY) || defaultTheme;
applyTheme(savedTheme);

document.querySelectorAll('.theme-toggle').forEach((button) => {
    button.addEventListener('click', () => {
        const nextTheme = document.body.classList.contains('light-theme') ? 'dark' : 'light';
        localStorage.setItem(THEME_KEY, nextTheme);
        applyTheme(nextTheme);
    });
});

const pulseElement = (elementId) => {
    const el = document.getElementById(elementId);
    if (!el) return;

    el.classList.remove('count-pulse');
    void el.offsetWidth;
    el.classList.add('count-pulse');

    setTimeout(() => el.classList.remove('count-pulse'), 350);
};

// --- DISPLAY LOGIC (index.html) ---
if (document.getElementById('display-page')) {
    const announcementBar = document.querySelector('.announcement-bar');
    const announcementText = document.getElementById('announcementText');

    const hideAnnouncement = () => {
        if (!announcementBar) return;
        announcementBar.classList.add('hidden');
    };

    const showAnnouncement = (text) => {
        if (!announcementBar || !announcementText) return;

        announcementBar.classList.remove('hidden');
        announcementText.innerText = text;

        clearTimeout(window.announcementTimer);
        window.announcementTimer = setTimeout(() => {
            hideAnnouncement();
        }, 30000);
    };

    onValue(pengumumanRef, (snapshot) => {
        const text = snapshot.val() || '';

        if (!text || !text.trim()) {
            hideAnnouncement();
            return;
        }

        showAnnouncement(text.trim());
    });

    onValue(suaraRef, (snapshot) => {
        const data = snapshot.val() || { A: 0, B: 0, Rusak: 0, surat_suara_masuk: 0 };
        
        // Update angka
        const totalSuratMasuk = computeSuratMasuk(data);
        document.getElementById('total').innerText = totalSuratMasuk;
        document.getElementById('suaraA').innerText = Number(data.A) || 0;
        document.getElementById('suaraB').innerText = Number(data.B) || 0;
        document.getElementById('suaraRusak').innerText = Number(data.Rusak) || 0;

        pulseElement('total');
        pulseElement('suaraA');
        pulseElement('suaraB');
        pulseElement('suaraRusak');

        // Hitung persentase & Progress bar
        const totalSah = (Number(data.A) || 0) + (Number(data.B) || 0);
        let pctA = 0, pctB = 0;
        
        if (totalSah > 0) {
            pctA = ((data.A / totalSah) * 100).toFixed(1);
            pctB = ((data.B / totalSah) * 100).toFixed(1);
        }

        document.getElementById('pctA').innerText = pctA + '%';
        document.getElementById('pctB').innerText = pctB + '%';
        
        document.getElementById('barA').style.width = pctA + '%';
        document.getElementById('barB').style.width = pctB + '%';
    });
}

// --- ADMIN LOGIC (admin.html) ---
if (document.getElementById('admin-page')) {
    const loginSection = document.getElementById('loginSection');
    const adminPanel = document.getElementById('adminPanel');
    const btnLogout = document.getElementById('btnLogout');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const announcementForm = document.getElementById('announcementForm');
    const announcementInput = document.getElementById('announcementInput');
    const announcementStatus = document.getElementById('announcementStatus');
    const announcementSubmit = announcementForm?.querySelector('button[type="submit"]');
    const announcementModal = document.getElementById('announcementModal');
    const btnOpenAnnouncement = document.getElementById('btnOpenAnnouncement');
    const btnCloseAnnouncement = document.getElementById('btnCloseAnnouncement');
    const resetModal = document.getElementById('resetModal');
    const closeResetModal = () => resetModal?.classList.add('hidden');

    if (btnOpenAnnouncement) {
        btnOpenAnnouncement.innerHTML = '<i class="fa-solid fa-bullhorn" aria-hidden="true"></i>';
    }

    const closeAnnouncementModal = () => {
        announcementModal?.classList.add('hidden');
    };

    btnOpenAnnouncement?.addEventListener('click', () => {
        announcementModal?.classList.remove('hidden');
        announcementInput?.focus();
    });

    btnCloseAnnouncement?.addEventListener('click', closeAnnouncementModal);
    announcementModal?.querySelector('[data-close-announcement]')?.addEventListener('click', closeAnnouncementModal);
    document.getElementById('btnCloseReset')?.addEventListener('click', closeResetModal);
    document.getElementById('btnCancelReset')?.addEventListener('click', closeResetModal);
    resetModal?.querySelector('[data-close-reset]')?.addEventListener('click', closeResetModal);

    onValue(pengumumanRef, (snapshot) => {
        const text = snapshot.val() || '';
        if (announcementInput) {
            announcementInput.value = text;
        }
    });

    // Auth State Listener
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loginSection.classList.add('hidden');
            adminPanel.classList.remove('hidden');
            btnLogout.classList.remove('hidden');
            
            // Listen realtime for admin panel
            onValue(suaraRef, (snapshot) => {
                const data = snapshot.val() || { A: 0, B: 0, Rusak: 0, surat_suara_masuk: 0 };
                document.getElementById('adminTotal').innerText = computeSuratMasuk(data);
                document.getElementById('adminA').innerText = Number(data.A) || 0;
                document.getElementById('adminB').innerText = Number(data.B) || 0;
                document.getElementById('adminRusak').innerText = Number(data.Rusak) || 0;
            });
        } else {
            loginSection.classList.remove('hidden');
            adminPanel.classList.add('hidden');
            btnLogout.classList.add('hidden');
        }
    });

    // Login Form Submit
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        signInWithEmailAndPassword(auth, email, password)
            .catch((error) => {
                loginError.innerText = "Login gagal: " + error.message;
            });
    });

    // Logout
    btnLogout.addEventListener('click', () => {
        signOut(auth);
    });

    announcementForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = (announcementInput.value || '').trim();
        if (!message) {
            announcementStatus.innerText = 'Isi pengumuman terlebih dahulu.';
            announcementStatus.className = 'form-status error';
            return;
        }

        announcementSubmit.disabled = true;
        announcementStatus.innerText = 'Menyimpan pengumuman...';
        announcementStatus.className = 'form-status';

        set(pengumumanRef, message)
            .then(() => {
                announcementStatus.innerText = 'Pengumuman berhasil disimpan.';
                announcementStatus.className = 'form-status success';
                closeAnnouncementModal();
            })
            .catch((error) => {
                announcementStatus.innerText = 'Gagal menyimpan: ' + error.message;
                announcementStatus.className = 'form-status error';
            })
            .finally(() => {
                announcementSubmit.disabled = false;
            });
    });

    // Plus & Minus Buttons with runTransaction to prevent race condition
    const modifyData = (field, delta) => {
        const suaraRootRef = ref(db, 'SUARA');

        runTransaction(suaraRootRef, (currentData) => {
            const data = currentData || { A: 0, B: 0, Rusak: 0, surat_suara_masuk: 0 };

            const currentValue = Number(data[field] || 0);
            data[field] = Math.max(0, currentValue + delta);
            data.surat_suara_masuk = computeSuratMasuk(data);

            return data;
        });
    };

    document.querySelectorAll('.btn-plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            modifyData(e.target.dataset.target, 1);
        });
    });

    document.querySelectorAll('.btn-minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            modifyData(e.target.dataset.target, -1);
        });
    });

    // Reset Button
    document.getElementById('btnReset').addEventListener('click', () => {
        resetModal?.classList.remove('hidden');
    });

    document.getElementById('btnConfirmReset').addEventListener('click', () => {
        set(suaraRef, {
            A: 0,
            B: 0,
            Rusak: 0,
            surat_suara_masuk: 0
        }).then(closeResetModal);
    });
}
