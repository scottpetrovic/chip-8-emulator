import Renderer from './renderer.js';
import Keyboard from './keyboard.js';
import Speaker from './speaker.js';
import CPU from './cpu.js';

// Built from tutorial at https://www.freecodecamp.org/news/creating-your-very-own-chip-8-emulator/

// technical reference to make this possible: http://devernay.free.fr/hacks/chip8/C8TECH10.HTM#2.2



const renderer = new Renderer(10); // scale by pixels by 10
const keyboard = new Keyboard();
const speaker = new Speaker();
const cpu = new CPU(renderer, keyboard, speaker);

let loop;
let fps = 30;
let fpsInterval;
let startTime;
let now;
let then;
let elapsed;
let romArrayData;

async function init()
{
    fpsInterval = 1000 / fps;
    then = Date.now();
    startTime = then;

    cpu.loadSpriteIntoMemory();
    romArrayData = await cpu.loadRom('Landing.ch8')
    loadROMDataToDOM(romArrayData);
    loop = requestAnimationFrame(step);
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
        textBuilder += ` ${data} <strong>${romHexData[idx]}</strong>  \n`;
    });
    romBinaryDOM.innerHTML = textBuilder;
}

function step()
{
    now = Date.now();
    elapsed = now - then;

    if (elapsed > fpsInterval)
    {
        cpu.cycle();
    }

     loop = requestAnimationFrame(step);
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


init();