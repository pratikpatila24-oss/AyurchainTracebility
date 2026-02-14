import time
import os

# The different "frames" or "dance moves"
frames = [
    "(>'.')>",
    "<('.'<)",
    "(^'.')^",
    "v('.'v)",
    "<('.'<)",
    "(>'.')>"
]

# A variable to control the "side-to-side" movement
indent = 0
direction = 1  # 1 means moving right, -1 means moving left

try:
    while True:
        # Clear the terminal screen
        # 'cls' is for Windows, 'clear' is for macOS/Linux
        os.system('cls' if os.name == 'nt' else 'clear')
        
        print("\n\n")  # Add some space at the top
        
        # Print the current frame with indentation
        current_frame = frames[indent % len(frames)]
        print(" " * indent + current_frame)
        
        print("\n\nPress [CTRL+C] to stop the dance...")
        
        # Update the indentation for the next frame
        indent += direction
        
        # If it hits the edge (e.g., 20 spaces), change direction
        if indent > 20:
            direction = -1
        elif indent < 0:
            direction = 1
            
        # Pause for a moment to create the animation effect
        time.sleep(0.15)

except KeyboardInterrupt:
    # This catches the Ctrl+C and exits cleanly
    print("\nDance over!")