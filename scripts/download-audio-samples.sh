#!/bin/bash

# Script to download free sample audio files for the meditation app
# These are Creative Commons licensed files from Pixabay

echo "🎵 Downloading sample audio files for SerenitySpark..."
echo ""

# Create directories if they don't exist
mkdir -p assets/audio/nature
mkdir -p assets/audio/music

# Note: These are example URLs. You'll need to find actual free audio files
# and update these URLs with real ones from Pixabay, Freesound, or similar.

echo "⚠️  This script needs to be updated with actual audio file URLs"
echo ""
echo "To add audio files manually:"
echo "1. Visit https://pixabay.com/music/ or https://freesound.org/"
echo "2. Search for meditation, nature sounds, ambient music"
echo "3. Download MP3 files (Creative Commons or royalty-free)"
echo "4. Place them in the appropriate directories:"
echo "   - Nature sounds: assets/audio/nature/"
echo "   - Music: assets/audio/music/"
echo "   - Chime: assets/audio/"
echo ""
echo "Required files:"
echo "  - rain.mp3 (nature sound, loopable)"
echo "  - ocean.mp3 (nature sound, loopable)"
echo "  - forest.mp3 (nature sound, loopable)"
echo "  - piano.mp3 (ambient music, loopable)"
echo "  - ambient.mp3 (ambient music, loopable)"
echo "  - chime.mp3 (short completion sound, ~2 seconds)"
echo ""
echo "Recommended specifications:"
echo "  - Format: MP3"
echo "  - Bitrate: 128kbps"
echo "  - Duration: 5+ minutes (for looping tracks)"
echo "  - Sample rate: 44.1kHz"

# Example of how to download (commented out - needs real URLs):
# curl -L "https://example.com/rain.mp3" -o assets/audio/nature/rain.mp3
# curl -L "https://example.com/ocean.mp3" -o assets/audio/nature/ocean.mp3
# curl -L "https://example.com/forest.mp3" -o assets/audio/nature/forest.mp3
# curl -L "https://example.com/piano.mp3" -o assets/audio/music/piano.mp3
# curl -L "https://example.com/ambient.mp3" -o assets/audio/music/ambient.mp3
# curl -L "https://example.com/chime.mp3" -o assets/audio/chime.mp3

echo ""
echo "✅ Once you've added audio files, rebuild the app:"
echo "   npm start -- --reset-cache"
echo "   npm run ios"
