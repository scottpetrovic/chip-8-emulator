class Speaker
{
    constructor()
    {
        this.audioCtx = new AudioContext()

        this.gain = this.audioCtx.createGain()

        // final destination of all the audioin the AudioContext
        this.finish = this.audioCtx.destination

        // connect a gain property to the audio context to be able to control it
        this.gain.connect(this.finish)
    }
}

export default Speaker;