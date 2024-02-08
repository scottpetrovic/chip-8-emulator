import Renderer from './renderer.js';
import Keyboard from './keyboard.js';
import Speaker from './speaker.js';


const renderer = new Renderer(10); // scale by pixels by 10
const keyboard = new Keyboard();
const speaker = new Speaker();

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

    // TESTING CODE
    renderer.testRender();
    renderer.render();

    loop = requestAnimationFrame(step);
}

function step()
{
    now = Date.now();
    elapsed = now - then;

    if (elapsed > fpsInterval)
    {
        // Cycle the CPU. We will come back to this later.
    }

     loop = requestAnimationFrame(step);
}

init();