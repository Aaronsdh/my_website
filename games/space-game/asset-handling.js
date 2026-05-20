/*
Asset Handling

Official design direction:
- Keep all asset paths and image loading helpers in this file.
- Return grouped assets from loadGameAssets() so gameplay code does not know
  individual image paths.
*/

// ---------------------------------------------------------------------------
// Global constants
// ---------------------------------------------------------------------------

const ALLIANCE_SHIP_IMAGE_PATH = '/assets/images/alliance-ship.png';
const ALIEN_SHIP_IMAGE_PATH = '/assets/images/alien-ship.png';
const LASER_BEAM_IMAGE_PATH = '/assets/images/laser-beam.png';

// ---------------------------------------------------------------------------
// Loading helpers
// ---------------------------------------------------------------------------

// Returns an HTMLImageElement once the browser has finished loading the file.
function loadAsset(path) {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.src = path;
        img.onload = () => { resolve(img); };
        img.onerror = () => { reject(new Error(`Failed to load image: ${path}`)); };
    });
}

// Loads every image needed before the first frame can render.
async function loadGameAssets() {
    const allianceShip = await loadAsset(ALLIANCE_SHIP_IMAGE_PATH);
    const alienShip = await loadAsset(ALIEN_SHIP_IMAGE_PATH);
    const laserBeam = await loadAsset(LASER_BEAM_IMAGE_PATH);

    return {
        allianceShip,
        alienShip,
        laserBeam
    };
}
