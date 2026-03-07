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
    // 4. DATA FETCHING (STATS & WISHES)
    // ==========================================
    async function updateGuestStatsAndWishes() {
        try {
            // Fetch RSVP Stats
            const rsvpResponse = await fetch(RSVP_SHEET_CSV);
            const rsvpText = await rsvpResponse.text();
            const rsvpLines = rsvpText.split('\n').slice(1); // Skip header

            let countHadir = 0;
            let countTidakHadir = 0;

            rsvpLines.forEach(line => {
                const cols = line.split(',');
                if (cols.length >= 3) {
                    const status = cols[2].trim();
                    const pax = parseInt(cols[3]) || 0;
                    
                    if (status === "Hadir") {
                        countHadir += pax;
                    } else if (status === "Tidak Hadir") {
                        countTidakHadir++;
                    }
                }
            });

            document.getElementById('total-hadir').innerText = countHadir;
            document.getElementById('total-tidak-hadir').innerText = countTidakHadir;

            // Fetch Wishes
            const wishesResponse = await fetch(UCAPAN_SHEET_CSV);
            const wishesText = await wishesResponse.text();
            const wishesLines = wishesText.split('\n').slice(1).reverse(); // Newest first

            const wishesContainer = document.getElementById('wishes-container');
            wishesContainer.innerHTML = '';

            wishesLines.forEach(line => {
                const cols = line.split(',');
                if (cols.length >= 3) {
                    const name = cols[1].replace(/"/g, '').trim();
                    const message = cols[2].replace(/"/g, '').trim();
                    
                    if (name && message) {
                        const wishItem = document.createElement('div');
                        wishItem.className = 'comment-item';
                        wishItem.innerHTML = `
                            <div class="comment-header">
                                <div class="profile-icon"><span>${name.charAt(0).toUpperCase()}</span></div>
                                <div class="comment-details">
                                    <p class="wish-author">${name}</p>
                                </div>
                            </div>
                            <p class="wish-text">${message}</p>
                        `;
                        wishesContainer.appendChild(wishItem);
                    }
                }
            });
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
                setTimeout(updateGuestStatsAndWishes, 2000); // Refresh data
            }).catch(err => {
                alert("Ralat berlaku. Sila cuba lagi.");
                btn.disabled = false;
            });
        });
    }

    // ==========================================
    // 6. GALLERY SLIDER
    // ==========================================
    const slides = document.querySelectorAll('.gallery-slide');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    let currentSlide = 0;

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        slides[index].classList.add('active');
    }

    if (nextBtn && prevBtn) {
        nextBtn.addEventListener('click', () => {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        });

        prevBtn.addEventListener('click', () => {
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(currentSlide);
        });
    }

    // Auto slide gallery
    setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }, 5000);

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
});