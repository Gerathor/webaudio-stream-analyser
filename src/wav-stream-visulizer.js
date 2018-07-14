

const StreamVisulizer = () => {
    
    let context;
    
    let hasCanceled = false;

    const feed = buf => {
        // create audio context

        // scheulde buffer

        // decode
    };

    return {
        feed : buf => feed(buf),
        stop : () => {
            hasCanceled = true;
            if (context) {
                context.close();
            }
        },
        recorder : () => recorder(),
        saveWav : () => saveWav()        
    }
};

export default StreamVisulizer;

