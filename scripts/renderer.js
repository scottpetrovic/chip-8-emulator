// handles everything graphics related
class Renderer
{
    // scale: allows us to scale the display up and down
    constructor(scale)
    {
        // x and y dimensions of the display (comes from chip-8 specs)
        this.cols = 64;
        this.rows = 32;

        // on a monitor, this is very difficult to see, so we scale the display up
        this.scale = scale;

        // get canvas and context(ctx) to work with graphics
        this.canvas = document.querySelector('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // set canvas size in pixels * scale
        this.canvas.width = this.cols * this.scale;
        this.canvas.height = this.rows * this.scale;

        // create a display buffer to hold pixel state of entire screen/display
        // setting the array this way sets a very specific size
        // this will later be used to draw the canvas
        this.display = new Array(this.cols * this.rows);
    }

    setPixel(x, y)
    {
        if( x > this.cols)
        {
            // offset it the entire length... wrapping it around to the beginning
            x -= this.cols; 
        }
        else if( x < 0)
        {
            x += this.cols;
        }

        // same logic for rows ( y position)
        if ( y > this.rows)
        {
            y -= this.rows;
        }
        else if ( y < 0)
        {
            y += this.rows;
        }

        // location in array (remember this is 1 dimensional array)
        let pixelLoc = x + (y * this.cols);

        // update the pixel on the display
        // XOR bitwise operation.
        // toggling the value of the pixel (0 to 1, 1 to 0)
        // 0 XOR 1 becomes 1
        // 1 XOR 1 becomes 0
        this.display[pixelLoc] ^= 1;

        // if this returns true, a pixel is erased
        // if this returns false, nothing was erased
        return !this.display[pixelLoc];
    }

    clear()
    {
        this.display = new Array(this.cols * this.rows);
    }

    render()
    {
        // clears the display every render cycle
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // loop through the display array and draw pixels (remember it is 1 dimensional)
        for (let i = 0; i < this.cols * this.rows; i)
        {
            // grab the x position of the pixel base off i
            // using modulo to determine which column we are on
            // 4x4 example. If we are on element 5, 5 % 4 = 1 (first column)
            let x = (i % this.cols) * this.scale;

            // grab the y position of the pixel based off
            // 4x4 example. If we are on element 5, 5 / 4 = 1 (second row)
            let y = Math.floor(i / this.cols) * this.scale;

            if(this.display[i])
            {
                // set the pixel color
                this.ctx.fillStyle = '#000';

                // place a pixel at position (x, y) with a width and height
                this.ctx.fillRect(x, y, this.scale, this.scale);
            }
        }
    }

    testRender()
    {
        this.setPixel(0,0);
        this.setPixel(5, 2);
    }


}

export default Renderer;