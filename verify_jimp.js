const Jimp = require('jimp');

async function test() {
    console.log("Testing Jimp local flow...");
    try {
        // Create a new image 100x100
        // Jimp constructor might differ slightly by version, but new Jimp(w, h, color) is standard
        new Jimp(100, 100, 0xFF0000FF, (err, image) => {
            if (err) throw err;
            console.log('Created new image 100x100');
            image.resize(50, 50);
            console.log('Resized to 50x50');
            image.getBufferAsync(Jimp.MIME_JPEG).then(buffer => {
                console.log('Success: Image resized, buffer size:', buffer.length);
            });
        });
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

test();
