/**
 * CPU Class that will handle the emulation of the Chip-8 CPU
 * 
 * A lot of information comes from section 2.0 of the Cowgod Chip-8 Technical Reference
 * http://devernay.free.fr/hacks/chip8/C8TECH10.HTM#2.0
 */
class CPU
{
    constructor(renderer, keyboard, speaker)
    {
        this.renderer = renderer;
        this.keyboard = keyboard;
        this.speaker = speaker;

        // 4KB memory (4096 bytes) - 1 KB == 1024 bytes
        // 1 Uint8Array is 8-bit and 1 byte
        // Values range from location 0x000 (0) to 0xFFF (4095)
        // The first 512 bytes, from 0x000 to 0x1FF, are where the original 
        // interpreter was located, and should not be used by programs.
        // Programs beginning at 0x600 are intended for the ETI 660 computer
        this.memory = new Uint8Array(4096); 

        // 16 general purpose 8-bit registers, usually referred to as Vx
        // where x is a hexadecimal digit (0 through F)
        this.v = new Uint8Array(16); 

        // 16-bit register (store memory addresses)
        // Set this to 0 since we aren't storing anything at initialization
        // only the lowest (rightmost) 12 bits are usually used
        this.i = 0; 

        // When these registers are non-zero, they are automatically decremented at a rate of 60Hz
        this.delayTimer = 0;
        this.soundTimer = 0;

        // Program counter - Stores currently executing address
        // Program counter starts at 0x200
        this.pc = 0x200; 

        // used to point to the topmost level of the stack
        // The stack is an array of 16 16-bit values, used to store the address 
        // that the interpreter shoud return to when finished with a subroutine
        this.stack = new Array();

        this.paused = false;
        this.speed = 10;

    }

    loadSpriteIntoMemory()
    {
        // 2.4 of the technical reference used

        // Array of hex values for each sprite. Each sprite is 5 bytes.
        // The technical reference provides us with each one of these values.
        // A sprite is a group of bytes which are a binary representation of the desired picture
        // Chip-8 sprites may be up to 15 bytes, for a possible sprite size of 8x15.

        // here is an example how the first entry, "0", is represented in binary and hex
        // notice how only the left 4 bits are used to display the sprite

        /**
         
        Display   Binary    Hex  
         
        ****     11110000   0xF0
        *  *     10010000   0x90
        *  *     10010000   0x90
        *  *     10010000   0x90
        ****     11110000   0xF0

         */
        const sprites = [
            0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
            0x20, 0x60, 0x20, 0x20, 0x70, // 1
            0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
            0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
            0x90, 0x90, 0xF0, 0x10, 0x10, // 4
            0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
            0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
            0xF0, 0x10, 0x20, 0x40, 0x40, // 7
            0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
            0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
            0xF0, 0x90, 0xF0, 0x90, 0x90, // A
            0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
            0xF0, 0x80, 0x80, 0x80, 0xF0, // C
            0xE0, 0x90, 0x90, 0x90, 0xE0, // D
            0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
            0xF0, 0x80, 0xF0, 0x80, 0x80  // F
        ];

        // According to the technical reference, sprites are stored in the interpreter section of memory starting at hex 0x000
        for (let i = 0; i < sprites.length; i++) {
            this.memory[i] = sprites[i];
        }

    }

    loadProgramIntoMemory(program)
    {
        // load a ROM into memory
        // The specification tells us ROMS start at position 0x200
        // so we just need to start there and increment the memory
        for (let loc = 0; loc < program.length; loc++)
        {
            this.memory[0x200 + loc] = program[loc];
        }
    }

    /**
     * loadRom - Loading ROM from the server 
     * @param {} romName 
     */
    loadRom(romName)
    {
        var request = new XMLHttpRequest();
        var self = this;

        request.onload = function()
        {
            if(request.response)
            {
                let program = new Uint8Array(request.response);
                self.loadProgramIntoMemory(program);
            }
        }

        // for Vite to load the roms correctly, we need to add the roms to the public folder
        // you won't see that in the URL as that is an internal Vite thing
        request.open('GET', 'roms/' + romName, true);

        // Array buffer is a generic, fixed length raw binary data buffer
        // You cannot directly manipulate contents of an array buffer
        // This is a common format when working with audio and video files
        // really any type of data that cannot be represented as a simple text
        request.responseType = 'arraybuffer';

        request.send();
    }

    /**
     * Every cycle, the CPU fetches the next opcode from memory, decodes it, and executes it.
     * This function we will be calling in our step() function in chip8.js
     * This is like the main loop. it executes instructions, plays sounds, and renders to the canvas
     */
    cycle()
    {
        // speed relates to the FPS of the game
        // faster the speed more instructions are executed
        for( let i = 0; i < this.speed; i++)
        {
            if(!this.paused)
            {
                // each opcode instruction is 16-bits (2 bytes). Our memory is made up of 8-bit (1 byte) values
                //  We have to combine two pieces of memory to get the full opcode
                // | is a bitwise OR operation. This takes next command and performs a bitwise OR with the next command
                // effectively how to combine two 8-bit values into a 16-bit value
                let opcode = (this.memory[this.pc] << 8 | this.memory[this.pc + 1]);

                this.executeInstructions(opcode);
            }

            if (!this.paused)
            {
                this.updateTimers();
            }

            this.playSound();
            this.renderer.render();
        }
    }

    /**
     * If there are any timers that are going, we need to update them 
     */
    updateTimers()
    {
        if (this.delayTimer > 0)
        {
            this.delayTimer -= 1;
        }

        if (this.soundTimer > 0)
        {
            this.soundTimer -= 1;
        }
    }

    playSound()
    {
        if (this.soundTimer > 0)
        {
            this.speaker.play(440); // sound frequency of 440Hz
        }
        else
        {
            this.speaker.stop();
        }
    }

    executeInstructions(opcode)
    {
        // all instructions are 2 bytes long
        // every time we execute an instruction, we need to increment the program counter by 2
        // this will help the CPU know where to fetch the next opcode from
        this.pc += 2;

        /**
          Opcode reference variables
          nnn or addr - A 12-bit value, the lowest 12 bits of the instruction
          n or nibble - A 4-bit value, the lowest 4 bits of the instruction
          x - A 4-bit value, the lower(right) 2 bits of the high byte of the instruction
          y - A 4-bit value, the upper(left) 2 bits of the low byte of the instruction
          kk or byte - An 8-bit value, the lowest 8 bits of the instruction
        */

        // & is a bitwise AND operation. We use it to get the second bit
        // we shift the opcode by 8 bits

        // example - 0x5460. If we & bitwise AND with 0x0F00, we get 0x0400 
        // example - 0x5460. If we & bitwise AND with 0xFFFF, we get 0x5460
        // example - 0x5460. If we & bitwise AND with 0x00FF, we get 0x0060
        // example - 0x5460. If we & bitwise AND with 0xF000, we get 0x5000

        const x = (opcode & 0x0F00) >> 8;
        const y = (opcode & 0x00F0) >> 4;


        /**
          opcode operations
          Opcodes are broken into groups, organized by the higest bit
          0x0NNN - System Call (can be ignored)

 
 
        */ 

        switch (opcode & 0xF000) {
            case 0x0000:
                switch (opcode) {
                    case 0x00E0:
                        // 00E0 - CLS
                        this.renderer.clear(); // CLS (clear display)
                        break;
                    case 0x00EE:
                        // 00EE - RET
                        // this will return us from a subroutine
                        this.pc = this.stack.pop(); // RET (return from a subroutine)
                        break;
                }
        
                break;
            case 0x1000:
                // 1nnn - JP addr
                // Set the program counter to the value stored in nnn
                // bitwise operation to get 
                this.pc = (opcode & 0xFFF); // JP addr (jump to location nnn)
                break;
            case 0x2000:
                // 2nnn - CALL addr
                this.stack.push(this.pc); 
                this.pc = (opcode & 0xFFF); // CALL addr (call subroutine at nnn)
                break;
            case 0x3000:
                // 3xkk - SE Vx, byte
                // x position of the sprite. 
                // kk or byte - An 8-bit value, the lowest 8 bits of the instruction
                // if the value of v[x] is equal to kk, then the program counter is incremented by 2
                if (this.v[x] === (opcode & 0xff))
                {
                    this.pc += 2; // skip next instruction
                }
                break;
            case 0x4000:
                // 4xkk - SNE Vx, byte
                // similar to 3xkk, but instead skips the next instruction if Vx and kk are NOT equal
                if (this.v[x] !== (opcode & 0xFF))
                {
                    this.pc += 2; // skip next instruction
                }
                break;
            case 0x5000:
                // 5xy0 - SE Vx, Vy
                // skip next instruction if Vx and Vy are equal
                if (this.v[x] === this.v[y]) {
                    this.pc += 2;
                }
                break;
            case 0x6000:
                // 6xkk - LD Vx, byte
                // Set Vx to kk
                this.v[x] = (opcode & 0xFF);
                break;
            case 0x7000:
                // 7xkk - ADD Vx, byte
                // Set Vx to Vx + kk
                this.v[x] += (opcode & 0xFF);
                break;
            // 8xy0 - LD Vx, Vy
            // switch within a switch
            //  the last nibble of each one of these instructions ends with a value 0-7 or E.
            case 0x8000:
                switch (opcode & 0xF) {
                    case 0x0:
                        this.v[x] = this.v[y];
                        break;
                    case 0x1:
                        // 8xy1 - OR Vx, Vy
                        this.v[x] |= this.v[y];
                        break;
                    case 0x2:
                        // 8xy2 - AND Vx, Vy
                        this.v[x] &= this.v[y];
                        break;
                    case 0x3:
                        this.v[x] ^= this.v[y];
                        break;
                    case 0x4:
                        // 8xy4 - ADD Vx, Vy
                        // Set Vx to Vx + Vy, set VF to carry
                        let sum = (this.v[x] += this.v[y]);

                        this.v[0xF] = 0;
                    
                        if (sum > 0xFF) {
                            this.v[0xF] = 1;
                        }
                    
                        // Uint8Array only stores 8-bit values, so we don't need to worry about overflow
                        this.v[x] = sum; 
                        break;
                    case 0x5:
                        // 8xy5 - SUB Vx, Vy
                        // handling underflow
                        this.v[0xF] = 0;

                        if (this.v[x] > this.v[y]) {
                            this.v[0xF] = 1;
                        }
                    
                        this.v[x] -= this.v[y];
                        break;
                    case 0x6:
                        // 8xy6 - SHR Vx {, Vy}
                        /**
                         * This is a lot easier to understand if you look at its binary representation. 
                         * If Vx, in binary, is 1001, VF will be set to 1 since the least-significant 
                         * bit is 1. If Vx is 1000, VF will be set to 0.
                         */
                        this.v[0xF] = (this.v[x] & 0x1);
                        this.v[x] >>= 1;
                        break;
                    case 0x7:
                        // 8xy7 - SUBN Vx, Vy
                        this.v[0xF] = 0;

                        if (this.v[y] > this.v[x]) {
                            this.v[0xF] = 1;
                        }
                    
                        this.v[x] = this.v[y] - this.v[x];
                        break;
                    case 0xE:
                        // 8xyE - SHL Vx {, Vy}
                        // This instruction not only shifts Vx left 1, but also sets 
                        // VF to either 0 or 1 depending on if a condition is met.
                        this.v[0xF] = (this.v[x] & 0x80);
                        this.v[x] <<= 1; // multiply Vx by 2 by shifting it left 1.
                        break;
                }
        
                break;
            case 0x9000:
                // 9xy0 - SNE Vx, Vy
                if (this.v[x] !== this.v[y]) {
                    this.pc += 2; // program counter increment
                }
                break;
            case 0xA000:
                // Annn - LD I, addr
                // Set the value of register i to nnn. 
                // If the opcode is 0xA740 then (opcode & 0xFFF) will return 0x740.
                this.i = (opcode & 0xFFF);
                break;
            case 0xB000:
                // Bnnn - JP V0, addr
                this.pc = (opcode & 0xFFF) + this.v[0];
                break;
            case 0xC000:
                // Cxkk - RND Vx, byte
                // random number in the range 0-255 (0x00-0xFF)
                let rand = Math.floor(Math.random() * 0xFF);
                this.v[x] = rand & (opcode & 0xFF);
                break;
            case 0xD000:
                // Dxyn - DRW Vx, Vy, nibble
                // handles the drawing and erasing of pixels on the screen
                let width = 8; // each sprite is 8 pixels wide
                let height = (opcode & 0xF); //get last bit of opcode
            
                this.v[0xF] = 0;
            
                // loop through all the pixels of the sprite with nested loop
                for (let row = 0; row < height; row++) 
                {
                    // grabbing 8-bits of memory
                    let sprite = this.memory[this.i + row];
            
                    for (let col = 0; col < width; col++) 
                    {
                        // If the bit (sprite) is not 0, render/erase the pixel
                        if ((sprite & 0x80) > 0) 
                        {
                            // If setPixel returns 1, which means a pixel was erased, set VF to 1
                            if (this.renderer.setPixel(this.v[x] + col, this.v[y] + row)) {
                                this.v[0xF] = 1;
                            }
                        }
            
                        // Shift the sprite left 1. This will move the next next col/bit of the sprite into the first position.
                        // Ex. 10010000 << 1 will become 0010000
                        sprite <<= 1;
                    }
                }
                break;
            case 0xE000:
                switch (opcode & 0xFF) {
                    case 0x9E:
                        // Ex9E - SKP Vx
                        // Skip next instruction if key with the value of Vx is pressed
                        if (this.keyboard.isKeyPressed(this.v[x])) {
                            this.pc += 2;
                        }
                        break;
                    case 0xA1:
                        // ExA1 - SKNP Vx
                        // ! symbol to negate the value. oppososite of last opcode
                        if (!this.keyboard.isKeyPressed(this.v[x])) {
                            this.pc += 2;
                        }
                        break;
                }
        
                break;
            case 0xF000:
                switch (opcode & 0xFF) {
                    case 0x07:
                        // Fx07 - LD Vx, DT
                        this.v[x] = this.delayTimer;
                        break;
                    case 0x0A:
                        // Fx0A - LD Vx, K
                        // pause the emulator until a key is pressed
                        this.paused = true;

                        this.keyboard.onNextKeyPress = function(key) {
                            this.v[x] = key;
                            this.paused = false;
                        }.bind(this);
                        break;
                    case 0x15:
                        // Fx15 - LD DT, Vx
                        // sets the value of the delay timer to the value stored in register Vx
                        this.delayTimer = this.v[x];
                        break;
                    case 0x18:
                        // Fx18 - LD ST, Vx
                        // similar to previous opcde, but set the sound timer
                        this.soundTimer = this.v[x];
                        break;
                    case 0x1E:
                        // Fx1E - ADD I, Vx
                        this.i += this.v[x];
                        break;
                    case 0x29:
                        // Fx29 - LD F, Vx - ADD I, Vx
                        // setting I to the location of the sprite at Vx. 
                        // It's multiplied by 5 because each sprite is 5 bytes long.
                        this.i = this.v[x] * 5;
                        break;
                    case 0x33:
                        // Fx33 - LD B, Vx
                        //  grab the hundreds, tens, and ones digit from register Vx 
                        // and store them in registers I, I+1, and I+2 
                        this.memory[this.i] = parseInt(this.v[x] / 100);

                        // Get tens digit and place it in I+1. Gets a value between 0 and 99,
                        // then divides by 10 to give us a value between 0 and 9.
                        this.memory[this.i + 1] = parseInt((this.v[x] % 100) / 10);

                        // Get the value of the ones (last) digit and place it in I+2.
                        this.memory[this.i + 2] = parseInt(this.v[x] % 10);
                        break;
                    case 0x55:
                        // Fx55 - LD [I], Vx
                        for (let registerIndex = 0; registerIndex <= x; registerIndex++) {
                            this.memory[this.i + registerIndex] = this.v[registerIndex];
                        }
                        break;
                    case 0x65:
                        // Fx65 - LD Vx, [I]
                        //  opposite of Fx55. It reads values from memory starting 
                        // at I and stores them in registers V0 through Vx.
                        for (let registerIndex = 0; registerIndex <= x; registerIndex++) {
                            this.v[registerIndex] = this.memory[this.i + registerIndex];
                        }
                        break;
                }
        
                break;
        
            default:
                throw new Error('Unknown opcode ' + opcode);
        }

    }
}

export default CPU;