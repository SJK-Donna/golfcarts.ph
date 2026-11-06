// Paint maps for cart photos, used by the live color preview (recolor.js): which pixels are body, seat and canopy.
// Each part is outlined (`polys`, in the photo's pixels; `exclude` cuts holes such as a badge or a grab handle) and,
// inside its outline, only pixels that pass the part's colour test count: near a hue, and saturation / lightness in
// range. Gaps are closed and specks smaller than `minArea` dropped. The white studio backdrop never counts.
// Output: image/Products/builds/masks/<name>.png at the photo's size, red = body, green = seat, blue = canopy (the
// format of scripts/build-masks.mjs). With `tones`, also <name>-tones.png for a striped seat: red = bolster
// (darkest), green = panel, blue = stripe (lightest), see recolor.js paintToneSeat.
//
//   node scripts/build-color-masks.mjs                 writes every mask
//   node scripts/build-color-masks.mjs <dir> [name]    also writes each photo with its parts tinted into <dir>
//                                                      (body green, seat magenta, canopy cyan), only <name> if given
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// A part: hue [centre, how far in degrees] (optional), sat / light [min, max], close (gap size, px), minArea, polys,
// exclude, keepWhite (a white part traced tightly: its brightest highlights count, though they match the backdrop).
// `file`: the photo, when it isn't image/Products/builds/<name>.jpg
const RED = { hue: [355, 22], sat: [0.3, 1], light: [0.05, 0.85] };
// The Golfer 4 photos are one cart shot from one camera (the Scratch and Pro photos line up; the Golfer photo is
// framed a little wider, so it has its own outlines)
const G4_FRONT = [[934, 640], [960, 600], [1010, 578], [1120, 572], [1260, 580], [1360, 600], [1425, 640], [1450, 700], [1455, 770], [1400, 800], [1240, 810], [1100, 800], [990, 780], [934, 750]];
const G4_REAR = [[145, 655], [165, 628], [200, 618], [262, 620], [298, 640], [305, 680], [380, 690], [470, 697], [560, 702], [578, 716], [575, 840], [300, 840], [140, 800]];
// Traced on the Pro photo; the Scratch photo sits 4px to the right
const shift = (polys, dx) => polys.map(p => p.map(([x, y]) => [x + dx, y]));
const G4_SEATS = [
    // Rear seat back (its right side is behind the front seat back), front seat back, and both cushions
    [[268, 470], [280, 440], [310, 424], [365, 421], [410, 434], [440, 446], [465, 446], [485, 434], [520, 426], [520, 580], [460, 585], [415, 593], [350, 598], [300, 591], [268, 566]],
    [[510, 455], [530, 430], [570, 420], [630, 420], [680, 430], [705, 445], [725, 447], [745, 430], [780, 419], [840, 420], [880, 435], [900, 465], [905, 525], [900, 565], [885, 585], [825, 592], [750, 590], [720, 592], [690, 602], [630, 609], [570, 607], [530, 600], [512, 580], [507, 525]],
    [[315, 640], [350, 630], [450, 625], [560, 620], [650, 612], [760, 610], [860, 612], [925, 625], [925, 690], [900, 705], [760, 708], [640, 706], [560, 697], [450, 695], [340, 698], [315, 680]]
];
// The black grab handles in front of each seat
const G4_HANDLES = [
    [[267, 577], [280, 567], [300, 570], [315, 585], [340, 620], [365, 660], [372, 680], [362, 688], [345, 680], [325, 660], [305, 650], [290, 640], [275, 625], [267, 600]],
    [[505, 585], [520, 575], [540, 577], [560, 597], [590, 635], [620, 675], [630, 700], [620, 710], [600, 700], [580, 680], [560, 670], [540, 660], [520, 645], [507, 620]]
];
// Lifestyle 4 (the Essential, Signature and Elite photos, one camera): the seats' outline, and what is cut out of it
// (the grab handles and the windshield post in front of the seats)
const L4_SEATS = [
    [[246, 479], [265, 439], [311, 426], [397, 429], [443, 446], [469, 433], [502, 426], [502, 600], [489, 603], [410, 610], [311, 613], [252, 597]],
    [[485, 459], [502, 433], [548, 423], [640, 423], [699, 436], [725, 429], [771, 419], [837, 426], [876, 459], [886, 511], [883, 564], [863, 597], [804, 603], [725, 603], [679, 617], [600, 617], [508, 603], [489, 577], [482, 511]],
    [[325, 630], [443, 620], [574, 617], [640, 607], [771, 603], [896, 617], [903, 656], [896, 695], [804, 715], [692, 722], [640, 715], [574, 695], [528, 689], [443, 689], [351, 682]]
];
const L4_HANDLES = [
    [[242, 572], [262, 562], [285, 566], [300, 585], [325, 625], [344, 665], [344, 684], [328, 686], [305, 660], [282, 640], [258, 622], [242, 600]],
    [[479, 582], [498, 572], [520, 576], [540, 600], [570, 640], [598, 680], [600, 697], [585, 700], [560, 682], [535, 662], [505, 642], [482, 615]],
    [[850, 380], [875, 380], [905, 600], [915, 800], [895, 800], [880, 600]]
];
const MASKS = {
    // Essential 4 (the red Elite photo): two-tone seats, black bolsters and grey panels, painted tone by tone so a
    // one-colour seat comes out even. The handles and the windshield post in front of the seats are cut out. One
    // canopy is offered, so the roof isn't mapped
    'lifestyle-4-elite': {
        body: { ...RED, sat: [0.32, 1], light: [0.06, 0.85], close: 3, minArea: 600 },
        seat: { sat: [0, 0.3], light: [0.03, 0.85], close: 2, minArea: 400,
            polys: L4_SEATS, exclude: L4_HANDLES },
        // The grey panels, traced (the rest of the seat is black bolster), as the Tsunami seats' are in build-masks.mjs:
        // rear seat back, the front seat back's two panels, and the two cushions
        tones: { panels: [
            [[300, 452], [395, 452], [420, 590], [318, 590]],
            [[557, 445], [655, 445], [670, 582], [570, 582]],
            [[750, 440], [838, 440], [850, 582], [757, 582]],
            [[405, 632], [500, 632], [510, 680], [412, 680]],
            [[695, 644], [825, 644], [825, 695], [700, 695]]
        ], stripeFrac: 0.2 }
    },
    // Golfer 4 Scratch: Sangria body; its Tsunami seats have red panels too, so the body counts only inside the
    // front body and the rear side panel. Seats: red panels, black bolsters and silver stripes (the handles are
    // darker than the bolsters, and cut out too). One canopy is offered, so the roof isn't mapped
    'golfer-4-scratch': {
        body: { ...RED, close: 4, minArea: 600, polys: [G4_FRONT, G4_REAR] },
        // Its Tsunami seat backs are taller than the Pro's, with black headrest tops, so they have their own outline
        seat: { any: [{ hue: [356, 20], sat: [0.25, 1], light: [0.1, 0.85] }, { sat: [0, 0.3], light: [0.03, 0.8] }], exclude: shift(G4_HANDLES, 4), close: 2, minArea: 400, polys: [
            [[270, 460], [280, 440], [310, 429], [315, 395], [330, 388], [410, 389], [419, 400], [420, 430], [450, 435], [485, 432], [491, 395], [505, 390], [520, 392], [520, 580], [460, 585], [390, 592], [335, 595], [290, 580], [272, 545]],
            [[510, 470], [520, 445], [545, 430], [550, 395], [565, 387], [660, 385], [667, 400], [667, 430], [690, 437], [725, 440], [735, 425], [740, 395], [755, 385], [845, 386], [852, 400], [852, 430], [880, 440], [905, 465], [912, 520], [910, 570], [895, 585], [835, 595], [760, 590], [710, 605], [640, 610], [580, 610], [540, 600], [517, 575], [510, 520]],
            [[306, 632], [410, 622], [510, 618], [620, 600], [710, 598], [810, 600], [925, 622], [934, 650], [928, 695], [860, 718], [735, 724], [660, 724], [610, 718], [560, 704], [510, 700], [460, 702], [410, 702], [360, 700], [308, 692]]
        ] },
        // Smoothed (each pixel takes its neighbours' tone), so a highlight on a bolster or a shadow on a stripe doesn't flip
        // tone: judged pixel by pixel, a one-colour seat came out blotchy
        tones: { bolster: { sat: [0, 0.3], light: [0, 0.24] }, panel: { hue: [356, 24], sat: [0.25, 1] }, stripe: { sat: [0, 0.3], light: [0.24, 1] }, smooth: 6 }
    },
    // Golfer 4 Pro: the body is a red-orange (hue about 10), the Camello seats a tan (hue about 23)
    'golfer-4-pro': {
        body: { hue: [9, 12], sat: [0.25, 1], light: [0.04, 0.96], close: 4, minArea: 600, polys: shift([G4_FRONT, G4_REAR], -4) },
        seat: { hue: [23, 9], sat: [0.18, 0.85], light: [0.12, 0.85], polys: G4_SEATS, exclude: G4_HANDLES, close: 2, minArea: 400 }
    },
    // Essential 4 Essential and Signature photos: the same cart and camera as the Elite one (they line up to the pixel),
    // so the body takes the Elite photo's body map as its outline (white, and cashmere, aren't found by colour), and
    // the plain beige seats are found inside the Elite seats' outline. The Essential seat is also the plain seat an
    // Elite one-colour choice is painted on (recolor.js plainSeatFrom)
    ...Object.fromEntries(['essential', 'signature'].map(level => [`lifestyle-4-${level}`, {
        body: { from: 'lifestyle-4-elite', grow: 1, any: [{ sat: [0, 0.6], light: [0.3, 1] }, { light: [0.12, 1] }], keepWhite: true, close: 2, minArea: 600 },
        seat: { hue: [35, 15], sat: [0.1, 0.75], light: [0.15, 0.92], close: 2, minArea: 400, polys: L4_SEATS, exclude: L4_HANDLES }
    }])),
    // Essential 2+2 (the Sangria Red studio photo, a cut-out): red body, white front and rear-facing seats, and the
    // tan roof (its rolled-up curtains, grey, stay as they are)
    'lifestyle-2-2-sangria': { file: 'image/Products/Tempo 2+2 - Family - Sangria Red.png',
        canopy: { hue: [33, 16], sat: [0.04, 0.75], light: [0.25, 0.99], close: 4, minArea: 300,
            polys: [[[229, 215], [260, 175], [560, 128], [610, 122], [700, 150], [860, 210], [955, 255], [930, 290], [700, 290], [600, 265], [380, 240], [300, 248], [240, 265]]] },
        body: { hue: [355, 24], sat: [0.12, 1], light: [0.04, 0.9], close: 3, minArea: 300, polys: [[[100, 500], [1000, 500], [1000, 1000], [100, 1000]]] },
        seat: { sat: [0, 0.2], light: [0.55, 1], keepWhite: true, close: 2, minArea: 200, polys: [
            [[515, 385], [540, 372], [640, 372], [700, 385], [800, 400], [812, 420], [810, 480], [790, 500], [760, 560], [745, 590], [640, 595], [560, 592], [540, 560], [530, 520], [515, 470]],
            [[790, 395], [840, 398], [880, 430], [892, 470], [890, 525], [800, 528], [790, 480]]
        ] }
    },
    // Essential 4+2 (a cut-out): white body (the cowl and the side panel; the headlight and badge cut out), black
    // seats (front, rear and rear-facing; the grab handles in front of them cut out). One canopy is offered
    'lifestyle-4-2': { file: 'image/Products/4 plus2 Lifted.png',
        // Near white, HSL saturation runs high for a faint tint, so light pixels may be more saturated
        body: { any: [{ sat: [0, 0.22], light: [0.5, 1] }, { sat: [0, 0.65], light: [0.78, 1] }], keepWhite: true, close: 2, minArea: 300,
            polys: [
                [[140, 545], [160, 520], [260, 515], [350, 520], [440, 528], [460, 560], [450, 620], [400, 640], [250, 640], [160, 630], [140, 600]],
                [[684, 488], [800, 480], [905, 470], [1000, 455], [1000, 560], [985, 598], [870, 603], [700, 604], [684, 570]]
            ],
            exclude: [[[228, 556], [312, 550], [316, 612], [232, 616]], [[170, 575], [218, 575], [218, 620], [170, 620]]] },
        // Very dark pixels count at any saturation (near black, HSL saturation is unreliable)
        seat: { any: [{ sat: [0, 0.4], light: [0, 0.55] }, { light: [0, 0.16] }, { sat: [0, 0.25], light: [0.55, 0.8] }], close: 3, minArea: 300,
            polys: [[[500, 370], [560, 358], [640, 365], [690, 370], [700, 345], [760, 333], [880, 333], [900, 345], [905, 420], [900, 500], [880, 530], [700, 532], [600, 545], [430, 545], [415, 500], [470, 470], [500, 465]]],
            exclude: [
                // Front seat's handle (a thin arc), the rear seat's handle (a bar rising to the right) and the third's
                [[428, 495], [442, 458], [465, 444], [490, 447], [499, 470], [499, 490], [491, 490], [491, 472], [486, 456], [466, 453], [449, 463], [436, 497]],
                [[605, 567], [620, 530], [640, 495], [665, 465], [690, 445], [710, 440], [722, 447], [720, 462], [705, 470], [685, 487], [665, 515], [650, 545], [635, 567]],
                [[808, 522], [825, 480], [840, 455], [860, 447], [878, 450], [882, 470], [875, 500], [868, 522]]
            ] }
    },
    // Villager 6 (a cut-out): white body (the cowl, headlights and badge cut out; the seat pedestals and side panel)
    // and the white roof. Its seats aren't offered in other colours
    'villager-6': { file: 'image/Products/Villager 6.png',
        // Shaded white (the pedestals' sides) counts down to mid grey
        body: { any: [{ sat: [0, 0.22], light: [0.5, 1] }, { sat: [0, 0.65], light: [0.78, 1] }, { sat: [0, 0.15], light: [0.3, 0.5] }], keepWhite: true, close: 2, minArea: 300,
            polys: [
                [[118, 600], [150, 560], [200, 545], [300, 540], [420, 530], [515, 525], [525, 560], [535, 650], [530, 700], [460, 715], [300, 712], [200, 705], [118, 690]],
                [[528, 622], [700, 628], [760, 618], [990, 605], [1000, 688], [900, 703], [811, 716], [700, 740], [573, 768], [528, 750]]
            ],
            exclude: [[[131, 605], [169, 605], [169, 666], [131, 666]], [[319, 618], [430, 618], [430, 679], [319, 679]], [[203, 637], [276, 637], [276, 669], [203, 669]]] },
        canopy: { any: [{ sat: [0, 0.22], light: [0.45, 1] }, { sat: [0, 0.65], light: [0.78, 1] }], keepWhite: true, close: 2, minArea: 300,
            polys: [[[200, 100], [1000, 100], [1000, 300], [760, 295], [600, 265], [400, 240], [250, 225], [200, 215]]] }
    },
    // Villager 8 (a cut-out): cream body (the cowl, headlights and badge cut out; the pedestals and side panel, above
    // the running board) and the beige roof, the same tan, kept apart by their outlines
    'villager-8': { file: 'image/Products/Villager 8.png',
        body: { any: [{ hue: [38, 18], sat: [0.08, 0.7], light: [0.16, 0.96] }, { sat: [0, 0.12], light: [0.35, 0.96] }], close: 2, minArea: 300,
            polys: [
                [[100, 600], [120, 560], [180, 545], [300, 540], [380, 535], [440, 540], [445, 600], [440, 665], [380, 690], [250, 700], [150, 690], [100, 660]],
                [[403, 600], [700, 590], [990, 568], [998, 640], [900, 662], [700, 688], [500, 708], [440, 712], [403, 700]]
            ],
            exclude: [[[226, 610], [307, 610], [307, 652], [226, 652]], [[107, 596], [132, 596], [132, 642], [107, 642]], [[152, 620], [199, 620], [199, 649], [152, 649]]] },
        canopy: { any: [{ hue: [38, 16], sat: [0.06, 0.7], light: [0.3, 0.98] }, { sat: [0, 0.12], light: [0.45, 0.98] }], close: 2, minArea: 300,
            polys: [[[160, 200], [1000, 200], [1000, 345], [800, 330], [600, 300], [400, 290], [230, 285], [180, 270], [160, 255]]] }
    },
    // Transporter 4 (a cut-out): green body (the front; the amber lamps and chrome fall outside its colour) and the
    // grey seats, above the aluminium side panels. The photo has no roof, so the canopy can't be shown
    'transporter-4': { file: 'image/Products/Transporter 4.png',
        // With the paint's pale highlights (pale green-grey streaks on the hood); the round headlights, badge and grille cut out
        body: { any: [{ hue: [150, 40], sat: [0.18, 1], light: [0.03, 0.85] }, { hue: [150, 55], sat: [0, 1], light: [0.4, 1] }, { hue: [150, 55], sat: [0.06, 1], light: [0, 0.5] }, { sat: [0, 0.1], light: [0.55, 1] }], keepWhite: true, close: 4, minArea: 300,
            polys: [[[100, 360], [530, 360], [530, 600], [480, 650], [100, 650]]],
            exclude: [[[391, 548], [376, 563], [356, 563], [341, 548], [341, 528], [356, 513], [376, 513], [391, 528]], [[155, 556], [139, 572], [117, 572], [101, 556], [101, 534], [117, 518], [139, 518], [155, 534]], [[187, 553], [242, 553], [242, 577], [187, 577]], [[163, 528], [271, 528], [271, 594], [163, 594]]] },
        seat: { sat: [0, 0.16], light: [0.15, 0.85], close: 2, minArea: 300,
            polys: [[[450, 412], [500, 402], [560, 400], [620, 402], [700, 400], [760, 402], [835, 410], [842, 460], [840, 520], [835, 562], [700, 565], [560, 563], [497, 560], [480, 520], [450, 470]]] }
    },
    // Carryall 300 (a cut-out): silver body (the front; grille and headlights cut out), the grey seat (above the
    // aluminium side panels, which are the same grey) and the black roof
    'carryall-300': { file: 'image/Products/CA300.png',
        body: { any: [{ sat: [0, 0.18], light: [0.3, 1] }, { sat: [0, 0.6], light: [0.8, 1] }], keepWhite: true, close: 2, minArea: 300,
            polys: [[[150, 520], [200, 480], [280, 455], [380, 445], [480, 460], [560, 490], [575, 560], [570, 600], [540, 640], [480, 660], [300, 665], [200, 665], [150, 650]]],
            exclude: [[[197, 561], [334, 561], [334, 650], [197, 650]], [[148, 558], [188, 558], [188, 641], [148, 641]], [[409, 546], [459, 546], [459, 602], [409, 602]]] },
        seat: { sat: [0, 0.16], light: [0.18, 0.88], close: 2, minArea: 300,
            polys: [[[575, 440], [640, 425], [720, 423], [775, 430], [790, 470], [788, 560], [780, 610], [640, 612], [590, 600], [575, 560]]] },
        canopy: { sat: [0, 0.3], light: [0, 0.42], close: 2, minArea: 300,
            polys: [[[272, 242], [300, 220], [400, 203], [500, 192], [600, 187], [700, 188], [825, 200], [840, 215], [838, 225], [700, 235], [600, 240], [500, 240], [400, 240], [300, 245]]] }
    },
    // Carryall 500 (a cut-out): blue body (the front), the grey seat and the white roof's top
    'carryall-500': { file: 'image/Products/CA500.png',
        // The paint's pale highlights count too (the grille and headlights, as pale, are cut out)
        body: { any: [{ hue: [225, 30], sat: [0.2, 1], light: [0.03, 0.9] }, { hue: [225, 40], sat: [0, 1], light: [0.55, 1] }, { sat: [0, 0.12], light: [0.6, 1] }], keepWhite: true, close: 3, minArea: 300,
            polys: [[[100, 520], [150, 490], [200, 470], [300, 455], [400, 450], [500, 460], [545, 480], [560, 560], [550, 640], [500, 665], [300, 670], [100, 670]]],
            // The two round headlights (chrome, as pale as the highlights) and the badge
            exclude: [[[198, 602], [262, 602], [262, 628], [198, 628]], [[427, 600], [413, 614], [393, 614], [379, 600], [379, 580], [393, 566], [413, 566], [427, 580]], [[165, 618], [150, 633], [130, 633], [115, 618], [115, 598], [130, 583], [150, 583], [165, 598]]] },
        seat: { sat: [0, 0.16], light: [0.18, 0.88], close: 2, minArea: 300,
            polys: [[[545, 450], [600, 440], [690, 432], [740, 440], [758, 480], [757, 560], [750, 610], [620, 612], [560, 605], [545, 560]]] },
        canopy: { any: [{ sat: [0, 0.2], light: [0.45, 1] }, { sat: [0, 0.6], light: [0.8, 1] }], keepWhite: true, close: 2, minArea: 300,
            polys: [[[250, 247], [300, 228], [400, 213], [500, 205], [600, 203], [700, 206], [790, 215], [800, 232], [790, 240], [700, 238], [600, 236], [500, 238], [400, 240], [300, 246]]] }
    },
    // Golfer 4 Golfer: black paint, as black as the bumpers and trim, so its outlines follow the paint's edges
    // (traced on this photo) and the badge is cut out. White seats
    'golfer-4-golfer': {
        body: { sat: [0, 0.35], light: [0, 0.85], close: 3, minArea: 600,
            polys: [
                [[912, 650], [935, 620], [960, 605], [1010, 590], [1110, 584], [1210, 590], [1270, 606], [1300, 628], [1330, 645], [1395, 668], [1418, 690], [1422, 760], [1400, 782], [1330, 790], [1250, 802], [1170, 790], [1090, 775], [1010, 760], [950, 745], [925, 740], [912, 720]],
                [[118, 640], [150, 620], [230, 624], [252, 650], [272, 668], [330, 678], [365, 690], [405, 697], [407, 830], [262, 832], [257, 800], [236, 765], [215, 732], [192, 710], [170, 697], [142, 692], [118, 697]]
            ],
            exclude: [[[1250, 717], [1340, 717], [1340, 763], [1250, 763]]] },
        seat: { sat: [0, 0.3], light: [0.5, 1], keepWhite: true, close: 2, minArea: 400, polys: [
            [[250, 445], [260, 430], [305, 424], [360, 427], [400, 442], [425, 452], [445, 450], [465, 437], [490, 427], [490, 570], [455, 572], [420, 580], [380, 590], [305, 592], [260, 585], [247, 565]],
            [[490, 445], [510, 422], [555, 416], [610, 420], [660, 437], [680, 447], [700, 445], [730, 422], [780, 415], [855, 420], [890, 440], [897, 500], [895, 565], [880, 585], [780, 590], [705, 585], [680, 595], [630, 606], [555, 607], [510, 600], [492, 580], [487, 525]],
            [[292, 640], [330, 628], [450, 620], [560, 612], [700, 612], [800, 615], [870, 620], [905, 640], [905, 690], [880, 705], [700, 708], [560, 706], [480, 690], [380, 692], [300, 690]]
        ] }
    }
};

function inside(x, y, poly) {
    let hit = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i], [xj, yj] = poly[j];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
}

function hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
    if (!d) return [0, 0, l];
    const s = d / (1 - Math.abs(2 * l - 1));
    const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s, l];
}

// Grows (grow = true) or shrinks the set pixels by a square of radius r
function morph(m, w, h, r, grow) {
    const out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let hit = !grow;
        for (let dy = -r; dy <= r && hit !== grow; dy++) for (let dx = -r; dx <= r; dx++) {
            const xx = x + dx, yy = y + dy;
            const v = xx >= 0 && yy >= 0 && xx < w && yy < h ? m[yy * w + xx] : 0;
            if (grow ? v : !v) { hit = grow; break; }
        }
        out[y * w + x] = hit ? 1 : 0;
    }
    return out;
}

// Drops connected areas smaller than minArea
function dropSpecks(m, w, h, minArea) {
    const seen = new Uint8Array(w * h), stack = [];
    for (let i = 0; i < m.length; i++) {
        if (!m[i] || seen[i]) continue;
        const area = [];
        stack.push(i); seen[i] = 1;
        while (stack.length) {
            const p = stack.pop(); area.push(p);
            const x = p % w, y = (p / w) | 0;
            for (const q of [x > 0 && p - 1, x < w - 1 && p + 1, y > 0 && p - w, y < h - 1 && p + w]) {
                if (q !== false && m[q] && !seen[q]) { seen[q] = 1; stack.push(q); }
            }
        }
        if (area.length < minArea) for (const p of area) m[p] = 0;
    }
}

const passes = (t, [hh, s, l]) => {
    if (t.hue) {
        const dh = Math.min(Math.abs(hh - t.hue[0]), 360 - Math.abs(hh - t.hue[0]));
        if (dh > t.hue[1]) return false;
    }
    return s >= (t.sat || [0, 1])[0] && s <= (t.sat || [0, 1])[1] && l >= (t.light || [0, 1])[0] && l <= (t.light || [0, 1])[1];
};

// The pixels of one part, as 0 / 1
// fromMap (optional): another photo's map of the part, from the same camera, used as its outline
function partMap(spec, px, w, h, cutOut, fromMap) {
    let m = new Uint8Array(w * h);
    const tests = spec.any || [spec];
    for (let i = 0; i < w * h; i++) {
        const x = i % w, y = (i / w) | 0;
        if (fromMap && !fromMap[i]) continue;
        if (spec.polys && !spec.polys.some(p => inside(x, y, p))) continue;
        if (spec.exclude && spec.exclude.some(p => inside(x, y, p))) continue;
        const c = px[i];
        if (c.cutOut || (!cutOut && !spec.keepWhite && c[2] > 0.93 && c[1] < 0.12)) continue; // the studio backdrop (unless the outline is tight and the part is white)
        m[i] = tests.some(t => passes(t, c)) ? 1 : 0;
    }
    if (spec.close) m = morph(morph(m, w, h, spec.close, true), w, h, spec.close, false);
    // Closing can reach back into a cut-out hole; keep the holes
    if (spec.exclude) for (let i = 0; i < w * h; i++) if (m[i] && spec.exclude.some(p => inside(i % w, (i / w) | 0, p))) m[i] = 0;
    if (spec.minArea) dropSpecks(m, w, h, spec.minArea);
    return m;
}

const [outDir, only] = process.argv.slice(2);
for (const [name, spec] of Object.entries(MASKS)) {
    if (only && name !== only) continue;
    const file = path.join(root, spec.file || `image/Products/builds/${name}.jpg`);
    const { data, info } = await sharp(file).flatten({ background: '#ffffff' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = info;
    // A cut-out photo's transparency is its backdrop, exactly (so a white body or roof isn't mistaken for it)
    const alpha = (await sharp(file).metadata()).hasAlpha ? await sharp(file).ensureAlpha().extractChannel(3).raw().toBuffer() : null;
    const px = new Array(w * h);
    for (let i = 0; i < w * h; i++) px[i] = hsl(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);
    if (alpha) for (let i = 0; i < w * h; i++) px[i].cutOut = alpha[i] < 128;
    // `from`: a part outlined by another photo's map (shot from the same camera), grown by `grow` px
    const fromMap = async (part, c) => {
        if (!part.from) return null;
        const raw = await sharp(path.join(root, 'image/Products/builds/masks', `${part.from}.png`)).resize(w, h).removeAlpha().raw().toBuffer();
        let m = new Uint8Array(w * h);
        for (let i = 0; i < w * h; i++) m[i] = raw[i * 3 + c] > 127 ? 1 : 0;
        return part.grow ? morph(m, w, h, part.grow, true) : m;
    };
    const parts = [];
    for (const [c, p] of ['body', 'seat', 'canopy'].entries()) parts.push(spec[p] ? partMap(spec[p], px, w, h, !!alpha, await fromMap(spec[p], c)) : null);
    // A pixel belongs to one part: body first, then seat, then canopy
    for (let i = 0; i < w * h; i++) {
        if (parts[0] && parts[0][i]) { if (parts[1]) parts[1][i] = 0; if (parts[2]) parts[2][i] = 0; }
        else if (parts[1] && parts[1][i] && parts[2]) parts[2][i] = 0;
    }
    const out = Buffer.alloc(w * h * 3);
    parts.forEach((m, c) => { if (m) for (let i = 0; i < w * h; i++) out[i * 3 + c] = m[i] ? 255 : 0; });
    const maskFile = path.join(root, 'image/Products/builds/masks', `${name}.png`);
    await sharp(out, { raw: { width: w, height: h, channels: 3 } }).png().toFile(maskFile);
    const counts = parts.map(m => (m ? m.reduce((a, v) => a + v, 0) : 0));
    console.log(`${name}: body ${counts[0]}, seat ${counts[1]}, canopy ${counts[2]} px -> ${path.relative(root, maskFile)}`);

    // A striped seat's tones, inside the seat: each pixel goes to the first tone whose test it passes, else the panel
    let tones = null;
    if (spec.tones && parts[1]) {
        // Traced panels: inside one is panel; with `stripeFrac`, each row's outer share of the panel on either side is
        // stripe instead (so a Tsunami pattern shows bolster, silver stripe, coloured panel, stripe, bolster)
        let panelTone = null;
        if (spec.tones.panels) {
            panelTone = new Int8Array(w * h);
            const frac = spec.tones.stripeFrac || 0;
            for (const p of spec.tones.panels) {
                const ys = p.map(q => q[1]), xs = p.map(q => q[0]);
                for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
                    let x0 = Infinity, x1 = -Infinity;
                    for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) if (inside(x, y, p)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
                    if (x0 > x1) continue;
                    const edge = (x1 - x0) * frac;
                    for (let x = x0; x <= x1; x++) panelTone[y * w + x] = x - x0 < edge || x1 - x < edge ? 2 : 1;
                }
            }
        }
        const cls = new Int8Array(w * h).fill(-1);
        for (let i = 0; i < w * h; i++) {
            if (!parts[1][i]) continue;
            // Traced panels (`panels`, as scripts/build-masks.mjs does): inside one is panel, the rest bolster. Judging by
            // lightness counted lit bolsters as panels
            if (spec.tones.panels) { cls[i] = panelTone ? panelTone[i] : 0; continue; }
            const t = ['bolster', 'panel', 'stripe'].findIndex(k => passes(spec.tones[k], px[i]));
            cls[i] = t < 0 ? 1 : t;
        }
        // Each seat pixel takes the tone most of its neighbours have (within `smooth` px), so a highlight on a black
        // bolster or a shadow on a panel doesn't flip to the other tone and show as a blotch
        const r = spec.tones.smooth || 0;
        let final = cls;
        if (r) {
            final = new Int8Array(cls);
            const sums = [0, 1, 2].map(t => {
                const s = new Float64Array((w + 1) * (h + 1));
                for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
                    s[(y + 1) * (w + 1) + x + 1] = (cls[y * w + x] === t ? 1 : 0) + s[y * (w + 1) + x + 1] + s[(y + 1) * (w + 1) + x] - s[y * (w + 1) + x];
                return s;
            });
            for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
                if (cls[y * w + x] < 0) continue;
                const x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1), y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1);
                const counts = sums.map(s => s[y1 * (w + 1) + x1] - s[y0 * (w + 1) + x1] - s[y1 * (w + 1) + x0] + s[y0 * (w + 1) + x0]);
                final[y * w + x] = counts.indexOf(Math.max(...counts));
            }
        }
        tones = Buffer.alloc(w * h * 3);
        for (let i = 0; i < w * h; i++) if (final[i] >= 0) tones[i * 3 + final[i]] = 255;
        // Traced tones get a slight blur, as in scripts/build-masks.mjs, so the edges between them are soft
        const toneImg = sharp(tones, { raw: { width: w, height: h, channels: 3 } });
        await (spec.tones.panels ? toneImg.blur(1.5) : toneImg).png().toFile(path.join(root, 'image/Products/builds/masks', `${name}-tones.png`));
    }

    if (outDir) {
        const tint = [[60, 255, 60], [255, 40, 255], [40, 220, 255]];
        const over = Buffer.from(data);
        parts.forEach((m, c) => { if (m) for (let i = 0; i < w * h; i++) if (m[i]) for (let k = 0; k < 3; k++) over[i * 3 + k] = over[i * 3 + k] * 0.35 + tint[c][k] * 0.65; });
        await sharp(over, { raw: { width: w, height: h, channels: 3 } }).jpeg().toFile(path.join(outDir, `${name}-overlay.jpg`));
        if (tones) {
            const t = Buffer.from(data), tc = [[30, 60, 255], [255, 40, 40], [255, 230, 0]];
            for (let i = 0; i < w * h; i++) for (let c = 0; c < 3; c++) if (tones[i * 3 + c]) for (let k = 0; k < 3; k++) t[i * 3 + k] = t[i * 3 + k] * 0.3 + tc[c][k] * 0.7;
            await sharp(t, { raw: { width: w, height: h, channels: 3 } }).jpeg().toFile(path.join(outDir, `${name}-tones-overlay.jpg`));
        }
    }
}

// Lined-up copies, for a seat borrowed from another build's photo (recolor.js plainSeatFrom), which must sit exactly
// where this photo's seat is. The Pro Golfer 4 photo is the Scratch one's cart shot again, 6 px left and 1 px up
// (measured on the body, wheels and seat frame), so it is shifted into place, with its paint map
const ALIGNED = { 'golfer-4-pro-aligned': { from: 'golfer-4-pro', dx: 6, dy: 1 } };
for (const [name, a] of Object.entries(ALIGNED)) {
    if (only && name !== only && a.from !== only) continue;
    const shifted = async (file, background, out) => {
        const img = sharp(file);
        const { width, height } = await img.metadata();
        // Two steps: in one pipeline sharp crops before it extends
        const grown = await img.extend({ left: a.dx, top: a.dy, background }).toBuffer();
        await sharp(grown).extract({ left: 0, top: 0, width, height }).toFile(out);
    };
    await shifted(path.join(root, 'image/Products/builds', `${a.from}.jpg`), '#ffffff', path.join(root, 'image/Products/builds', `${name}.jpg`));
    await shifted(path.join(root, 'image/Products/builds/masks', `${a.from}.png`), '#000000', path.join(root, 'image/Products/builds/masks', `${name}.png`));
    console.log(`${name}: ${a.from} shifted ${a.dx}, ${a.dy} px`);
}
