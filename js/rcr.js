/* RCR  Radio Click Player v1.0 - 28.02.2026
 * RCR Footer RadioPlayer  pentru Radio Click România
 * Autor BaiatRau on IRC RomaniaChat - https://baiatrau.pages.dev
*/
// Elemente DOM
  const audio = document.getElementById('radioStream');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  const stopBtn = document.getElementById('stopBtn');
  const volumeSlider = document.getElementById('volume');
  const statusEl = document.getElementById('status');
  const titleEl = document.getElementById('songTitleText'); // span-ul cu textul care se mișcă
  const artworkImg = document.getElementById('artworkImg');
  const artworkContainer = document.getElementById('artworkContainer');

  let isPlaying = false;
  let metadataInterval = null;

  // Toggle Play / Pause
  function togglePlayPause() {
    if (isPlaying) {
      audio.pause();
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
      playPauseBtn.classList.remove('playing');
      statusEl.textContent = 'Pauzat';
    } else {
      audio.play().catch(err => {
        console.warn('Play error (posibil autoplay blocat):', err);
        statusEl.textContent = 'Apasă din nou pentru play';
      });
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
      playPauseBtn.classList.add('playing');
      statusEl.textContent = 'Se încarcă...';
    }
    isPlaying = !isPlaying;
  }

  // Stop complet
  function stop() {
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
    playPauseBtn.classList.remove('playing');
    statusEl.textContent = 'Oprit';
    titleEl.textContent = 'Radio Click România';
    titleEl.classList.remove('scrolling-active');
    artworkImg.src = 'https://live.radioclick.ro/cp/musiclibrary/nowplay_scstoian.png';
  }

  // Obține cover art – iTunes → MusicBrainz
  async function getArtworkUrl(artist, title) {
    if (!artist || !title || title === 'Unknown') {
      return 'https://chat.romaniachat.eu/radioclick.webp';
    }

    const query = encodeURIComponent(`${artist} ${title}`);

    // 1. iTunes (cel mai rapid și bun pentru pop/mainstream)
    try {
      const itunesRes = await fetch(`https://itunes.apple.com/search?term=${query}&media=music&entity=song&limit=1&country=RO`);
      const itunesData = await itunesRes.json();
      if (itunesData.resultCount > 0) {
        let art = itunesData.results[0].artworkUrl100;
        art = art.replace('100x100', '600x600').replace('60x60', '600x600');
        return art;
      }
    } catch (err) {
      console.warn('iTunes error:', err);
    }

    // 2. MusicBrainz fallback
    try {
      const headers = {
        'User-Agent': 'RadioClickPlayer/1.0 (https://chat.romaniachat.eu/ | romaniachat@ymail.com)'
      };

      const mbUrl = `https://musicbrainz.org/ws/2/recording/?query=recording:"${encodeURIComponent(title)}" AND artist:"${encodeURIComponent(artist)}"&fmt=json&limit=1`;
      const mbRes = await fetch(mbUrl, { headers });
      const mbData = await mbRes.json();

      if (mbData.recordings?.length > 0) {
        const recording = mbData.recordings[0];
        if (recording.releases?.length > 0) {
          for (const rel of recording.releases) {
            if (rel['cover-art-archive']?.artwork) {
              const releaseId = rel.id;
              return `https://coverartarchive.org/release/${releaseId}/front-500`;
            }
          }
        }
      }
    } catch (err) {
      console.warn('MusicBrainz error:', err);
    }

    return 'https://chat.romaniachat.eu/radioclick.webp';
  }

  // Update metadata + artwork + scrolling
  async function updateMetadata() {
    try {
      const res = await fetch('https://cp-sonic.showchat.eu.org/');
      if (!res.ok) throw new Error('Metadata fetch failed');

      const data = await res.json();

      let artist = '';
      let song = 'Radio Click România';

      if (data.title) {
        const parts = data.title.split(' - ');
        if (parts.length >= 2) {
          artist = parts[0].trim();
          song = parts.slice(1).join(' - ').trim();
        } else {
          song = data.title.trim();
        }
      }

      titleEl.textContent = artist ? `${artist} — ${song}` : song;

      // Cover art – ignorăm complet imaginea generică din endpoint
      let artworkUrl = await getArtworkUrl(artist, song);

      artworkContainer.classList.add('loading');
      artworkImg.src = artworkUrl;

      artworkImg.onload = () => artworkContainer.classList.remove('loading');
      artworkImg.onerror = () => {
        artworkImg.src = 'https://chat.romaniachat.eu/radioclick-romania.webp';
        artworkContainer.classList.remove('loading');
      };

      // Scrolling logic – după ce textul e setat
      setTimeout(() => {
        const container = titleEl.parentElement;
        if (titleEl.scrollWidth > container.clientWidth + 10) {
          titleEl.classList.add('scrolling-active');
        } else {
          titleEl.classList.remove('scrolling-active');
        }
      }, 150); // delay mic pentru reflow

    } catch (err) {
      console.error('Update metadata error:', err);
      // silent fallback – nu stricăm UI-ul
    }
  }

  // Evenimente butoane
  playPauseBtn.addEventListener('click', togglePlayPause);
  stopBtn.addEventListener('click', stop);

  volumeSlider.addEventListener('input', () => {
    audio.volume = volumeSlider.value;
  });

  // Evenimente audio
  audio.addEventListener('playing', () => {
    statusEl.textContent = 'Redă RadioClick';
    updateMetadata(); // imediat la start
    if (!metadataInterval) {
      metadataInterval = setInterval(updateMetadata, 25000); // ~25 sec
    }
  });

  audio.addEventListener('pause', () => {
    if (!audio.ended) statusEl.textContent = 'Pauzat';
  });

  audio.addEventListener('waiting', () => {
    statusEl.textContent = 'Buffering...';
  });

  audio.addEventListener('error', (e) => {
    console.error('Stream error:', e);
    statusEl.textContent = 'Eroare stream – încearcă refresh';
    stop();
  });

  // Primul update la load (dacă vrei)
  updateMetadata();

  
  
  
// titleEl = document.getElementById('songTitleText');
// container = document.getElementById('songTitle');  // sau player-title

const textLength = titleEl.textContent.length;
const containerWidth = titleEl.parentElement.offsetWidth;   // lățimea disponibilă
const textWidthApprox = textLength * 8;  // estimare grosieră (ajustează după font)

// Dacă textul e clar prea lung → activează scrolling
if (textLength > 35 || textWidthApprox > containerWidth + 20) {
  titleEl.classList.add('scrolling-active');
} else {
  titleEl.classList.remove('scrolling-active');
}
