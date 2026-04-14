document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // 1. CONFIGURATION & LINKS
    // ==========================================
    const RSVP_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSccAH2fU-1i9wQ_lzV3SzBunerhPGaNpC1BYkvR12lo9LNqpQ/formResponse";
    const UCAPAN_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSegChyvdI9HAHWUHmQa1wMFqwlfw8swzQh58L_23uR0_IpUvQ/formResponse";
    
    const RSVP_SHEET_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRJOFur4mBgN40alI1bjQab2NY_NiEMFidveCCSZlJK8zAviOrwJ_Ib5T0bIXpLKQLBg1z0uXIGhqg4/pub?gid=1586273330&single=true&output=csv";
    const UCAPAN_SHEET_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRJOFur4mBgN40alI1bjQab2NY_NiEMFidveCCSZlJK8zAviOrwJ_Ib5T0bIXpLKQLBg1z0uXIGhqg4/pub?gid=994849928&single=true&output=csv";

    // ==========================================
    // 2. AUDIO & DOOR ANIMATION
    // ==========================================
    const openBtn = document.getElementById('open-btn');
    const doorOverlay = document.getElementById('door-overlay');
    const bgMusic = document.getElementById('bg-music');
    const musicToggle = document.getElementById('music-toggle');
    let isPlaying = false;

    function fadeInAudio(audioElement, duration) {
        audioElement.volume = 0;
        audioElement.play().then(() => {
            isPlaying = true;
            musicToggle.classList.remove('hidden');
            let currentVolume = 0;
            const targetVolume = 1;
            const intervalTime = 50;
            const volumeStep = targetVolume / (duration / intervalTime);

            const fadeInterval = setInterval(() => {
                if (currentVolume < targetVolume) {
                    currentVolume += volumeStep;
                    audioElement.volume = Math.min(1, currentVolume);
                } else {
                    clearInterval(fadeInterval);
                }
            }, intervalTime);
        }).catch(e => console.log("Audio play failed:", e));
    }

    if (openBtn && doorOverlay) {
        openBtn.addEventListener('click', function () {
            doorOverlay.classList.add('door-open');
            document.body.classList.remove('locked');
            if (bgMusic) {
                fadeInAudio(bgMusic, 2000);
            }
            setTimeout(() => {
                doorOverlay.style.display = 'none';
            }, 1500);
        });
    }

    if (musicToggle && bgMusic) {
        musicToggle.addEventListener('click', function () {
            if (isPlaying) {
                bgMusic.pause();
                musicToggle.innerHTML = "🔇";
            } else {
                bgMusic.play();
                musicToggle.innerHTML = "🔊";
            }
            isPlaying = !isPlaying;
        });
    }

    // ==========================================
    // 3. MODAL CONTROLS
    // ==========================================
    window.openModal = function (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
        }
    };

    window.closeModal = function (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    };

    // Close modal when clicking outside content
    window.onclick = function (event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };

    // ==========================================
    // 4. DATA FETCHING (STATS & WISHES) - IMPROVED
    // ==========================================
    async function updateGuestStatsAndWishes() {
        try {
            // Helper function to parse CSV robustly handling newlines inside quotes
            function parseCSV(text) {
                const rows = [];
                let currentRow = [];
                let currentCell = '';
                let inQuotes = false;

                for (let i = 0; i < text.length; i++) {
                    const char = text[i];
                    const nextChar = text[i + 1];

                    if (char === '"' && inQuotes && nextChar === '"') {
                        currentCell += '"';
                        i++;
                    } else if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        currentRow.push(currentCell);
                        currentCell = '';
                    } else if (char === '\n' && !inQuotes) {
                        currentRow.push(currentCell);
                        rows.push(currentRow);
                        currentRow = [];
                        currentCell = '';
                    } else if (char === '\r' && nextChar === '\n' && !inQuotes) {
                        currentRow.push(currentCell);
                        rows.push(currentRow);
                        currentRow = [];
                        currentCell = '';
                        i++;
                    } else {
                        currentCell += char;
                    }
                }
                
                if (currentCell !== '' || currentRow.length > 0) {
                    currentRow.push(currentCell);
                    rows.push(currentRow);
                }
                
                return rows;
            }

            // --- Fetch RSVP Stats ---
            const rsvpResponse = await fetch(RSVP_SHEET_CSV);
            const rsvpText = await rsvpResponse.text();
            const rsvpData = parseCSV(rsvpText).slice(1); // skip header
            
            let countHadir = 0;
            let countTidakHadir = 0;

            rsvpData.forEach(cols => {
                if (cols.length >= 3) {
                    const status = cols[2].trim();
                    const paxValue = cols[3] ? cols[3].trim() : "1";
                    const pax = parseInt(paxValue) || 0;
                    
                    if (status.toLowerCase() === "hadir") {
                        countHadir += pax;
                    } else if (status.toLowerCase().includes("tidak")) {
                        countTidakHadir++;
                    }
                }
            });

            document.getElementById('total-hadir').innerText = countHadir;
            document.getElementById('total-tidak-hadir').innerText = countTidakHadir;

            // --- Fetch Wishes (Ucapan) ---
            const wishesResponse = await fetch(UCAPAN_SHEET_CSV);
            const wishesText = await wishesResponse.text();
            const wishesData = parseCSV(wishesText).slice(1).filter(cols => cols.length >= 3).reverse();

            const wishesContainer = document.getElementById('wishes-container');
            wishesContainer.innerHTML = '';
            
            let hasValidWish = false;

            wishesData.forEach(cols => {
                const name = cols[1].trim();
                const message = cols[2].trim();
                
                if (name && message) {
                    hasValidWish = true;
                    const wishItem = document.createElement('div');
                    wishItem.className = 'comment-item';
                    
                    // Replace newlines with <br> for HTML rendering
                    const formattedMessage = message.replace(/\n/g, '<br>');

                    wishItem.innerHTML = `
                        <div class="comment-header">
                            <div class="profile-icon"><span>${name.charAt(0).toUpperCase()}</span></div>
                            <div class="comment-details">
                                <p class="wish-author">${name}</p>
                            </div>
                        </div>
                        <p class="wish-text">${formattedMessage}</p>
                    `;
                    wishesContainer.appendChild(wishItem);
                }
            });

            // If no valid wishes were found in the sheet, show a placeholder
            if (!hasValidWish) {
                wishesContainer.innerHTML = '<div class="comment-item" style="text-align: center; justify-content: center; background: transparent; box-shadow: none;"><p class="wish-text" style="font-style: italic; opacity: 0.7;">Be the first to leave a wish!</p></div>';
            }
        } catch (error) {
            console.error("Error loading sheet data:", error);
        }
    }

    // Load initial data
    updateGuestStatsAndWishes();

    // ==========================================
    // 5. FORM SUBMISSIONS (GOOGLE FORMS)
    // ==========================================
    const rsvpForm = document.getElementById('rsvp-form');
    if (rsvpForm) {
        rsvpForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const btn = document.getElementById('rsvp-btn');
            btn.innerText = "Menghantar...";
            btn.disabled = true;

            const formData = new FormData(rsvpForm);
            fetch(RSVP_FORM_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: formData
            }).then(() => {
                alert("Terima kasih! RSVP anda telah berjaya dihantar.");
                rsvpForm.reset();
                btn.innerText = "Hantar RSVP";
                btn.disabled = false;
                closeModal('modal-rsvp');
                setTimeout(updateGuestStatsAndWishes, 2000); // Refresh data
            }).catch(err => {
                alert("Ralat berlaku. Sila cuba lagi.");
                btn.disabled = false;
            });
        });
    }

    const wishForm = document.getElementById('wish-form');
    if (wishForm) {
        wishForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const btn = document.getElementById('wish-btn');
            btn.innerText = "Menghantar...";
            btn.disabled = true;

            const formData = new FormData(wishForm);
            fetch(UCAPAN_FORM_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: formData
            }).then(() => {
                alert("Ucapan anda telah diterima! Terima kasih.");
                wishForm.reset();
                btn.innerText = "Hantar Ucapan";
                btn.disabled = false;
                closeModal('modal-ucapan');
                setTimeout(updateGuestStatsAndWishes, 2000); // Refresh data
            }).catch(err => {
                alert("Ralat berlaku. Sila cuba lagi.");
                btn.disabled = false;
            });
        });
    }

    // ==========================================
    // 7. COUNTDOWN TIMER
    // ==========================================
    const weddingDate = new Date("April 26, 2026 11:30:00").getTime();

    const timerInterval = setInterval(function () {
        const now = new Date().getTime();
        const distance = weddingDate - now;

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById("days").innerHTML = days.toString().padStart(2, '0');
        document.getElementById("hours").innerHTML = hours.toString().padStart(2, '0');
        document.getElementById("minutes").innerHTML = minutes.toString().padStart(2, '0');
        document.getElementById("seconds").innerHTML = seconds.toString().padStart(2, '0');

        if (distance < 0) {
            clearInterval(timerInterval);
            document.getElementById("countdown").innerHTML = "SELAMAT PENGANTIN BARU!";
        }
    }, 1000);

    // ==========================================
    // 8. SCROLL ANIMATIONS
    // ==========================================
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(section => {
        observer.observe(section);
    });

    // ==========================================
    // 9. ICS CALENDAR DOWNLOAD
    // ==========================================
    window.downloadICS = function() {
        const icsData = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "BEGIN:VEVENT",
            "DTSTART:20260426T033000Z",
            "DTEND:20260426T080000Z",
            "SUMMARY:Walimatul Urus Faridah & Adam",
            "DESCRIPTION:Majlis Perkahwinan Teh Faridah & Adam Safwan",
            "LOCATION:No 147, Kg. Sg. Star, 34140 Rantau Panjang, Selama, Perak",
            "END:VEVENT",
            "END:VCALENDAR"
        ].join("\n");

        const blob = new Blob([icsData], { type: "text/calendar" });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "Wedding_Faridah_Adam.ics";
        anchor.click();
        window.URL.revokeObjectURL(url);
    };

    // ==========================================
    // 10. RANDOM FALLING PARTICLES (NO SCROLL REQUIRED)
    // ==========================================
    function createParticle() {
        const container = document.getElementById('particles-container');
        if (!container) return;

        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Randomly choose between a heart, flower, or sparkle
        const symbols = ['🤍', '🌸', '✨', '💖']; 
        particle.innerText = symbols[Math.floor(Math.random() * symbols.length)];

        // Random horizontal position across the screen width
        particle.style.left = Math.random() * 100 + 'vw';
        
        // Randomize the animation duration so they fall at different speeds (4 to 8 seconds)
        const duration = Math.random() * 4 + 4;
        particle.style.animationDuration = duration + 's';
        
        // Randomize the size slightly using font-size so it doesn't break the CSS transform
        particle.style.fontSize = (Math.random() * 1 + 1) + 'rem';

        container.appendChild(particle);

        // Remove the particle from the DOM after its animation finishes to prevent lag
        setTimeout(() => {
            if (particle.parentNode) {
                particle.remove();
            }
        }, duration * 1000);
    }

    // Generate particles at random continuous intervals
    function randomParticleLoop() {
        createParticle();
        // Create a new particle every 300ms to 900ms randomly
        const randomDelay = Math.random() * 600 + 300; 
        setTimeout(randomParticleLoop, randomDelay);
    }

    // Start the falling effect immediately when the page loads
    randomParticleLoop();

});
