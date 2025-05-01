# Karaoke Lyrics Player

A web application for creating and playing synchronized lyrics with music, highlighting each line karaoke-style as the song progresses.

## Features

### Core Functionality
- **Music Playback**: Upload MP3 files, control volume, play/pause, and navigate using a tracking bar
- **Lyrics Display**: Upload lyrics and display them with real-time highlighting of the current line
- **Timing Synchronization**: 
  - Easily set and adjust timing for each lyrics line
  - "Next line starts now" button for initial timing setup
  - Comprehensive timing edit mode
  - Visual indicators for lines with set timing
  - Tracking bar and highlighted lyrics move in sync

### Project Management
- **Local Storage**: All song data is saved to browser's local storage
- **History Panel**: Access all previously saved songs
- **Export/Import**: Save and share song data (timing/highlighting/colors) as JSON

### Playlists
- **Playlist Creation**: Create and manage multiple playlists
- **Song Organization**: Add songs to playlists, reorder them
- **Status Indicators**: See which songs have complete timing data
- **Navigation Controls**: Move between songs in a playlist

### Customization
- **Image Upload**: Add a header/title image for each song
- **Color Extraction**: Automatically extract color palette from uploaded images
- **Theme Customization**: Edit colors for all UI elements
- **Font Selection**: Choose from built-in fonts or load custom Google Fonts

### User Interface
- **Responsive Design**: Works on different screen sizes
- **Dark Theme Default**: Easy on the eyes with a dark background
- **Visual Feedback**: Current state is always clearly indicated
- **Keyboard Shortcuts**: Space bar to mark next line

## Planned Features

### Dance Move Timeline
- Display dance moves alongside lyrics
- Synchronize dance move highlighting with music
- Visual representation of dance steps

## Technical Details

### Data Storage
- **Song Data Structure**:
  ```json
  {
    "title": "Song Title",
    "artist": "Artist Name",
    "lyrics": ["Line 1", "Line 2", ...],
    "timing": [0, 15.5, ...],
    "theme": {
      "primary": "#6200ea",
      "secondary": "#3700b3",
      "accent": "#03dac6",
      "background": "#121212",
      "text": "#e1e1e1"
    },
    "font": "Roboto"
  }

