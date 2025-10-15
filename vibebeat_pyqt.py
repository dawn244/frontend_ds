import sys
import os
from dataclasses import dataclass
from typing import Dict, List, Optional

from PyQt5 import QtCore, QtGui, QtWidgets
try:
    from PyQt5 import QtMultimedia  # Optional; may be unavailable in some envs
    MULTIMEDIA_AVAILABLE = True
except Exception:  # pragma: no cover - runtime environment without audio deps
    QtMultimedia = None  # type: ignore
    MULTIMEDIA_AVAILABLE = False


@dataclass
class Song:
    id: int
    title: str
    artist: str
    album: str
    image: str
    audio: str
    duration: str = "0:00"
    genre: str = ""
    year: int = 2024
    liked: bool = False


class VibeBeatApp(QtWidgets.QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("VibeBeat")
        self.setMinimumSize(1200, 800)

        # State
        self.currentUser = {
            "name": "User",
            "avatar": "https://i.pravatar.cc/40",
        }
        self.musicLibrary: Dict[int, Song] = {}
        self.playlist: List[Song] = []
        self.currentIndex: int = -1
        self.isShuffled: bool = False
        self.isRepeated: bool = False
        self.likedSongs: set = set()
        self.userPlaylists: List[Dict] = []

        # Player (PyQt5 API) - optional if multimedia backend missing
        self.player = None
        if MULTIMEDIA_AVAILABLE:
            self.player = QtMultimedia.QMediaPlayer(self)
            self.player.setVolume(70)

        # Root UI
        self._build_ui()
        self._apply_styles()
        self._load_library()
        self._wire_events()
        self._populate_home()

    # ---------- UI Construction ----------
    def _build_ui(self):
        central = QtWidgets.QWidget(self)
        self.setCentralWidget(central)

        rootLayout = QtWidgets.QVBoxLayout(central)
        rootLayout.setContentsMargins(0, 0, 0, 0)
        rootLayout.setSpacing(0)

        # Top nav
        self.topNav = self._build_top_nav()
        rootLayout.addWidget(self.topNav)

        # Middle: sidebar + pages
        middle = QtWidgets.QWidget()
        middleLayout = QtWidgets.QHBoxLayout(middle)
        middleLayout.setContentsMargins(0, 0, 0, 0)
        middleLayout.setSpacing(0)
        rootLayout.addWidget(middle, 1)

        self.sidebar = self._build_sidebar()
        middleLayout.addWidget(self.sidebar)

        self.pages = self._build_pages()
        middleLayout.addWidget(self.pages, 1)

        # Bottom player
        self.bottomPlayer = self._build_bottom_player()
        rootLayout.addWidget(self.bottomPlayer)

    def _build_top_nav(self) -> QtWidgets.QWidget:
        w = QtWidgets.QWidget()
        w.setObjectName("TopNav")
        lay = QtWidgets.QHBoxLayout(w)
        lay.setContentsMargins(16, 10, 16, 10)
        lay.setSpacing(12)

        self.backBtn = QtWidgets.QToolButton()
        self.backBtn.setIcon(self.style().standardIcon(QtWidgets.QStyle.SP_ArrowBack))
        self.backBtn.setEnabled(False)
        self.forwardBtn = QtWidgets.QToolButton()
        self.forwardBtn.setIcon(self.style().standardIcon(QtWidgets.QStyle.SP_ArrowForward))
        self.forwardBtn.setEnabled(False)
        lay.addWidget(self.backBtn)
        lay.addWidget(self.forwardBtn)

        lay.addSpacing(8)

        self.searchEdit = QtWidgets.QLineEdit()
        self.searchEdit.setPlaceholderText("What do you want to listen to?")
        self.searchClearBtn = QtWidgets.QToolButton()
        self.searchClearBtn.setText("✕")
        self.searchClearBtn.setCursor(QtCore.Qt.PointingHandCursor)
        self.searchClearBtn.setToolTip("Clear")
        searchWrap = QtWidgets.QWidget()
        searchWrapLay = QtWidgets.QHBoxLayout(searchWrap)
        searchWrapLay.setContentsMargins(12, 6, 12, 6)
        searchWrapLay.setSpacing(6)
        searchIcon = QtWidgets.QLabel("🔍")
        searchWrapLay.addWidget(searchIcon)
        searchWrapLay.addWidget(self.searchEdit, 1)
        searchWrapLay.addWidget(self.searchClearBtn)
        lay.addWidget(searchWrap, 0)

        lay.addStretch(1)

        # User profile
        self.userBtn = QtWidgets.QPushButton()
        self.userBtn.setObjectName("UserProfile")
        self.userBtn.setText(self.currentUser["name"])  # simplified
        lay.addWidget(self.userBtn)

        return w

    def _build_sidebar(self) -> QtWidgets.QWidget:
        w = QtWidgets.QWidget()
        w.setObjectName("Sidebar")
        w.setFixedWidth(240)
        lay = QtWidgets.QVBoxLayout(w)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.setSpacing(0)

        header = QtWidgets.QWidget()
        headerLay = QtWidgets.QHBoxLayout(header)
        headerLay.setContentsMargins(16, 16, 16, 16)
        logo = QtWidgets.QLabel("🎵 VibeBeat")
        logo.setObjectName("Logo")
        headerLay.addWidget(logo)
        lay.addWidget(header)

        nav = QtWidgets.QWidget()
        navLay = QtWidgets.QVBoxLayout(nav)
        navLay.setContentsMargins(0, 8, 0, 8)
        navLay.setSpacing(0)
        self.btnHome = self._nav_btn("Home")
        self.btnSearch = self._nav_btn("Search")
        self.btnLibrary = self._nav_btn("Your Library")
        self.btnPlaylists = self._nav_btn("Playlists")
        self.btnLiked = self._nav_btn("Liked Songs")
        self.btnSettings = self._nav_btn("Settings")

        for b in [self.btnHome, self.btnSearch, self.btnLibrary, self.btnPlaylists, self.btnLiked, self.btnSettings]:
            navLay.addWidget(b)
        navLay.addStretch(1)
        lay.addWidget(nav)

        # Sidebar playlists header + list
        plWrap = QtWidgets.QWidget()
        plLay = QtWidgets.QVBoxLayout(plWrap)
        plLay.setContentsMargins(16, 8, 16, 16)
        self.createPlaylistBtn = QtWidgets.QPushButton("+ Create Playlist")
        plLay.addWidget(self.createPlaylistBtn)
        self.playlistList = QtWidgets.QListWidget()
        self.playlistList.setObjectName("PlaylistList")
        plLay.addWidget(self.playlistList, 1)
        lay.addWidget(plWrap, 1)

        return w

    def _nav_btn(self, text: str) -> QtWidgets.QPushButton:
        b = QtWidgets.QPushButton(text)
        b.setCursor(QtCore.Qt.PointingHandCursor)
        b.setObjectName("NavItem")
        b.setCheckable(True)
        b.setAutoExclusive(True)
        return b

    def _build_pages(self) -> QtWidgets.QStackedWidget:
        stack = QtWidgets.QStackedWidget()
        stack.setObjectName("Pages")

        # Home page
        self.pageHome = self._build_home_page()
        stack.addWidget(self.pageHome)

        # Search page
        self.pageSearch = self._build_search_page()
        stack.addWidget(self.pageSearch)

        # Library page
        self.pageLibrary = self._build_library_page()
        stack.addWidget(self.pageLibrary)

        # Playlists page
        self.pagePlaylists = self._build_playlists_page()
        stack.addWidget(self.pagePlaylists)

        # Liked page
        self.pageLiked = self._build_liked_page()
        stack.addWidget(self.pageLiked)

        # Settings page
        self.pageSettings = self._build_settings_page()
        stack.addWidget(self.pageSettings)

        return stack

    def _build_section_header(self, title: str, subtitle: Optional[str] = None) -> QtWidgets.QWidget:
        wrap = QtWidgets.QWidget()
        lay = QtWidgets.QVBoxLayout(wrap)
        lay.setContentsMargins(24, 24, 24, 12)
        h = QtWidgets.QLabel(title)
        h.setObjectName("H1")
        lay.addWidget(h)
        if subtitle:
            p = QtWidgets.QLabel(subtitle)
            p.setObjectName("Subtle")
            lay.addWidget(p)
        return wrap

    def _build_home_page(self) -> QtWidgets.QWidget:
        page = QtWidgets.QWidget()
        lay = QtWidgets.QVBoxLayout(page)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.addWidget(self._build_section_header("Good afternoon", "Here's what you've been listening to"))

        # three grids
        self.recentGrid = self._grid_widget()
        lay.addWidget(self._section("Recently Played", self.recentGrid))

        self.madeGrid = self._grid_widget()
        lay.addWidget(self._section("Made for You", self.madeGrid))

        self.trendingGrid = self._grid_widget()
        lay.addWidget(self._section("Trending Now", self.trendingGrid))
        return page

    def _section(self, title: str, content: QtWidgets.QWidget) -> QtWidgets.QWidget:
        s = QtWidgets.QWidget()
        v = QtWidgets.QVBoxLayout(s)
        v.setContentsMargins(24, 0, 24, 0)
        lbl = QtWidgets.QLabel(title)
        lbl.setObjectName("H2")
        v.addWidget(lbl)
        v.addWidget(content)
        return s

    def _grid_widget(self) -> QtWidgets.QScrollArea:
        scroll = QtWidgets.QScrollArea()
        scroll.setWidgetResizable(True)
        inner = QtWidgets.QWidget()
        layout = QtWidgets.QGridLayout(inner)
        layout.setContentsMargins(0, 12, 0, 12)
        layout.setHorizontalSpacing(16)
        layout.setVerticalSpacing(16)
        scroll.setWidget(inner)
        scroll.setProperty("grid", layout)
        return scroll

    def _build_search_page(self) -> QtWidgets.QWidget:
        page = QtWidgets.QWidget()
        v = QtWidgets.QVBoxLayout(page)
        v.setContentsMargins(0, 0, 0, 0)
        v.addWidget(self._build_section_header("Search", "Find songs, artists, and albums"))
        self.searchResults = QtWidgets.QScrollArea()
        self.searchResults.setWidgetResizable(True)
        self.searchResultsInner = QtWidgets.QWidget()
        self.searchResultsLayout = QtWidgets.QVBoxLayout(self.searchResultsInner)
        self.searchResultsLayout.setContentsMargins(24, 12, 24, 24)
        self.searchResults.setWidget(self.searchResultsInner)
        v.addWidget(self.searchResults)
        return page

    def _build_library_page(self) -> QtWidgets.QWidget:
        page = QtWidgets.QWidget()
        v = QtWidgets.QVBoxLayout(page)
        v.setContentsMargins(0, 0, 0, 0)

        header = self._build_section_header("Your Library")
        v.addWidget(header)

        # Filters row + Upload button
        filterWrap = QtWidgets.QWidget()
        h = QtWidgets.QHBoxLayout(filterWrap)
        h.setContentsMargins(24, 0, 24, 0)
        self.filterAll = self._chip_btn("All", checked=True)
        self.filterPlaylists = self._chip_btn("Playlists")
        self.filterArtists = self._chip_btn("Artists")
        self.filterAlbums = self._chip_btn("Albums")
        self.filterSongs = self._chip_btn("Songs")
        h.addWidget(self.filterAll)
        h.addWidget(self.filterPlaylists)
        h.addWidget(self.filterArtists)
        h.addWidget(self.filterAlbums)
        h.addWidget(self.filterSongs)
        h.addStretch(1)
        self.uploadBtn = QtWidgets.QPushButton("Upload Song…")
        self.uploadBtn.setObjectName("Primary")
        h.addWidget(self.uploadBtn)
        v.addWidget(filterWrap)

        # Content list/grid
        self.libraryScroll = QtWidgets.QScrollArea()
        self.libraryScroll.setWidgetResizable(True)
        self.libraryInner = QtWidgets.QWidget()
        self.libraryLayout = QtWidgets.QGridLayout(self.libraryInner)
        self.libraryLayout.setContentsMargins(24, 12, 24, 24)
        self.libraryLayout.setHorizontalSpacing(16)
        self.libraryLayout.setVerticalSpacing(16)
        self.libraryScroll.setWidget(self.libraryInner)
        v.addWidget(self.libraryScroll)
        return page

    def _chip_btn(self, text: str, checked: bool = False) -> QtWidgets.QPushButton:
        b = QtWidgets.QPushButton(text)
        b.setCheckable(True)
        b.setChecked(checked)
        b.setAutoExclusive(True)
        b.setObjectName("Chip")
        return b

    def _build_playlists_page(self) -> QtWidgets.QWidget:
        page = QtWidgets.QWidget()
        v = QtWidgets.QVBoxLayout(page)
        v.setContentsMargins(0, 0, 0, 0)
        v.addWidget(self._build_section_header("Your Playlists"))
        self.playlistsScroll = QtWidgets.QScrollArea()
        self.playlistsScroll.setWidgetResizable(True)
        self.playlistsInner = QtWidgets.QWidget()
        self.playlistsLayout = QtWidgets.QGridLayout(self.playlistsInner)
        self.playlistsLayout.setContentsMargins(24, 12, 24, 24)
        self.playlistsLayout.setHorizontalSpacing(16)
        self.playlistsLayout.setVerticalSpacing(16)
        self.playlistsScroll.setWidget(self.playlistsInner)
        v.addWidget(self.playlistsScroll)
        return page

    def _build_liked_page(self) -> QtWidgets.QWidget:
        page = QtWidgets.QWidget()
        v = QtWidgets.QVBoxLayout(page)
        v.setContentsMargins(0, 0, 0, 0)
        header = self._build_section_header("Liked Songs")
        v.addWidget(header)
        self.likedScroll = QtWidgets.QScrollArea()
        self.likedScroll.setWidgetResizable(True)
        self.likedInner = QtWidgets.QWidget()
        self.likedLayout = QtWidgets.QVBoxLayout(self.likedInner)
        self.likedLayout.setContentsMargins(24, 12, 24, 24)
        self.likedScroll.setWidget(self.likedInner)
        v.addWidget(self.likedScroll)
        return page

    def _build_settings_page(self) -> QtWidgets.QWidget:
        page = QtWidgets.QWidget()
        v = QtWidgets.QVBoxLayout(page)
        v.setContentsMargins(0, 0, 0, 0)
        v.addWidget(self._build_section_header("Settings", "Manage your account and preferences"))
        inner = QtWidgets.QWidget()
        form = QtWidgets.QFormLayout(inner)
        self.themeSelect = QtWidgets.QComboBox()
        self.themeSelect.addItems(["Dark", "Light"]) 
        form.addRow("Theme", self.themeSelect)
        v.addWidget(inner)
        v.addStretch(1)
        return page

    def _build_bottom_player(self) -> QtWidgets.QWidget:
        w = QtWidgets.QWidget()
        w.setObjectName("Player")
        lay = QtWidgets.QHBoxLayout(w)
        lay.setContentsMargins(16, 10, 16, 10)
        lay.setSpacing(12)

        # Left: track info
        left = QtWidgets.QHBoxLayout()
        self.coverLabel = QtWidgets.QLabel()
        self.coverLabel.setFixedSize(56, 56)
        self.coverLabel.setScaledContents(True)
        self.trackTitle = QtWidgets.QLabel("Select a song")
        self.trackArtist = QtWidgets.QLabel("VibeBeat")
        lblWrap = QtWidgets.QVBoxLayout()
        lblWrap.addWidget(self.trackTitle)
        lblWrap.addWidget(self.trackArtist)
        left.addWidget(self.coverLabel)
        left.addLayout(lblWrap)
        self.likeBtn = QtWidgets.QToolButton()
        self.likeBtn.setText("♡")
        left.addWidget(self.likeBtn)
        lay.addLayout(left, 3)

        # Center: controls
        center = QtWidgets.QVBoxLayout()
        ctrls = QtWidgets.QHBoxLayout()
        self.shuffleBtn = QtWidgets.QToolButton(); self.shuffleBtn.setText("🔀")
        self.prevBtn = QtWidgets.QToolButton(); self.prevBtn.setText("⏮")
        self.playBtn = QtWidgets.QToolButton(); self.playBtn.setText("▶")
        self.nextBtn = QtWidgets.QToolButton(); self.nextBtn.setText("⏭")
        self.repeatBtn = QtWidgets.QToolButton(); self.repeatBtn.setText("🔁")
        for b in [self.shuffleBtn, self.prevBtn, self.playBtn, self.nextBtn, self.repeatBtn]:
            ctrls.addWidget(b)
        center.addLayout(ctrls)

        prog = QtWidgets.QHBoxLayout()
        self.currentTimeLbl = QtWidgets.QLabel("0:00")
        self.progress = QtWidgets.QSlider(QtCore.Qt.Horizontal)
        self.progress.setRange(0, 1000)
        self.totalTimeLbl = QtWidgets.QLabel("0:00")
        prog.addWidget(self.currentTimeLbl)
        prog.addWidget(self.progress, 1)
        prog.addWidget(self.totalTimeLbl)
        center.addLayout(prog)
        lay.addLayout(center, 4)

        # Right: volume + queue
        right = QtWidgets.QHBoxLayout()
        self.muteBtn = QtWidgets.QToolButton(); self.muteBtn.setText("🔊")
        self.volume = QtWidgets.QSlider(QtCore.Qt.Horizontal)
        self.volume.setRange(0, 100)
        self.volume.setValue(70)
        self.queueBtn = QtWidgets.QToolButton(); self.queueBtn.setText("☰")
        right.addWidget(self.muteBtn)
        right.addWidget(self.volume)
        right.addWidget(self.queueBtn)
        lay.addLayout(right, 3)
        return w

    # ---------- Styles ----------
    def _apply_styles(self):
        self.setStyleSheet(
            """
            QWidget { background: #121212; color: #ffffff; font-family: Inter, Segoe UI, Roboto, sans-serif; }
            #TopNav { background: rgba(0,0,0,0.6); border-bottom: 1px solid #333; }
            #Sidebar { background: #181818; border-right: 1px solid #333; }
            #Logo { color: #1ed760; font-weight: 800; font-size: 20px; }
            QPushButton#NavItem { text-align: left; padding: 10px 16px; color: #b3b3b3; border: none; }
            QPushButton#NavItem:hover, QPushButton#NavItem:checked { background: #2a2a2a; color: #fff; }
            QLineEdit { background: #ffffff; color: #000; border: 1px solid #333; border-radius: 16px; padding: 6px 10px; }
            QPushButton#UserProfile { background: #282828; border: none; padding: 6px 10px; border-radius: 999px; }
            QLabel#H1 { font-size: 28px; font-weight: 800; }
            QLabel#H2 { font-size: 20px; font-weight: 700; margin-top: 6px; margin-bottom: 6px; }
            QLabel#Subtle { color: #b3b3b3; }
            QPushButton#Chip { border: 1px solid #333; border-radius: 999px; padding: 6px 12px; color: #b3b3b3; background: transparent; }
            QPushButton#Chip:hover, QPushButton#Chip:checked { background: #fff; color: #000; border-color: #fff; }
            QPushButton#Primary { background: #1ed760; color: #000; border: none; border-radius: 8px; padding: 8px 12px; font-weight: 600; }
            QPushButton#Primary:hover { background: #1db954; }
            #Player { background: #181818; border-top: 1px solid #333; }
            QSlider::groove:horizontal { height: 4px; background: #333; border-radius: 2px; }
            QSlider::handle:horizontal { background: #1ed760; width: 10px; margin: -6px 0; border-radius: 5px; }
            QListWidget#PlaylistList { background: #181818; border: 1px solid #333; }
            """
        )

    # ---------- Data ----------
    def _load_library(self):
        # Seed with demo tracks
        demo = [
            Song(1, "Night Vibes", "Chill Beats", "Ambient Collection",
                 "https://i.scdn.co/image/ab67616d0000b2736dafe7cc3b0811b46c7f6617",
                 "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav", "3:45", "Ambient", 2024),
            Song(2, "Pop Energy", "Pop Mix", "Hits 2024",
                 "https://i.scdn.co/image/ab67616d0000b27346eb72bcf13c7b82cf67d3f8",
                 "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav", "2:30", "Pop", 2024),
            Song(3, "Rock Classics", "Rock Legends", "Greatest Hits",
                 "https://i.scdn.co/image/ab67616d0000b273d911c299fbb92c28e9a99217",
                 "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav", "4:12", "Rock", 2024),
            Song(4, "Lofi Chill", "Study Vibes", "Focus Music",
                 "https://i.scdn.co/image/ab67616d0000b273f76b3f8afcd46e3f9ec99438",
                 "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav", "3:20", "Lofi", 2024),
        ]
        for s in demo:
            self.musicLibrary[s.id] = s

    # ---------- Wiring ----------
    def _wire_events(self):
        # Navigation
        self.btnHome.clicked.connect(lambda: self._go_page(self.pageHome, self.btnHome))
        self.btnSearch.clicked.connect(lambda: self._go_page(self.pageSearch, self.btnSearch))
        self.btnLibrary.clicked.connect(lambda: self._go_page(self.pageLibrary, self.btnLibrary))
        self.btnPlaylists.clicked.connect(lambda: self._go_page(self.pagePlaylists, self.btnPlaylists))
        self.btnLiked.clicked.connect(lambda: self._go_page(self.pageLiked, self.btnLiked))
        self.btnSettings.clicked.connect(lambda: self._go_page(self.pageSettings, self.btnSettings))
        self.btnHome.setChecked(True)
        self.pages.setCurrentWidget(self.pageHome)

        # Search
        self.searchEdit.textChanged.connect(self._on_search)
        self.searchClearBtn.clicked.connect(lambda: self.searchEdit.setText(""))

        # Player controls
        self.playBtn.clicked.connect(self._toggle_play)
        self.prevBtn.clicked.connect(self._prev)
        self.nextBtn.clicked.connect(self._next)
        self.shuffleBtn.clicked.connect(self._toggle_shuffle)
        self.repeatBtn.clicked.connect(self._toggle_repeat)
        self.likeBtn.clicked.connect(self._toggle_like)
        self.volume.valueChanged.connect(self._set_volume)
        self.muteBtn.clicked.connect(self._toggle_mute)
        self.progress.sliderPressed.connect(lambda: self._seeking(True))
        self.progress.sliderReleased.connect(lambda: self._seeking(False))
        self.progress.sliderMoved.connect(self._seek_position)
        self._seekingActive = False

        if self.player is not None:
            self.player.positionChanged.connect(self._on_position_changed)
            self.player.durationChanged.connect(self._on_duration_changed)
            self.player.stateChanged.connect(self._on_play_state)
            self.player.mediaStatusChanged.connect(self._on_media_status)

        # Filters
        self.filterAll.clicked.connect(lambda: self._populate_library("all"))
        self.filterPlaylists.clicked.connect(lambda: self._populate_library("playlists"))
        self.filterArtists.clicked.connect(lambda: self._populate_library("artists"))
        self.filterAlbums.clicked.connect(lambda: self._populate_library("albums"))
        self.filterSongs.clicked.connect(lambda: self._populate_library("songs"))

        # Upload
        self.uploadBtn.clicked.connect(self._upload_song)

        # Create playlist
        self.createPlaylistBtn.clicked.connect(self._create_playlist)

    # ---------- Page logic ----------
    def _go_page(self, page: QtWidgets.QWidget, btn: QtWidgets.QPushButton):
        self.pages.setCurrentWidget(page)
        btn.setChecked(True)
        if page is self.pageHome:
            self._populate_home()
        elif page is self.pageSearch:
            self._show_search_placeholder()
        elif page is self.pageLibrary:
            self._populate_library("all")
        elif page is self.pageLiked:
            self._populate_liked()
        elif page is self.pagePlaylists:
            self._populate_playlists()

    def _populate_home(self):
        ids = list(self.musicLibrary.keys())[:6]
        made = [1, 2, 3, 4]
        trending = [2, 3, 1, 4]
        self._fill_cards(self.recentGrid, [self.musicLibrary[i] for i in ids if i in self.musicLibrary])
        self._fill_cards(self.madeGrid, [self.musicLibrary[i] for i in made if i in self.musicLibrary])
        self._fill_cards(self.trendingGrid, [self.musicLibrary[i] for i in trending if i in self.musicLibrary])

    def _fill_cards(self, scroll: QtWidgets.QScrollArea, songs: List[Song]):
        inner = scroll.widget()
        layout: QtWidgets.QGridLayout = scroll.property("grid")
        # Clear
        while layout.count():
            it = layout.takeAt(0)
            w = it.widget()
            if w:
                w.setParent(None)
        # Add
        cols = 4
        r = c = 0
        for s in songs:
            card = self._song_card(s)
            layout.addWidget(card, r, c)
            c += 1
            if c >= cols:
                r += 1
                c = 0

    def _song_card(self, song: Song) -> QtWidgets.QFrame:
        card = QtWidgets.QFrame()
        card.setObjectName("Card")
        card.setFrameShape(QtWidgets.QFrame.NoFrame)
        v = QtWidgets.QVBoxLayout(card)
        v.setContentsMargins(12, 12, 12, 12)
        v.setSpacing(8)
        img = QtWidgets.QLabel()
        img.setFixedSize(160, 160)
        img.setScaledContents(True)
        self._load_cover(img, song.image)
        title = QtWidgets.QLabel(song.title)
        title.setObjectName("CardTitle")
        subtitle = QtWidgets.QLabel(f"{song.artist} • {song.album}")
        subtitle.setObjectName("Subtle")
        play = QtWidgets.QPushButton("▶")
        play.setObjectName("PlayFloating")
        play.clicked.connect(lambda _, sid=song.id: self._play_song(sid))
        v.addWidget(img, 0, QtCore.Qt.AlignHCenter)
        v.addWidget(title)
        v.addWidget(subtitle)
        v.addWidget(play, 0, QtCore.Qt.AlignRight)
        return card

    def _load_cover(self, label: QtWidgets.QLabel, image_url: str):
        # Placeholder solid pixmap; network fetching omitted for simplicity
        pix = QtGui.QPixmap(1, 1)
        pix.fill(QtGui.QColor("#333"))
        label.setPixmap(pix)

    def _build_list_row(self, song: Song) -> QtWidgets.QWidget:
        row = QtWidgets.QWidget()
        h = QtWidgets.QHBoxLayout(row)
        h.setContentsMargins(8, 8, 8, 8)
        cover = QtWidgets.QLabel()
        cover.setFixedSize(40, 40)
        cover.setScaledContents(True)
        self._load_cover(cover, song.image)
        info = QtWidgets.QVBoxLayout()
        t = QtWidgets.QLabel(song.title)
        a = QtWidgets.QLabel(song.artist)
        info.addWidget(t)
        info.addWidget(a)
        play = QtWidgets.QToolButton(); play.setText("▶")
        play.clicked.connect(lambda _, sid=song.id: self._play_song(sid))
        h.addWidget(cover)
        h.addLayout(info)
        h.addStretch(1)
        h.addWidget(QtWidgets.QLabel(song.duration))
        h.addWidget(play)
        return row

    def _build_grid_item(self, song: Song) -> QtWidgets.QFrame:
        f = QtWidgets.QFrame()
        v = QtWidgets.QVBoxLayout(f)
        v.setContentsMargins(12, 12, 12, 12)
        cover = QtWidgets.QLabel(); cover.setFixedSize(140, 140); cover.setScaledContents(True)
        self._load_cover(cover, song.image)
        title = QtWidgets.QLabel(song.title)
        sub = QtWidgets.QLabel(f"{song.artist} • {song.album}")
        sub.setObjectName("Subtle")
        btn = QtWidgets.QPushButton("▶"); btn.clicked.connect(lambda _, sid=song.id: self._play_song(sid))
        v.addWidget(cover, 0, QtCore.Qt.AlignHCenter)
        v.addWidget(title)
        v.addWidget(sub)
        v.addWidget(btn, 0, QtCore.Qt.AlignRight)
        return f

    def _populate_library(self, filter_kind: str):
        # Clear grid
        for i in reversed(range(self.libraryLayout.count())):
            w = self.libraryLayout.itemAt(i).widget()
            if w:
                w.setParent(None)

        items: List[QtWidgets.QWidget] = []
        if filter_kind in ("all", "songs"):
            items = [self._build_grid_item(s) for s in self.musicLibrary.values()]
        elif filter_kind == "playlists":
            for p in self.userPlaylists:
                w = QtWidgets.QGroupBox(p.get("name", "Playlist"))
                l = QtWidgets.QVBoxLayout(w)
                l.addWidget(QtWidgets.QLabel(f"{len(p.get('songs', []))} songs"))
                items.append(w)
        elif filter_kind == "artists":
            artists = sorted({s.artist for s in self.musicLibrary.values()})
            for a in artists:
                items.append(QtWidgets.QGroupBox(a))
        elif filter_kind == "albums":
            albums = sorted({s.album for s in self.musicLibrary.values()})
            for a in albums:
                items.append(QtWidgets.QGroupBox(a))

        cols = 4
        r = c = 0
        for w in items:
            self.libraryLayout.addWidget(w, r, c)
            c += 1
            if c >= cols:
                r += 1
                c = 0

    def _populate_liked(self):
        # Clear
        for i in reversed(range(self.likedLayout.count())):
            item = self.likedLayout.itemAt(i)
            w = item.widget()
            if w:
                w.setParent(None)
        liked = [self.musicLibrary[i] for i in self.likedSongs if i in self.musicLibrary]
        if not liked:
            self.likedLayout.addWidget(QtWidgets.QLabel("No liked songs yet"))
            return
        for s in liked:
            self.likedLayout.addWidget(self._build_list_row(s))

    def _populate_playlists(self):
        # Clear
        for i in reversed(range(self.playlistsLayout.count())):
            w = self.playlistsLayout.itemAt(i).widget()
            if w:
                w.setParent(None)
        if not self.userPlaylists:
            self.playlistsLayout.addWidget(QtWidgets.QLabel("No custom playlists yet"), 0, 0)
            return
        cols = 3
        r = c = 0
        for p in self.userPlaylists:
            card = QtWidgets.QGroupBox(p.get("name", "Playlist"))
            l = QtWidgets.QVBoxLayout(card)
            l.addWidget(QtWidgets.QLabel(p.get("description", "")))
            l.addWidget(QtWidgets.QLabel(f"{len(p.get('songs', []))} songs"))
            self.playlistsLayout.addWidget(card, r, c)
            c += 1
            if c >= cols:
                r += 1
                c = 0

    # ---------- Search ----------
    def _show_search_placeholder(self):
        self._set_search_results([QtWidgets.QLabel("Search for music")])

    def _on_search(self, text: str):
        text = text.strip().lower()
        if not text:
            self.searchClearBtn.setVisible(False)
            self._show_search_placeholder()
            return
        self.searchClearBtn.setVisible(True)
        results = [s for s in self.musicLibrary.values() if text in s.title.lower() or text in s.artist.lower() or text in s.album.lower()]
        if not results:
            self._set_search_results([QtWidgets.QLabel(f"No results for '{text}'")])
        else:
            widgets = []
            for s in results:
                widgets.append(self._build_list_row(s))
            self._set_search_results(widgets)

    def _set_search_results(self, widgets: List[QtWidgets.QWidget]):
        # Clear
        for i in reversed(range(self.searchResultsLayout.count())):
            w = self.searchResultsLayout.itemAt(i).widget()
            if w:
                w.setParent(None)
        for w in widgets:
            self.searchResultsLayout.addWidget(w)
        self.searchResultsLayout.addStretch(1)

    # ---------- Upload ----------
    def _upload_song(self):
        dlg = QtWidgets.QFileDialog(self, "Select audio file")
        dlg.setFileMode(QtWidgets.QFileDialog.ExistingFile)
        dlg.setNameFilters(["Audio Files (*.mp3 *.wav *.ogg *.flac)", "All Files (*)"])
        if dlg.exec_() == QtWidgets.QDialog.Accepted:
            path = dlg.selectedFiles()[0]
            base = os.path.basename(path)
            title = os.path.splitext(base)[0]
            new_id = max(self.musicLibrary.keys(), default=1000) + 1
            song = Song(
                id=new_id,
                title=title,
                artist="Local File",
                album="Uploads",
                image="",
                audio=QtCore.QUrl.fromLocalFile(path).toString(),
                duration="",
                genre="",
                year=QtCore.QDate.currentDate().year(),
            )
            self.musicLibrary[new_id] = song
            # Add to library view
            self._populate_library("all")
            # Auto-play uploaded song
            self._play_song(new_id)

    # ---------- Playlists ----------
    def _create_playlist(self):
        name, ok = QtWidgets.QInputDialog.getText(self, "Create Playlist", "Playlist name:")
        if not ok or not name.strip():
            return
        pl = {"id": QtCore.QDateTime.currentMSecsSinceEpoch(), "name": name.strip(), "songs": [], "description": ""}
        self.userPlaylists.append(pl)
        self.playlistList.addItem(name.strip())
        self._populate_playlists()

    # ---------- Player ----------
    def _play_song(self, song_id: int):
        song = self.musicLibrary.get(song_id)
        if not song:
            return
        # update playlist to single song for simplicity
        self.playlist = [song]
        self.currentIndex = 0

        # Set media (PyQt5 API)
        if self.player is not None and MULTIMEDIA_AVAILABLE:
            url = QtCore.QUrl(song.audio)
            content = QtMultimedia.QMediaContent(url)
            self.player.setMedia(content)
            self.player.play()
        else:
            QtWidgets.QMessageBox.information(
                self,
                "Audio unavailable",
                "Audio playback isn't available in this environment. The UI will still work."
            )

        # UI
        self.trackTitle.setText(song.title)
        self.trackArtist.setText(song.artist)
        self.likeBtn.setChecked(song_id in self.likedSongs)
        self.playBtn.setText("⏸")

    def _toggle_play(self):
        if self.player is None:
            QtWidgets.QMessageBox.information(self, "Audio unavailable", "Cannot play without multimedia backend.")
            return
        state = self.player.state()
        if MULTIMEDIA_AVAILABLE and state == QtMultimedia.QMediaPlayer.PlayingState:
            self.player.pause()
        else:
            self.player.play()

    def _prev(self):
        if self.currentIndex > 0:
            self.currentIndex -= 1
            self._play_song(self.playlist[self.currentIndex].id)

    def _next(self):
        if self.currentIndex < len(self.playlist) - 1:
            self.currentIndex += 1
            self._play_song(self.playlist[self.currentIndex].id)

    def _toggle_shuffle(self):
        self.isShuffled = not self.isShuffled

    def _toggle_repeat(self):
        self.isRepeated = not self.isRepeated

    def _toggle_like(self):
        if self.currentIndex < 0 or not self.playlist:
            return
        sid = self.playlist[self.currentIndex].id
        if sid in self.likedSongs:
            self.likedSongs.remove(sid)
            self.likeBtn.setText("♡")
        else:
            self.likedSongs.add(sid)
            self.likeBtn.setText("❤")
        self._populate_liked()

    def _set_volume(self, value: int):
        value = max(0, min(100, int(value)))
        if self.player is not None:
            self.player.setVolume(value)
        if value == 0:
            self.muteBtn.setText("🔇")
        elif value < 50:
            self.muteBtn.setText("🔈")
        else:
            self.muteBtn.setText("🔊")

    def _toggle_mute(self):
        if self.player is None:
            # Just toggle the slider visually
            vol = self.volume.value()
            if vol == 0:
                self.volume.setValue(getattr(self, "_prevVol", 70))
            else:
                self._prevVol = vol
                self.volume.setValue(0)
            return
        vol = self.player.volume()
        if vol == 0:
            self.player.setVolume(getattr(self, "_prevVol", 70))
            self.volume.setValue(getattr(self, "_prevVol", 70))
        else:
            self._prevVol = vol
            self.player.setVolume(0)
            self.volume.setValue(0)

    def _format_time(self, ms: int) -> str:
        secs = max(0, ms // 1000)
        m = secs // 60
        s = secs % 60
        return f"{m}:{s:02d}"

    def _on_position_changed(self, pos: int):
        if not self._seekingActive and self.player is not None:
            dur = max(1, self.player.duration())
            self.progress.blockSignals(True)
            self.progress.setValue(int(pos * 1000 / dur))
            self.progress.blockSignals(False)
        self.currentTimeLbl.setText(self._format_time(pos))

    def _on_duration_changed(self, dur: int):
        self.totalTimeLbl.setText(self._format_time(dur))

    def _on_play_state(self, state):
        try:
            playing = MULTIMEDIA_AVAILABLE and state == QtMultimedia.QMediaPlayer.PlayingState
        except Exception:
            playing = False
        self.playBtn.setText("⏸" if playing else "▶")

    def _on_media_status(self, status):
        if self.player is None:
            return
        try:
            if MULTIMEDIA_AVAILABLE and status == QtMultimedia.QMediaPlayer.EndOfMedia and self.isRepeated:
                self.player.setPosition(0)
                self.player.play()
        except Exception:
            pass

    def _seeking(self, active: bool):
        self._seekingActive = active

    def _seek_position(self, value: int):
        if self.player is None:
            return
        dur = self.player.duration()
        self.player.setPosition(int(dur * (value / 1000.0)))


def main():
    app = QtWidgets.QApplication(sys.argv)
    win = VibeBeatApp()
    win.show()
    sys.exit(app.exec_())


if __name__ == "__main__":
    main()
