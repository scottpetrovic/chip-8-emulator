/**
 * Spec information for original Chip-8 keyboard
 * The computers which originally used the Chip-8 Language had a 16-key hexadecimal keypad with the following layout: 
 * 
   1	2	3	C
   4	5	6	D
   7	8	9	E
   A	0	B	F
 * 
   We are going map the bits to the keyboard keys as follows:
 */

class Keyboard
{
    constructor()
    {
        this.KEYMAP = {
            49: 0x1,
            50: 0x2,
            51: 0x3,
            52: 0xC,
            81: 0x4,
            87: 0x5,
            69: 0x6,
            82: 0xD,
            65: 0x7,
            83: 0x8,
            68: 0x9,
            70: 0xE,
            90: 0xA,
            88: 0x0,
            67: 0xB,
            86: 0xF
        };

        this.keyPressed = [];

        // some chip-8 instructions are waiting for a key press
        this.onNextKeyPress = null;

        window.addEventListener('keydown', this.onKeyDown.bind(this), false);
        window.addEventListener('keyup', this.onKeyUp.bind(this), false);

    }

    // check if specific key is pressed
    isKeyPressed(keyCode)
    {       
        return this.keyPressed[keyCode];
    }

    onKeyDown(event)
    {
        // this event.which is not recommended for modern browsers
        // so need to test things out and potentially change later
        const unicodeValueOfKeyboardKey = event.which

        let key = this.KEYMAP[unicodeValueOfKeyboardKey]
        this.keyPressed[key] = true // update key pressed array

        if (this.onNextKeyPress !== null && key)
        {
            this.onNextKeyPress(parseInt(key))
            this.onNextKeyPress = null
        }
    }

    onKeyUp(event)
    {
        const key = this.KEYMAP[event.which]
        this.keyPressed[key] = false // remove from key pressed array
    }


}

export default Keyboard;