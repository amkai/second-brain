#!/bin/bash
# Second Brain — Setup script for Linux (Hyprland/Omarchy)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BIN_DIR="$HOME/.local/bin"

echo "Setting up Second Brain autostart..."

# Create bin directory if it doesn't exist
mkdir -p "$BIN_DIR"

# Create the startup script
cat > "$BIN_DIR/second-brain" << 'EOF'
#!/bin/bash
cd ~/second-brain
nohup npm run dev > /tmp/second-brain.log 2>&1 &
EOF

chmod +x "$BIN_DIR/second-brain"

echo "Created $BIN_DIR/second-brain"
echo ""
echo "Now add this to ~/.config/hypr/autostart.lua:"
echo ""
echo '  o.launch_on_start("second-brain")'
echo ""
echo "Make sure ~/.local/bin is in your PATH."
