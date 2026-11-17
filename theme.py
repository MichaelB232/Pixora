"""Pixora - Tema (Dark Mode sebagai default, Light Mode opsional)."""
from string import Template

DARK = dict(
    bg="#16181d", surface="#1e2127", surface2="#272b34", border="#343944", text="#e7e9ee",
    muted="#8b91a0", accent="#4c8dff", accent_h="#6aa0ff", accent_text="#ffffff",
    danger="#ff6b6b", ok="#4cd08a", warn="#ffb454", view="#101216", sel="#2a4a85",
)
LIGHT = dict(
    bg="#eef0f4", surface="#ffffff", surface2="#f1f3f7", border="#d3d7df", text="#1c1f26",
    muted="#6a7080", accent="#2f6fed", accent_h="#4a85f5", accent_text="#ffffff",
    danger="#d8434b", ok="#1f9d62", warn="#c27a12", view="#e2e5ec", sel="#cfe0ff",
)

_QSS = Template("""
* { font-family: "Segoe UI", "Inter", "Noto Sans", sans-serif; font-size: 13px; }
QMainWindow, QDialog, QWidget#root { background: $bg; }
QWidget { color: $text; }
QFrame#panel { background: $surface; border: 1px solid $border; border-radius: 8px; }
QFrame#sidebar, QFrame#rightbar { background: $surface; border: 1px solid $border; border-radius: 8px; }
QLabel#panelTitle { font-weight: 600; font-size: 13px; }
QLabel#muted, QLabel#info { color: $muted; }
QLabel#methodTitle { font-size: 16px; font-weight: 700; }
QLabel#pending { color: $warn; font-weight: 600; }
QLabel#logo { font-weight: 800; font-size: 14px; color: $accent; padding: 0 12px; }
QMenuBar { background: $surface; border-bottom: 1px solid $border; }
QMenuBar::item { padding: 6px 10px; background: transparent; }
QMenuBar::item:selected { background: $surface2; border-radius: 4px; }
QMenu { background: $surface; border: 1px solid $border; padding: 4px; }
QMenu::item { padding: 5px 22px; border-radius: 4px; }
QMenu::item:selected { background: $sel; }
QMenu::item:disabled { color: $muted; }
QStatusBar { background: $surface; border-top: 1px solid $border; }
QStatusBar QLabel { color: $muted; padding: 0 10px; }
QGraphicsView { background: $view; border: none; border-radius: 6px; }
QPushButton, QToolButton { background: $surface2; border: 1px solid $border; border-radius: 6px; padding: 5px 9px; }
QPushButton:hover, QToolButton:hover { border-color: $accent; }
QPushButton:disabled, QToolButton:disabled { color: $muted; background: $surface; }
QPushButton:checked, QToolButton:checked { background: $sel; border-color: $accent; }
QPushButton#apply { background: $accent; color: $accent_text; border: none; font-weight: 700; padding: 9px 14px; }
QPushButton#apply:hover { background: $accent_h; }
QPushButton#apply:disabled { background: $surface2; color: $muted; }
QPushButton#danger { color: $danger; }
QLineEdit, QSpinBox, QDoubleSpinBox, QComboBox, QPlainTextEdit, QTextBrowser, QListWidget, QTreeWidget {
    background: $surface2; border: 1px solid $border; border-radius: 6px; padding: 3px 6px; }
QTextBrowser, QPlainTextEdit { padding: 8px; }
QComboBox QAbstractItemView { background: $surface; selection-background-color: $sel; }
QTreeWidget, QListWidget { padding: 4px; outline: none; }
QTreeWidget::item, QListWidget::item { padding: 4px 2px; border-radius: 4px; }
QTreeWidget::item:selected, QListWidget::item:selected { background: $sel; color: $text; }
QTreeWidget::item:hover, QListWidget::item:hover { background: $surface2; }
QSlider::groove:horizontal { height: 4px; background: $border; border-radius: 2px; }
QSlider::sub-page:horizontal { background: $accent; border-radius: 2px; }
QSlider::handle:horizontal { background: $accent; width: 14px; height: 14px; margin: -5px 0; border-radius: 7px; }
QCheckBox { spacing: 6px; }
QTabWidget::pane { border: 1px solid $border; border-radius: 6px; top: -1px; }
QTabBar::tab { background: transparent; padding: 6px 12px; color: $muted; }
QTabBar::tab:selected { color: $text; border-bottom: 2px solid $accent; }
QProgressBar { background: $surface2; border: none; border-radius: 3px; height: 6px; text-align: center; }
QProgressBar::chunk { background: $accent; border-radius: 3px; }
QSplitter::handle { background: transparent; }
QSplitter::handle:horizontal { width: 6px; }
QScrollArea { border: none; background: transparent; }
QScrollArea > QWidget, QScrollArea > QWidget > QWidget { background: transparent; }
QScrollBar:vertical { background: transparent; width: 10px; }
QScrollBar::handle:vertical { background: $border; border-radius: 5px; min-height: 24px; }
QScrollBar:horizontal { background: transparent; height: 10px; }
QScrollBar::handle:horizontal { background: $border; border-radius: 5px; min-width: 24px; }
QScrollBar::add-line, QScrollBar::sub-line { width: 0; height: 0; }
QDockWidget { titlebar-close-icon: none; }
QDockWidget::title { background: $surface; padding: 6px; border: 1px solid $border; }
QToolTip { background: $surface; color: $text; border: 1px solid $border; padding: 4px; }
""")


def stylesheet(dark: bool = True) -> str:
    return _QSS.substitute(DARK if dark else LIGHT)


def colors(dark: bool = True) -> dict:
    return DARK if dark else LIGHT
