# Chip-8 Emulator 
This is a common emulator people build when learning how emulators work. This one is built using vanilla javascript with a lot of comments added to help me understand things as I was building it out. Most of the code originally came from https://www.freecodecamp.org/news/creating-your-very-own-chip-8-emulator/

Some important concept that you learn through building this:
- Reading in binary data into javascript
- Working more with bitwise operations to help move around all those 0s and 1s
- What an "opcode" is for an emulator, and how to use a specification to help know what to build
- Seeing the parallel with the code you are writing, and assembly instructions that parity the operations
- How to use the canvas to build out a custom display

![Chip-8 Emulator](screenshot.png)

Here is a screenshot of what I have. I made a few changes from the tutorial:
- Added play/pause game. This effectively stops the emulator's CPU from processing
- When reading in the ROM file, show the binary data that is loaded. This can be converted to opcodes that the program uses
- Ability to change out the game
- Show which opcode will be ran the next CPU cycle.


# Running
This all runs on vanilla javascript and Node.

    npm install
    npm run dev


