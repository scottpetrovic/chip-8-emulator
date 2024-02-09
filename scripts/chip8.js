import Renderer from './renderer.js';
import Keyboard from './keyboard.js';
import Speaker from './speaker.js';
import CPU from './cpu.js';

// Built from tutorial at https://www.freecodecamp.org/news/creating-your-very-own-chip-8-emulator/
// technical reference to make this possible: http://devernay.free.fr/hacks/chip8/C8TECH10.HTM#2.2
let renderer
let keyboard
let speaker
let cpu

const cpuCyclesPerSecond = 60; // lower numbers will slow down the game ( try 1)
const cpuCycleInterval = 1000 / cpuCyclesPerSecond;
let now;
let then;
let elapsed = 0;
let romArrayData;
let gameFilename = 'Landing.ch8'; // initial game to load

// we will show the program counter (pc) in the DOM for educational reasons
const pcDOM = document.getElementById('programCounter');


async function loadGame(gameFilename)
{
    then = Date.now();

    renderer = new Renderer(10); // scale by pixels by 10
    keyboard = new Keyboard();
    speaker = new Speaker();
    cpu = new CPU(renderer, keyboard, speaker);

    // there are some built-in spritse as part of the chip-8 system
    // anything other than this needs to be stored in the ROM file
    cpu.loadSpriteIntoMemory();

    romArrayData = await cpu.loadRom(gameFilename);
    loadROMDataToDOM(romArrayData);
    requestAnimationFrame(step);
}

function loadROMDataToDOM()
{
    // program will just come back as numbers. let's see a few different 
    // interpretations of the program data
    
    // open Chrome developer tools. There is a microchip icon next to the console output with this
    // ArrayBuffer objects allow you to see the data if you click on that icon
    console.log('Array buffer data', romArrayData) 

    const romBinaryData = arrayBufferAsBinary(romArrayData);
    const romHexData = arrayBufferAsHex(romArrayData);
  
    console.log('array buffer as binary (0s and 1s)', romBinaryData)
    console.log('array buffer as hexadecimal', romHexData)

    // loop through each binary data and add it to a textarea
    const romBinaryDOM = document.getElementById('romDataDOM');
    let textBuilder = '';
    romBinaryData.forEach( (data, idx) => {

        // do a line break every other byte code. An opcode is 2 bytes
        if (idx % 2 === 0)
        {
            textBuilder += '<br> OpCode: ';
        }
        // <strong>${romHexData[idx].toUpperCase()
        textBuilder += `${data}</strong> &nbsp;&nbsp;&nbsp;`;

    });
    romBinaryDOM.innerHTML = textBuilder;
}

function step()
{
    now = Date.now();
    elapsed += now - then;

    // how fast we should call the operations to process
    if (elapsed > cpuCycleInterval)
    {
        // process instructions
        cpu.cycle();

        // show the next opcode to run on the DOM. Opcode combines two bytes
        // the cpu.memory is an array of bytes. We are combining two bytes to make an opcode
        // if we slow down the cycles, this could be more clear
        // see CPU.js to see more information about this operation
        let nextOpcode = (cpu.memory[cpu.pc] << 8 | cpu.memory[cpu.pc + 1]);
        pcDOM.innerHTML = binaryToHex(nextOpcode);

        elapsed = 0;
        then = Date.now();
    }

    // game loop, so need to keep calling this continuously
    requestAnimationFrame(step);

}

// function that converts decimal into hexadecimal
function binaryToHex(d) {
    return '0x' + d.toString(16).padStart(2, "0").toUpperCase();
}


// internal debugging for seeing the memory
function arrayBufferAsBinary(arrayBuffer) {

    let uint8Array = new Uint8Array(arrayBuffer);

    // padStart is a string method that will add 0s to the left of the string until it is the length of 8
    // toString(2) converts a number to a string. The 2 is the radix, which is the base of the numeral system (0 or 1)
    let binaryData = Array.from(uint8Array, byte => byte.toString(2).padStart(8, '0'));

    // brings all the values back to together as one string to display
    return binaryData;
}

function arrayBufferAsHex(arrayBuffer) {

    let uint8Array = new Uint8Array(arrayBuffer);

    // padStart(2) makes sure each value is stored as 2 characters
    let hexData = Array.from(uint8Array, byte => byte.toString(16).padStart(2, '0'));
    return hexData;
}

// watch out for the select HTML tag for changes
// since we are using modules in javascript, we can't use the normal onChange attribute
document.getElementById('gameSelect').addEventListener('change', function() {
    loadGame(this.value);
});

// pause the game
document.getElementById('pauseButton').addEventListener('click', function() {

    if (this.innerHTML === 'Pause Game')
    {        
        cpu.paused = true;
        this.innerHTML = 'Play Game';
    }
    else
    {
        cpu.paused = false;
        this.innerHTML = 'Pause Game';
    }
});



// load the game to begin
loadGame(gameFilename);