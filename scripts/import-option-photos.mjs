// Copies the equipment photos from a downloaded copy of the sales team's Drive folders ("Step 3 Power,
// Drivetrain & Suspension" and "Step 4 Accessories", unzipped anywhere) into image/Options, resized for the
// option cards. Files are found by name in any subfolder.
//
//   node scripts/import-option-photos.mjs "C:\path\to\downloaded folders"
//
// The names on the right are the ones OPTION_PHOTOS in app.js points to.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'image', 'Options');

const PHOTOS = {
    'Trojan T875 8V.jpg': 'battery-trojan-8v',
    'Battlite.jpg': 'battery-battlite',
    'GC Apex Tempo LED Headlights & Tail lights.jpeg': 'light-gc-apex',
    'Club Car Tempo Led Headlights & Tail lights.jpeg': 'light-cc-deluxe',
    '12 Triton Machined Black with 12 21535-12.jpeg': 'wheel-12-triton-215',
    '12 Hela Bright Chrome with 12 21535-12.jpeg': 'wheel-12-hela-215',
    '10in Kenda Pro Tour 5 spoke gunmetal SJK-0259.jpeg': 'wheel-10-5spoke-gunmetal',
    '14 Gridlock with 14 225 30-14.jpeg': 'wheel-14-gridlock-machined-225',
    '14 Gridlock Gloss Black with 14 225 30-14.jpeg': 'wheel-14-gridlock-gloss-225',
    '14 Talon with 14 225 30-14.jpeg': 'wheel-14-talon-225',
    '12 Triton Machined Black with 12 23x10.5-12.jpeg': 'wheel-12-triton-23105',
    '14 Aerion Wheel Gloss Black with 14 225 30-14.jpeg': 'wheel-14-aerion-gloss-225',
    '14 Aerion Wheel Gloss Black with 14 Kraken 23x10-14.jpg': 'wheel-14-aerion-gloss-kraken',
    '14 Aerion Wheel Black Chrome with 14 Kraken 23x10-14.jpg': 'wheel-14-aerion-chrome-kraken',
    '14 Athena Solid Gloss Black with 14 Kraken 23x10-14.jpg': 'wheel-14-athena-gloss-kraken',
    '14 Atlas Gunmetal with Kraken 23x10-14.jpg': 'wheel-14-atlas-gunmetal-kraken',
    '14 Zeus Gloss Black and Machined with Kraken 23x10-14.jpg': 'wheel-14-zeus-kraken',
    '14 Mercury with Kraken 23x10-14.jpg': 'wheel-14-mercury-kraken',
    '12 Hela Bright Chrome with 12 23x10.5-12.jpeg': 'wheel-12-hela-23105',
    'Bag Cover Black.jpeg': 'bag-cover-black',
    'Bag Cover Beige.jpeg': 'bag-cover-beige',
    'Bag Cover White.jpeg': 'bag-cover-white',
    'Magnetic Bag Cover black.jpeg': 'bag-cover-magnetic-black',
    'Magnetic Bag Cover beige.jpeg': 'bag-cover-magnetic-beige',
    'Sand Bottle.jpg': 'sand-bottle',
    'Ball washer.jpg': 'ball-washer',
    'CADDY COOLER.jpg': 'caddy-cooler',
    'Club Car Caddy Stand SJK-1374.jpg': 'caddy-stand',
    'GC  3.5in Lift.jpg': 'lift-gc-35',
    'Tempo Fender Flares w Reflector SJK-1542.jpg': 'fender-tempo-3',
    'Tempo Fender 1.5in.jpg': 'fender-tempo-15',
    'MAdjax Brush Guard SJK-1543.png': 'brush-guard',
    'Madjax Nerf Bar Side Step SJK-0119.png': 'nerf-bar',
    'Genesis Rear Seat Beige.jpg': 'flip-genesis',
    'Club Car onward premium flip seat.jpg': 'flip-onward',
    'Club Car Bluetooth soundbar.jpeg': 'audio-cc-soundbar',
    '27 Sound Bar.jpg': 'audio-gc-soundbar-27',
    'Wireless Charging Left & Right SJK-1510.jpg': 'charge-wireless',
    'Type C Outlet QC3.0 PD  Voltmeter and button switch SJK-1593.jpg': 'charge-usb-c-voltmeter',
    'PremSteeringWheel.webp': 'steering-premium',
    'side mirror.jpg': 'mirror-side',
    'Side Mirror with Led Turn Signal.jpg': 'mirror-side-signal',
    'Club Car 5 Pannel Mirror SJK-0154.jpg': 'mirror-5-panel',
    // One photo for both lengths (the separate short and long photos are only small thumbnails)
    'Convex Inner Mirror SJK-1461.jpg': ['mirror-convex-short', 'mirror-convex-long'],
    'onward-overhead-console-accessory-600x415 (1).jpg': 'storage-overhead',
    'under seat storage.jpg': 'storage-under-seat',
    // The 2-seater beige photo is a small thumbnail; the 2+2 photo shows the same enclosure and color
    '2+2 Three-sided rain enclosure Biege (CCJX).jpeg': 'enclosure-3-beige',
    'Three-sided rain enclosure White (CCJX).jpeg': 'enclosure-3-white',
    'Three-sided rain enclosure Black (CCJX).jpeg': 'enclosure-3-black',
    'Two-sided rain enclosure Black (CC).jpg': 'enclosure-2-black'
};

const source = process.argv[2];
if (!source || !fs.existsSync(source)) {
    console.error('Usage: node scripts/import-option-photos.mjs <folder with the downloaded Drive folders>');
    process.exit(1);
}

// Every file under the source folder, by lower-case name (Drive zips can rename spaces or case)
const key = name => name.toLowerCase().replace(/\s+/g, ' ').trim();
const found = new Map();
(function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else found.set(key(entry.name), p);
    }
})(source);

fs.mkdirSync(outDir, { recursive: true });
const missing = [];
for (const [driveName, outs] of Object.entries(PHOTOS)) {
    const file = found.get(key(driveName));
    if (!file) { missing.push(driveName); continue; }
    for (const out of [].concat(outs)) {
        // Up to 900 x 675 (the cards are 4:3), on white, as a mid-quality JPEG; the build adds a WebP copy
        await sharp(file).rotate().resize(900, 675, { fit: 'inside', withoutEnlargement: true })
            .flatten({ background: '#FFFFFF' }).jpeg({ quality: 82, mozjpeg: true })
            .toFile(path.join(outDir, `${out}.jpg`));
        console.log(`  ${out}.jpg  <-  ${path.relative(source, file)}`);
    }
}
console.log(`\n${Object.keys(PHOTOS).length - missing.length} of ${Object.keys(PHOTOS).length} photos written to image/Options.`);
if (missing.length) console.log(`Not found:\n  ${missing.join('\n  ')}`);
