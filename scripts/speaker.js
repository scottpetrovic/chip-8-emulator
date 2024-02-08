class Speaker
{
    constructor()
    {
        // AudioContext is a Web API that handles audio processing
        this.audioCtx = new AudioContext()

        this.gain = this.audioCtx.createGain()

        // final destination of all the audio in the AudioContext
        this.finish = this.audioCtx.destination

        // connect a gain property to the audio context to be able to control it
        this.gain.connect(this.finish)
    }

    play (frequency)
    {
        if(this.audioCtx && !this.oscillator)
        {
            this.oscillator = this.audioCtx.createOscillator()

            // set the frequency of the oscillator
            this.oscillator.frequency.setValueAtTime(frequency || 440, this.audioCtx.currentTime)

            this.oscillator.type = 'square' // square waves sound more like a beep

            // connect the gain and start the sound
            this.oscillator.connect(this.gain)
            this.oscillator.start()
            
        }
    }

    stop ()
    {
        if (this.oscillator)
        {
            this.oscillator.stop()
            this.oscillator.disconnect() // good for performance and makes sure routing graph is cleaned up
            this.oscillator = null
        }
    }
}

export default Speaker;