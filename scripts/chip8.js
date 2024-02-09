import Renderer from './renderer.js';
import Keyboard from './keyboard.js';
import Speaker from './speaker.js';
import CPU from './cpu.js';


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

function init()
{
    fpsInterval = 1000 / fps;
    then = Date.now();
    startTime = then;

    cpu.loadSpriteIntoMemory();
    cpu.loadRom('Landing.ch8')

    loop = requestAnimationFrame(step);
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

init();