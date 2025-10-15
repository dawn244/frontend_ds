// Music Streaming App - Main JavaScript File

// Global State Management
class MusicApp {
    constructor() {
        this.currentUser = null;
        this.currentSong = null;
        this.isPlaying = false;
        this.isShuffled = false;
        this.isRepeated = false;
        this.currentVolume = 70;
        this.currentTime = 0;
        this.duration = 0;
        this.playlist = [];
        this.currentIndex = 0;
        this.recentlyPlayed = [];
        this.likedSongs = new Set();
        this.userPlaylists = [];
        this.currentPage = 'home';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserData();
        this.initializeMusicLibrary();
        this.setupAudioPlayer();
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('signUpLink').addEventListener('click', (e) => this.handleSignUp(e));

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.navigateToPage(e));
        });

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => this.handleSearch(e));
        document.getElementById('searchClear').addEventListener('click', () => this.clearSearch());

        // Music player controls
        document.getElementById('playBtn').addEventListener('click', () => this.togglePlayPause());
        document.getElementById('prevBtn').addEventListener('click', () => this.previousSong());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextSong());
        document.getElementById('shuffleBtn').addEventListener('click', () => this.toggleShuffle());
        document.getElementById('repeatBtn').addEventListener('click', () => this.toggleRepeat());
        document.getElementById('likeBtn').addEventListener('click', () => this.toggleLike());

        // Progress bar
        document.getElementById('progressBar').addEventListener('click', (e) => this.seekTo(e));

        // Volume control
        document.getElementById('volumeRange').addEventListener('input', (e) => this.setVolume(e.target.value));
        document.getElementById('volumeBtn').addEventListener('click', () => this.toggleMute());

        // Modal controls
        document.getElementById('createPlaylistBtn').addEventListener('click', () => this.showCreatePlaylistModal());
        document.getElementById('createPlaylistMainBtn').addEventListener('click', () => this.showCreatePlaylistModal());
        document.getElementById('closePlaylistModal').addEventListener('click', () => this.hideCreatePlaylistModal());
        document.getElementById('createPlaylist').addEventListener('click', () => this.createPlaylist());
        document.getElementById('cancelPlaylist').addEventListener('click', () => this.hideCreatePlaylistModal());

        // Queue modal
        document.getElementById('queueBtn').addEventListener('click', () => this.showQueueModal());
        document.getElementById('closeQueueModal').addEventListener('click', () => this.hideQueueModal());

        // Sidebar toggle for mobile
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Library filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterLibrary(e));
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    // Music Library Data
    initializeMusicLibrary() {
        this.musicLibrary = {
            1: {
                id: 1,
                title: "Night Vibes",
                artist: "Chill Beats",
                album: "Ambient Collection",
                image: "https://i.scdn.co/image/ab67616d0000b2736dafe7cc3b0811b46c7f6617",
                audio: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                duration: "3:45",
                genre: "Ambient",
                year: 2024,
                liked: false
            },
            2: {
                id: 2,
                title: "Pop Energy",
                artist: "Pop Mix",
                album: "Hits 2024",
                image: "https://i.scdn.co/image/ab67616d0000b27346eb72bcf13c7b82cf67d3f8",
                audio: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                duration: "2:30",
                genre: "Pop",
                year: 2024,
                liked: false
            },
            3: {
                id: 3,
                title: "Rock Classics",
                artist: "Rock Legends",
                album: "Greatest Hits",
                image: "https://i.scdn.co/image/ab67616d0000b273d911c299fbb92c28e9a99217",
                audio: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                duration: "4:12",
                genre: "Rock",
                year: 2024,
                liked: false
            },
            4: {
                id: 4,
                title: "Lofi Chill",
                artist: "Study Vibes",
                album: "Focus Music",
                image: "https://i.scdn.co/image/ab67616d0000b273f76b3f8afcd46e3f9ec99438",
                audio: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                duration: "3:20",
                genre: "Lofi",
                year: 2024,
                liked: false
            },
            5: {
                id: 5,
                title: "Jazz Lounge",
                artist: "Smooth Jazz",
                album: "Evening Sessions",
                image: "https://i.scdn.co/image/ab67616d0000b273a3b73e2d8a5b5b5b5b5b5b5b",
                audio: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                duration: "4:05",
                genre: "Jazz",
                year: 2024,
                liked: false
            },
            6: {
                id: 6,
                title: "Electronic Dreams",
                artist: "EDM Hits",
                album: "Digital World",
                image: "https://i.scdn.co/image/ab67616d0000b273b3b73e2d8a5b5b5b5b5b5b5b5",
                audio: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                duration: "3:55",
                genre: "Electronic",
                year: 2024,
                liked: false
            },
            7: {
                id: 7,
                title: "Acoustic Soul",
                artist: "Folk Artists",
                album: "Raw Emotions",
                image: "https://i.scdn.co/image/ab67616d0000b273c3b73e2d8a5b5b5b5b5b5b5b5",
                audio: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                duration: "3:15",
                genre: "Folk",
                year: 2024,
                liked: false
            },
            8: {
                id: 8,
                title: "Hip Hop Flow",
                artist: "Urban Beats",
                album: "Street Stories",
                image: "https://i.scdn.co/image/ab67616d0000b273d3b73e2d8a5b5b5b5b5b5b5b5",
                audio: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                duration: "3:40",
                genre: "Hip Hop",
                year: 2024,
                liked: false
            },
            9: {
                id: 9,
                title: "Piano Dreams",
                artist: "Calm Keys",
                album: "Nocturnes",
                image: "https://i.scdn.co/image/ab67616d0000b2730d3e3d1c8f6f3f2b1e2a3c4d",
                audio: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                duration: "3:22",
                genre: "Classical",
                year: 2024,
                liked: false
            },
            10: {
                id: 10,
                title: "Sunset Drive",
                artist: "Synth Wave",
                album: "Neon Roads",
                image: "https://i.scdn.co/image/ab67616d0000b2731112131415161718191a1b1c",
                audio: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                duration: "3:48",
                genre: "Synthwave",
                year: 2024,
                liked: false
            },
            11: {
                id: 11,
                title: "Morning Coffee",
                artist: "Lofty",
                album: "Cafe Beats",
                image: "https://i.scdn.co/image/ab67616d0000b27322232425262728292a2b2c2d",
                audio: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                duration: "2:58",
                genre: "Lofi",
                year: 2024,
                liked: false
            },
            12: {
                id: 12,
                title: "Desert Wind",
                artist: "World Echoes",
                album: "Sands",
                image: "https://i.scdn.co/image/ab67616d0000b273333435363738393a3b3c3d3e",
                audio: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                duration: "4:20",
                genre: "World",
                year: 2024,
                liked: false
            },
            13: {
                id: 13,
                title: "Deep Focus",
                artist: "Study Beats",
                album: "Concentration",
                image: "https://i.scdn.co/image/ab67616d0000b2734445464748494a4b4c4d4e4f",
                audio: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                duration: "3:05",
                genre: "Lofi",
                year: 2024,
                liked: false
            },
            14: {
                id: 14,
                title: "Ocean Breeze",
                artist: "Ambient Air",
                album: "Blue Horizon",
                image: "https://i.scdn.co/image/ab67616d0000b27355565758595a5b5c5d5e5f60",
                audio: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                duration: "4:44",
                genre: "Ambient",
                year: 2024,
                liked: false
            },
            15: {
                id: 15,
                title: "Golden Hour",
                artist: "Indie Sun",
                album: "Warm Lights",
                image: "https://i.scdn.co/image/ab67616d0000b2736162636465666768696a6b6c",
                audio: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                duration: "3:36",
                genre: "Indie",
                year: 2024,
                liked: false
            },
            16: {
                id: 16,
                title: "Night Runner",
                artist: "Retro Drive",
                album: "Arcade Nights",
                image: "https://i.scdn.co/image/ab67616d0000b2736d6e6f707172737475767778",
                audio: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                duration: "3:59",
                genre: "Synthwave",
                year: 2024,
                liked: false
            },
            17: {
                id: 17,
                title: "Fire Dance",
                artist: "Latin Heat",
                album: "Salsa Nights",
                image: "https://i.scdn.co/image/ab67616d0000b2737a7b7c7d7e7f808182838485",
                audio: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                duration: "3:27",
                genre: "Latin",
                year: 2024,
                liked: false
            },
            18: {
                id: 18,
                title: "Cloud Nine",
                artist: "Dream Pop",
                album: "Skylines",
                image: "https://i.scdn.co/image/ab67616d0000b273868788898a8b8c8d8e8f9091",
                audio: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                duration: "3:12",
                genre: "Pop",
                year: 2024,
                liked: false
            },
            19: {
                id: 19,
                title: "Steel Strings",
                artist: "Guitar Works",
                album: "Fingerstyle",
                image: "https://i.scdn.co/image/ab67616d0000b27392939495969798999a9b9c9d",
                audio: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                duration: "2:50",
                genre: "Acoustic",
                year: 2024,
                liked: false
            },
            20: {
                id: 20,
                title: "Moonlight Walk",
                artist: "City Nights",
                album: "Midnight",
                image: "https://i.scdn.co/image/ab67616d0000b2739e9fa0a1a2a3a4a5a6a7a8a9",
                audio: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                duration: "3:33",
                genre: "Electronic",
                year: 2024,
                liked: false
            },
            21: {
                id: 21,
                title: "Crystal Cave",
                artist: "Chiptune Lab",
                album: "8Bit Adventures",
                image: "https://i.scdn.co/image/ab67616d0000b273aaabacadaeafb0b1b2b3b4b5",
                audio: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                duration: "2:42",
                genre: "Chiptune",
                year: 2024,
                liked: false
            },
            22: {
                id: 22,
                title: "Vintage Groove",
                artist: "Funk Unit",
                album: "Back In Time",
                image: "https://i.scdn.co/image/ab67616d0000b273b6b7b8b9babbbcbdbebfc0c1",
                audio: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                duration: "3:18",
                genre: "Funk",
                year: 2024,
                liked: false
            },
            23: {
                id: 23,
                title: "Snowfall",
                artist: "Winter Piano",
                album: "White Silence",
                image: "https://i.scdn.co/image/ab67616d0000b273c2c3c4c5c6c7c8c9cacbcccd",
                audio: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                duration: "3:01",
                genre: "Classical",
                year: 2024,
                liked: false
            },
            24: {
                id: 24,
                title: "Festival Lights",
                artist: "EDM Collective",
                album: "Mainstage",
                image: "https://i.scdn.co/image/ab67616d0000b273cecfd0d1d2d3d4d5d6d7d8d9",
                audio: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                duration: "3:25",
                genre: "EDM",
                year: 2024,
                liked: false
            },
            25: {
                id: 25,
                title: "River Stones",
                artist: "Zen Garden",
                album: "Still Water",
                image: "https://i.scdn.co/image/ab67616d0000b273dadbdcdddedfe0e1e2e3e4e5",
                audio: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                duration: "4:02",
                genre: "Ambient",
                year: 2024,
                liked: false
            }
        };

        this.populateMusicGrids();
    }

    // Setup Audio Player
    setupAudioPlayer() {
        this.audio = document.getElementById('audioPlayer');
        this.audio.volume = this.currentVolume / 100;

        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.handleSongEnd());
        this.audio.addEventListener('play', () => this.onPlay());
        this.audio.addEventListener('pause', () => this.onPause());
    }

    // Login Handling
    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const rememberMe = document.getElementById('rememberMe').checked;

        // Email validation
        const emailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!emailPattern.test(email)) {
            this.showError('emailError', 'Please enter a valid Gmail address');
            return;
        }

        if (password.length < 6) {
            this.showError('passwordError', 'Password must be at least 6 characters');
            return;
        }

        // Simulate login
        this.currentUser = {
            email: email,
            name: email.split('@')[0],
            avatar: 'https://i.pravatar.cc/40'
        };

        if (rememberMe) {
            localStorage.setItem('vibeBeatUser', JSON.stringify(this.currentUser));
        }

        this.showMainApp();
    }

    handleSignUp(e) {
        e.preventDefault();
        alert('Sign up functionality would be implemented here!');
    }

    showMainApp() {
        document.getElementById('loginPage').classList.remove('active');
        document.getElementById('mainApp').classList.add('active');
        document.getElementById('userName').textContent = this.currentUser.name;
        document.getElementById('userAvatar').src = this.currentUser.avatar;
    }

    // Navigation
    navigateToPage(e) {
        e.preventDefault();
        const page = e.currentTarget.dataset.page;
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        e.currentTarget.classList.add('active');

        // Show/hide pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(page + 'Page').classList.add('active');

        this.currentPage = page;
        this.loadPageContent(page);
    }

    loadPageContent(page) {
        switch(page) {
            case 'home':
                this.loadHomePage();
                break;
            case 'search':
                this.loadSearchPage();
                break;
            case 'library':
                this.loadLibraryPage();
                break;
            case 'playlists':
                this.loadPlaylistsPage();
                break;
            case 'liked':
                this.loadLikedPage();
                break;
            case 'settings':
                this.loadSettingsPage();
                break;
        }
    }

    // Page Content Loading
    loadHomePage() {
        this.populateMusicGrid('recentlyPlayed', this.getRecentlyPlayed());
        this.populateMusicGrid('madeForYou', this.getMadeForYou());
        this.populateMusicGrid('trendingNow', this.getTrendingNow());
    }

    loadSearchPage() {
        const searchResults = document.getElementById('searchResults');
        searchResults.innerHTML = `
            <div class="search-placeholder">
                <i class="fas fa-search"></i>
                <h2>Search for music</h2>
                <p>Find your favorite songs, artists, albums, and playlists</p>
            </div>
        `;
    }

    loadLibraryPage() {
        this.populateLibraryContent('all');
    }

    loadPlaylistsPage() {
        this.populatePlaylistsGrid();
    }

    loadLikedPage() {
        this.populateLikedContent();
    }

    loadSettingsPage() {
        // Settings page is already populated in HTML
    }

    // Search Functionality
    handleSearch(e) {
        const query = e.target.value.toLowerCase().trim();
        const searchResults = document.getElementById('searchResults');
        const searchClear = document.getElementById('searchClear');

        if (query.length === 0) {
            searchResults.innerHTML = `
                <div class="search-placeholder">
                    <i class="fas fa-search"></i>
                    <h2>Search for music</h2>
                    <p>Find your favorite songs, artists, albums, and playlists</p>
                </div>
            `;
            searchClear.style.display = 'none';
            return;
        }

        searchClear.style.display = 'block';
        const results = this.searchMusic(query);
        this.displaySearchResults(results);
    }

    searchMusic(query) {
        const results = {
            songs: [],
            artists: [],
            albums: []
        };

        Object.values(this.musicLibrary).forEach(song => {
            if (song.title.toLowerCase().includes(query)) {
                results.songs.push(song);
            }
            if (song.artist.toLowerCase().includes(query)) {
                results.artists.push(song);
            }
            if (song.album.toLowerCase().includes(query)) {
                results.albums.push(song);
            }
        });

        return results;
    }

    displaySearchResults(results) {
        const searchResults = document.getElementById('searchResults');
        let html = '';

        if (results.songs.length > 0) {
            html += '<div class="search-section"><h3>Songs</h3>';
            results.songs.forEach(song => {
                html += this.createSearchResultItem(song, 'song');
            });
            html += '</div>';
        }

        if (results.artists.length > 0) {
            html += '<div class="search-section"><h3>Artists</h3>';
            results.artists.forEach(song => {
                html += this.createSearchResultItem(song, 'artist');
            });
            html += '</div>';
        }

        if (results.albums.length > 0) {
            html += '<div class="search-section"><h3>Albums</h3>';
            results.albums.forEach(song => {
                html += this.createSearchResultItem(song, 'album');
            });
            html += '</div>';
        }

        if (html === '') {
            html = '<div class="search-no-results"><p>No results found</p></div>';
        }

        searchResults.innerHTML = html;
    }

    createSearchResultItem(song, type) {
        return `
            <div class="search-result-item" onclick="app.playSong(${song.id})">
                <img src="${song.image}" alt="${song.title}" class="search-result-image">
                <div class="search-result-info">
                    <h4>${song.title}</h4>
                    <p>${song.artist} • ${song.album}</p>
                </div>
                <button class="search-result-play">
                    <i class="fas fa-play"></i>
                </button>
            </div>
        `;
    }

    clearSearch() {
        document.getElementById('searchInput').value = '';
        this.handleSearch({ target: { value: '' } });
    }

    // Music Grid Population
    populateMusicGrids() {
        this.populateMusicGrid('recentlyPlayed', this.getRecentlyPlayed());
        this.populateMusicGrid('madeForYou', this.getMadeForYou());
        this.populateMusicGrid('trendingNow', this.getTrendingNow());
    }

    populateMusicGrid(containerId, songs) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = songs.map(song => this.createMusicCard(song)).join('');
        this.attachMusicCardListeners(container);
    }

    createMusicCard(song) {
        return `
            <div class="music-card" data-song-id="${song.id}">
                <img src="${song.image}" alt="${song.title}" class="music-card-image">
                <h4 class="music-card-title">${song.title}</h4>
                <p class="music-card-subtitle">${song.artist} • ${song.album}</p>
                <button class="music-card-play" data-song-id="${song.id}">
                    <i class="fas fa-play"></i>
                </button>
            </div>
        `;
    }

    attachMusicCardListeners(container) {
        container.addEventListener('click', (e) => {
            const songId = e.target.closest('[data-song-id]')?.dataset.songId;
            if (songId) {
                this.playSong(parseInt(songId));
            }
        });
    }

    // Music Data Getters
    getRecentlyPlayed() {
        return this.recentlyPlayed.slice(0, 6).map(id => this.musicLibrary[id]).filter(Boolean);
    }

    getMadeForYou() {
        const madeForYou = [1, 2, 3, 4, 5, 6];
        return madeForYou.map(id => this.musicLibrary[id]).filter(Boolean);
    }

    getTrendingNow() {
        const trending = [2, 3, 6, 7, 8, 1];
        return trending.map(id => this.musicLibrary[id]).filter(Boolean);
    }

    // Music Playback
    playSong(songId) {
        const song = this.musicLibrary[songId];
        if (!song) return;

        this.currentSong = song;
        this.currentIndex = this.playlist.findIndex(s => s.id === songId);
        
        if (this.currentIndex === -1) {
            this.playlist = [song];
            this.currentIndex = 0;
        }

        this.updatePlayerUI();
        this.audio.src = song.audio;
        this.audio.play();
        this.isPlaying = true;

        // Open now-playing sidebar if present
        const playingSidebar = document.getElementById('playingSidebar');
        if (playingSidebar && !playingSidebar.classList.contains('open')) {
            playingSidebar.classList.add('open');
        }

        // Add to recently played
        this.addToRecentlyPlayed(songId);
    }

    togglePlayPause() {
        if (!this.currentSong) return;

        if (this.isPlaying) {
            this.audio.pause();
        } else {
            this.audio.play();
        }
    }

    previousSong() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.playSong(this.playlist[this.currentIndex].id);
        }
    }

    nextSong() {
        if (this.currentIndex < this.playlist.length - 1) {
            this.currentIndex++;
            this.playSong(this.playlist[this.currentIndex].id);
        }
    }

    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        const shuffleBtn = document.getElementById('shuffleBtn');
        const playingShuffleBtn = document.getElementById('playingShuffleBtn');
        shuffleBtn.classList.toggle('active', this.isShuffled);
        if (playingShuffleBtn) {
            playingShuffleBtn.classList.toggle('active', this.isShuffled);
        }
    }

    toggleRepeat() {
        this.isRepeated = !this.isRepeated;
        const repeatBtn = document.getElementById('repeatBtn');
        const playingRepeatBtn = document.getElementById('playingRepeatBtn');
        repeatBtn.classList.toggle('active', this.isRepeated);
        if (playingRepeatBtn) {
            playingRepeatBtn.classList.toggle('active', this.isRepeated);
        }
    }

    toggleLike() {
        if (!this.currentSong) return;

        const songId = this.currentSong.id;
        const likeBtn = document.getElementById('likeBtn');
        const playingLikeBtn = document.getElementById('playingLikeBtn');
        
        if (this.likedSongs.has(songId)) {
            this.likedSongs.delete(songId);
            likeBtn.classList.remove('liked');
            likeBtn.innerHTML = '<i class="far fa-heart"></i>';
            if (playingLikeBtn) {
                playingLikeBtn.classList.remove('liked');
                playingLikeBtn.innerHTML = '<i class="far fa-heart"></i><span>Like</span>';
            }
        } else {
            this.likedSongs.add(songId);
            likeBtn.classList.add('liked');
            likeBtn.innerHTML = '<i class="fas fa-heart"></i>';
            if (playingLikeBtn) {
                playingLikeBtn.classList.add('liked');
                playingLikeBtn.innerHTML = '<i class="fas fa-heart"></i><span>Liked</span>';
            }
        }

        this.updateLikedCount();
    }

    // Audio Event Handlers
    updateProgress() {
        if (this.audio.duration) {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            document.getElementById('progressFill').style.width = `${progress}%`;
            document.getElementById('currentTime').textContent = this.formatTime(this.audio.currentTime);
            
            // Update playing sidebar progress if it exists
            const playingProgressFill = document.getElementById('playingProgressFill');
            const playingCurrentTime = document.getElementById('playingCurrentTime');
            if (playingProgressFill) {
                playingProgressFill.style.width = `${progress}%`;
            }
            if (playingCurrentTime) {
                playingCurrentTime.textContent = this.formatTime(this.audio.currentTime);
            }
        }
    }

    updateDuration() {
        this.duration = this.audio.duration;
        document.getElementById('totalTime').textContent = this.formatTime(this.duration);
        
        // Update playing sidebar duration if it exists
        const playingTotalTime = document.getElementById('playingTotalTime');
        if (playingTotalTime) {
            playingTotalTime.textContent = this.formatTime(this.duration);
        }
    }

    handleSongEnd() {
        if (this.isRepeated) {
            this.audio.currentTime = 0;
            this.audio.play();
        } else if (this.currentIndex < this.playlist.length - 1) {
            this.nextSong();
        } else {
            this.isPlaying = false;
            this.updatePlayButton();
        }
    }

    onPlay() {
        this.isPlaying = true;
        this.updatePlayButton();
    }

    onPause() {
        this.isPlaying = false;
        this.updatePlayButton();
    }

    updatePlayButton() {
        const playBtn = document.getElementById('playBtn');
        playBtn.innerHTML = this.isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        
        // Update playing sidebar play button if it exists
        const playingPlayBtn = document.getElementById('playingPlayBtn');
        if (playingPlayBtn) {
            playingPlayBtn.innerHTML = this.isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        }
    }

    updatePlayerUI() {
        if (!this.currentSong) return;

        const trackImage = document.getElementById('trackImage');
        const trackImagePlaceholder = document.getElementById('trackImagePlaceholder');
        
        // Update track image
        trackImage.src = this.currentSong.image;
        trackImage.alt = this.currentSong.title;
        
        // Hide placeholder when image loads
        trackImage.onload = () => {
            trackImagePlaceholder.classList.add('hidden');
        };
        
        // Show placeholder if image fails to load
        trackImage.onerror = () => {
            trackImagePlaceholder.classList.remove('hidden');
        };
        
        // Update track details
        document.getElementById('trackTitle').textContent = this.currentSong.title;
        document.getElementById('trackArtist').textContent = this.currentSong.artist;

        const likeBtn = document.getElementById('likeBtn');
        if (this.likedSongs.has(this.currentSong.id)) {
            likeBtn.classList.add('liked');
            likeBtn.innerHTML = '<i class="fas fa-heart"></i>';
        } else {
            likeBtn.classList.remove('liked');
            likeBtn.innerHTML = '<i class="far fa-heart"></i>';
        }
        
        // Update playing sidebar if it exists
        if (typeof updatePlayingSidebar === 'function') {
            updatePlayingSidebar();
        }
    }

    // Progress Bar
    seekTo(e) {
        if (!this.audio.duration) return;

        const progressBar = document.getElementById('progressBar');
        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const newTime = (clickX / width) * this.audio.duration;
        
        this.audio.currentTime = newTime;
    }

    // Volume Control
    setVolume(volume) {
        this.currentVolume = parseInt(volume);
        this.audio.volume = this.currentVolume / 100;
        
        const volumeBtn = document.getElementById('volumeBtn');
        if (this.currentVolume === 0) {
            volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else if (this.currentVolume < 50) {
            volumeBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
        } else {
            volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
    }

    toggleMute() {
        if (this.currentVolume > 0) {
            this.previousVolume = this.currentVolume;
            this.setVolume(0);
            document.getElementById('volumeRange').value = 0;
        } else {
            this.setVolume(this.previousVolume || 70);
            document.getElementById('volumeRange').value = this.previousVolume || 70;
        }
    }

    // Playlist Management
    showCreatePlaylistModal() {
        document.getElementById('createPlaylistModal').classList.add('active');
    }

    hideCreatePlaylistModal() {
        document.getElementById('createPlaylistModal').classList.remove('active');
        document.getElementById('playlistName').value = '';
        document.getElementById('playlistDescription').value = '';
    }

    createPlaylist() {
        const name = document.getElementById('playlistName').value.trim();
        const description = document.getElementById('playlistDescription').value.trim();

        if (!name) {
            alert('Please enter a playlist name');
            return;
        }

        const playlist = {
            id: Date.now(),
            name: name,
            description: description,
            songs: [],
            createdAt: new Date().toISOString()
        };

        this.userPlaylists.push(playlist);
        this.updatePlaylistList();
        this.hideCreatePlaylistModal();
    }

    updatePlaylistList() {
        const playlistList = document.getElementById('playlistList');
        playlistList.innerHTML = this.userPlaylists.map(playlist => `
            <div class="playlist-item" data-playlist-id="${playlist.id}">
                <i class="fas fa-music"></i>
                <span>${playlist.name}</span>
            </div>
        `).join('');
    }

    // Queue Management
    showQueueModal() {
        this.populateQueueContent();
        document.getElementById('queueModal').classList.add('active');
    }

    hideQueueModal() {
        document.getElementById('queueModal').classList.remove('active');
    }

    populateQueueContent() {
        const queueContent = document.getElementById('queueContent');
        queueContent.innerHTML = this.playlist.map((song, index) => `
            <div class="queue-item ${index === this.currentIndex ? 'active' : ''}" onclick="app.playSong(${song.id})">
                <img src="${song.image}" alt="${song.title}" class="queue-image">
                <div class="queue-info">
                    <h4>${song.title}</h4>
                    <p>${song.artist}</p>
                </div>
                <span class="queue-duration">${song.duration}</span>
            </div>
        `).join('');
    }

    // Library Management
    populateLibraryContent(filter) {
        const libraryContent = document.getElementById('libraryContent');
        let content = '';

        switch(filter) {
            case 'playlists':
                content = this.userPlaylists.map(playlist => this.createPlaylistCard(playlist)).join('');
                break;
            case 'artists':
                content = this.getUniqueArtists().map(artist => this.createArtistCard(artist)).join('');
                break;
            case 'albums':
                content = this.getUniqueAlbums().map(album => this.createAlbumCard(album)).join('');
                break;
            default:
                content = Object.values(this.musicLibrary).map(song => this.createMusicCard(song)).join('');
        }

        libraryContent.innerHTML = content;
        this.attachMusicCardListeners(libraryContent);
    }

    filterLibrary(e) {
        const filter = e.target.dataset.filter;
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        this.populateLibraryContent(filter);
    }

    // Utility Functions
    addToRecentlyPlayed(songId) {
        if (!this.recentlyPlayed.includes(songId)) {
            this.recentlyPlayed.unshift(songId);
            if (this.recentlyPlayed.length > 20) {
                this.recentlyPlayed.pop();
            }
        }
    }

    updateLikedCount() {
        const likedCount = document.getElementById('likedCount');
        if (likedCount) {
            likedCount.textContent = `${this.likedSongs.size} liked songs`;
        }
    }

    getUniqueArtists() {
        const artists = [...new Set(Object.values(this.musicLibrary).map(song => song.artist))];
        return artists.map(artist => ({
            name: artist,
            songs: Object.values(this.musicLibrary).filter(song => song.artist === artist)
        }));
    }

    getUniqueAlbums() {
        const albums = [...new Set(Object.values(this.musicLibrary).map(song => song.album))];
        return albums.map(album => ({
            name: album,
            artist: Object.values(this.musicLibrary).find(song => song.album === album)?.artist || '',
            songs: Object.values(this.musicLibrary).filter(song => song.album === album)
        }));
    }

    createPlaylistCard(playlist) {
        return `
            <div class="music-card" data-playlist-id="${playlist.id}">
                <img src="https://i.scdn.co/image/ab67616d0000b2736dafe7cc3b0811b46c7f6617" alt="${playlist.name}" class="music-card-image">
                <h4 class="music-card-title">${playlist.name}</h4>
                <p class="music-card-subtitle">${playlist.songs.length} songs</p>
                <button class="music-card-play" data-playlist-id="${playlist.id}">
                    <i class="fas fa-play"></i>
                </button>
            </div>
        `;
    }

    createArtistCard(artist) {
        return `
            <div class="music-card" data-artist="${artist.name}">
                <img src="https://i.scdn.co/image/ab67616d0000b2736dafe7cc3b0811b46c7f6617" alt="${artist.name}" class="music-card-image">
                <h4 class="music-card-title">${artist.name}</h4>
                <p class="music-card-subtitle">${artist.songs.length} songs</p>
                <button class="music-card-play" data-artist="${artist.name}">
                    <i class="fas fa-play"></i>
                </button>
            </div>
        `;
    }

    createAlbumCard(album) {
        return `
            <div class="music-card" data-album="${album.name}">
                <img src="https://i.scdn.co/image/ab67616d0000b2736dafe7cc3b0811b46c7f6617" alt="${album.name}" class="music-card-image">
                <h4 class="music-card-title">${album.name}</h4>
                <p class="music-card-subtitle">${album.artist} • ${album.songs.length} songs</p>
                <button class="music-card-play" data-album="${album.name}">
                    <i class="fas fa-play"></i>
                </button>
            </div>
        `;
    }

    // Liked Songs
    populateLikedContent() {
        const likedContent = document.getElementById('likedContent');
        const likedSongs = Object.values(this.musicLibrary).filter(song => this.likedSongs.has(song.id));
        
        if (likedSongs.length === 0) {
            likedContent.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart"></i>
                    <h3>No liked songs yet</h3>
                    <p>Start liking songs to see them here</p>
                </div>
            `;
            return;
        }

        likedContent.innerHTML = likedSongs.map(song => this.createMusicCard(song)).join('');
        this.attachMusicCardListeners(likedContent);
    }

    // Playlists Page
    populatePlaylistsGrid() {
        const playlistsGrid = document.getElementById('playlistsGrid');
        const allPlaylists = [
            ...this.userPlaylists,
            { id: 'liked', name: 'Liked Songs', songs: Array.from(this.likedSongs), isSystem: true }
        ];
        
        playlistsGrid.innerHTML = allPlaylists.map(playlist => this.createPlaylistCard(playlist)).join('');
    }

    // Keyboard Shortcuts
    handleKeyboardShortcuts(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch(e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.previousSong();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextSong();
                break;
            case 'KeyM':
                e.preventDefault();
                this.toggleMute();
                break;
            case 'KeyS':
                e.preventDefault();
                this.toggleShuffle();
                break;
            case 'KeyR':
                e.preventDefault();
                this.toggleRepeat();
                break;
        }
    }

    // Mobile Responsiveness
    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('open');
        }
    }

    handleResize() {
        if (window.innerWidth > 768) {
            document.querySelector('.sidebar').classList.remove('open');
        }
    }

    // Error Handling
    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        errorElement.textContent = message;
        errorElement.classList.add('show');
        
        setTimeout(() => {
            errorElement.classList.remove('show');
        }, 5000);
    }

    // Data Persistence
    loadUserData() {
        const savedUser = localStorage.getItem('vibeBeatUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showMainApp();
        }

        const savedLikedSongs = localStorage.getItem('vibeBeatLikedSongs');
        if (savedLikedSongs) {
            this.likedSongs = new Set(JSON.parse(savedLikedSongs));
        }

        const savedPlaylists = localStorage.getItem('vibeBeatPlaylists');
        if (savedPlaylists) {
            this.userPlaylists = JSON.parse(savedPlaylists);
        }
    }

    saveUserData() {
        if (this.currentUser) {
            localStorage.setItem('vibeBeatUser', JSON.stringify(this.currentUser));
        }
        localStorage.setItem('vibeBeatLikedSongs', JSON.stringify([...this.likedSongs]));
        localStorage.setItem('vibeBeatPlaylists', JSON.stringify(this.userPlaylists));
    }

    // Utility Functions
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Initialize App
    start() {
        // Initialize player UI
        this.initializePlayerUI();
        
        // Auto-save data every 30 seconds
        setInterval(() => {
            this.saveUserData();
        }, 30000);

        // Update liked count on load
        this.updateLikedCount();
    }
    
    // Initialize Player UI
    initializePlayerUI() {
        // Set initial volume
        this.audio.volume = 0.7;
        const volumeSlider = document.getElementById('volumeRange');
        if (volumeSlider) {
            volumeSlider.value = 70;
        }
        
        // Show placeholder initially
        const trackImagePlaceholder = document.getElementById('trackImagePlaceholder');
        if (trackImagePlaceholder) {
            trackImagePlaceholder.classList.remove('hidden');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MusicApp();
    window.app.start();
});

// Additional CSS for search results and queue
const additionalStyles = `
.search-section {
    margin-bottom: 2rem;
}

.search-section h3 {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: var(--text-primary);
}

.search-result-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s ease;
}

.search-result-item:hover {
    background: var(--bg-hover);
}

.search-result-image {
    width: 50px;
    height: 50px;
    border-radius: 6px;
    object-fit: cover;
}

.search-result-info {
    flex: 1;
}

.search-result-info h4 {
    font-size: 0.95rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
    color: var(--text-primary);
}

.search-result-info p {
    font-size: 0.8rem;
    color: var(--text-secondary);
}

.search-result-play {
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 1rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    transition: all 0.2s ease;
}

.search-result-play:hover {
    color: var(--primary);
    background: var(--bg-hover);
}

.search-no-results {
    text-align: center;
    padding: 2rem;
    color: var(--text-secondary);
}

.queue-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s ease;
}

.queue-item:hover {
    background: var(--bg-hover);
}

.queue-item.active {
    background: var(--primary);
    color: #000;
}

.queue-image {
    width: 40px;
    height: 40px;
    border-radius: 4px;
    object-fit: cover;
}

.queue-info {
    flex: 1;
}

.queue-info h4 {
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
}

.queue-info p {
    font-size: 0.8rem;
    opacity: 0.8;
}

.queue-duration {
    font-size: 0.8rem;
    opacity: 0.8;
}

.empty-state {
    text-align: center;
    padding: 3rem;
    color: var(--text-secondary);
}

.empty-state i {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: var(--text-muted);
}

.empty-state h3 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
}

.empty-state p {
    font-size: 1rem;
}
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);