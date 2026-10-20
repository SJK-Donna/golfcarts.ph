// Helper for Dropdown Selection and Navigation
function setCategoryAndNavigate(category) {
    productFilterCategory = category;
    navigateTo('products');
}

// Array containing all 27 Client Logos from directory
const CLIENT_LOGOS = Array.from({ length: 27 }, (_, i) => `image/clientlogo/Logo ${i + 1}.jpg`);

// Complete Product & Accessory Store
const PRODUCTS_DATA = [
    // ==========================================
    // 1. THE GOLFER — Tempo 2 / 2+2 / 4, each with Golf → Scratch → Pro builds ("Versions" document)
    // ==========================================
    {
        id: 'golfer-tempo-2',
        slug: 'golfer-tempo-2',
        name: 'Golfer 2',
        category: 'The Golfer',
        heroProduct: true,
        version: 'golfer',
        layout: '2',
        accessoryTags: ['tempo', 'tempo-2', 'golf'],
        colorFamily: 'tempo',
        canopyKey: 'tempo-2',
        tagline: "The serious golfer's personal cart.",
        description: 'Two forward-facing seats, built around the way you play. Our bestseller, made to be customized with golf accessories, comfort upgrades and premium finishes.',
        priceLabel: 'Inquire for Price',
        seating: '2 Seats (Forward Facing)',
        range: '85 km per charge',
        speed: '30 km/h max',
        battery: 'Trojan FLA 8V lead-acid (Golfer, Scratch) or Battlite lithium (Pro)',
        chargingTime: '3.5 Hours',
        powertrain: '5.0 kW AC Motor',
        image: 'image/Products/builds/golfer-2-golfer.jpg',
        gallery: ['image/Products/builds/golfer-2-golfer.jpg', 'image/Products/builds/golfer-2-scratch-right.jpg', 'image/Products/builds/golfer-2-pro.jpg'],
        // The header's thumbnails are the Golfer, Scratch and Pro builds: picking one shows its photo, name and description
        galleryLevels: ['golf', 'scratch', 'pro'],
        // The colors in each build's photo: picking a build starts the color preview in that look
        buildLooks: {
            golf: { body: 'White', seat: 'White', canopy: '2 Pass Canopy White' },
            scratch: { body: 'Cashmere', seat: 'Tsunami Silver Grey & Black', canopy: '2 Pass Canopy Beige' },
            pro: { body: 'Platinum Grey', seat: 'Classic Premium Seat Camello', canopy: '2 Pass Canopy Black' }
        },
        // One photo per build level, shown on the build cards (from the sales team's Drive folder of build photos)
        buildPhotos: { golf: 'image/Products/builds/golfer-2-golfer.jpg', scratch: 'image/Products/builds/golfer-2-scratch-right.jpg', pro: 'image/Products/builds/golfer-2-pro.jpg' },
        features: ['Two Forward-Facing Seats', 'Golf Bag Provision with Rear Bag Cover', 'Shatter-Resistant Foldable Windshield', 'Corrosion-Resistant Aluminum Frame'],
        specs: { 'Motor Type': '5.0 kW AC Motor', 'Controller': 'Enpower 350A Controller', 'Chassis': 'Aircraft Grade Aluminum Chassis', 'Brakes': '4-Wheel Hydraulic Brake System' }
    },
    {
        id: 'golfer-tempo-2-2',
        slug: 'golfer-tempo-2-2',
        name: 'Golfer 2+2',
        category: 'The Golfer',
        version: 'golfer',
        layout: '2+2',
        accessoryTags: ['tempo', 'tempo-2+2', 'golf'],
        colorFamily: 'tempo',
        canopyKey: 'tempo-2+2',
        tagline: 'Golf and family practicality.',
        description: 'Two forward-facing seats plus two rear-facing seats, for village-based golfers who also drive the family around.',
        priceLabel: 'Inquire for Price',
        seating: '4 Seats (2 Forward + 2 Rear)',
        range: '80 km per charge',
        speed: '30 km/h max',
        battery: 'Trojan FLA 8V lead-acid (Golfer, Scratch) or Battlite lithium (Pro)',
        chargingTime: '3.5 Hours',
        powertrain: '5.0 kW AC Electric Motor',
        image: 'image/Products/builds/golfer-2-2-golfer.jpg',
        gallery: ['image/Products/builds/golfer-2-2-golfer.jpg', 'image/Products/builds/golfer-2-2-scratch.jpg', 'image/Products/builds/golfer-2-2-pro-right.jpg'],
        // The header's thumbnails are the Golfer, Scratch and Pro builds: picking one shows its photo, name and description
        galleryLevels: ['golf', 'scratch', 'pro'],
        // The colors in each build's photo: picking a build starts the color preview in that look
        buildLooks: {
            golf: { seat: 'Beige', canopy: '80" GC Canopy' },
            scratch: { body: 'Green', seat: 'Tsunami Silver Grey & Black', canopy: '4 Pass Onward Canopy Beige' },
            pro: { body: 'Platinum Grey', seat: 'Classic Premium Seat Camello', canopy: '4 Pass Onward Canopy Black' }
        },
        // One photo per build level, shown on the build cards (from the sales team's Drive folder of build photos)
        buildPhotos: { golf: 'image/Products/builds/golfer-2-2-golfer.jpg', scratch: 'image/Products/builds/golfer-2-2-scratch.jpg', pro: 'image/Products/builds/golfer-2-2-pro-right.jpg' },
        colorPhotos: { 'White': 'image/Products/Tempo 2+2 - Golf.png', 'Sangria': 'image/Products/Tempo 2+2 - Golf - Red.png' },
        features: ['Two Forward + Two Rear-Facing Seats', 'Compatible Rear Golf Bag Attachment', 'High-Impact Foldable Windshield', 'Corrosion-Resistant Aluminum Spaceframe'],
        specs: { 'Motor Type': '5.0 kW AC Direct Drive Motor', 'Controller': 'Curtis 350A Programmable AC Controller', 'Chassis': 'Rust-Proof Lightweight Aluminum', 'Brakes': 'Rear Mechanical Drum & Auto Park Brake' }
    },
    {
        id: 'golfer-tempo-4',
        slug: 'golfer-tempo-4',
        name: 'Tempo 4',
        category: 'The Golfer',
        version: 'golfer',
        layout: '4',
        accessoryTags: ['tempo', 'tempo-4', 'golf'],
        colorFamily: 'tempo',
        canopyKey: 'tempo-4',
        tagline: 'Golf with room for two more.',
        description: 'Four seats in two forward-facing rows, for golf with extra passenger comfort and an all-forward seating layout.',
        priceLabel: 'Inquire for Price',
        seating: '4 Seats (Two Forward Rows)',
        range: '85 km per charge',
        speed: '30 km/h max',
        battery: 'Trojan FLA 8V lead-acid (Golfer, Scratch) or Battlite lithium (Pro)',
        chargingTime: '3.5 Hours',
        powertrain: '5.0 kW AC Motor',
        image: 'image/Products/Club Car 4.png',
        gallery: ['image/Products/Club Car 4.png'],
        features: ['Four Seats in Two Forward-Facing Rows', 'Golf Bag Provision with Rear Bag Cover', 'Extended Roof Canopy', 'Corrosion-Resistant Aluminum Frame'],
        specs: { 'Motor Type': '5.0 kW AC Motor', 'Controller': 'Curtis 350A Controller', 'Chassis': 'Aluminum Spaceframe', 'Brakes': '4-Wheel Hydraulic Brake System' }
    },

    // ==========================================
    // 2. LIFESTYLE & PRIVATE USE — Tempo 2 / 2+2 / 4 / 4+2, Essential → Signature → Elite builds ("Versions" document)
    // ==========================================
    {
        id: 'lifestyle-tempo-2',
        slug: 'lifestyle-tempo-2',
        name: 'Tempo 2',
        category: 'Lifestyle & Private Use',
        version: 'lifestyle',
        layout: '2',
        accessoryTags: ['tempo', 'tempo-2'],
        colorFamily: 'tempo',
        canopyKey: 'tempo-2',
        tagline: 'Compact personal transport.',
        description: 'Two seats for getting around homes, villages, estates and farms, with practical, comfort and premium builds to choose from.',
        priceLabel: 'Inquire for Price',
        seating: '2 Seats (Forward Facing)',
        range: '80 km per charge',
        speed: '28 km/h max',
        battery: 'Trojan FLA 8V lead-acid (Essential, Signature) or Battlite lithium (Elite)',
        chargingTime: '4.0 Hours',
        powertrain: '4.0 kW AC Motor',
        image: 'image/Products/Base +.png',
        gallery: ['image/Products/Base +.png', 'image/Products/Premium+ black.png'],
        features: ['Two Forward-Facing Seats', 'Windshield and Mirror Package', 'Defined Lighting Kit', 'Weatherproof Molded Vinyl Seats'],
        specs: { 'Motor Type': '4.0 kW AC Brushless', 'Controller': 'Curtis Controller', 'Chassis': 'Aluminum Box Frame', 'Brakes': 'Dual Rear Drum Brakes' }
    },
    {
        id: 'lifestyle-tempo-2-2',
        slug: 'lifestyle-tempo-2-2',
        name: 'Tempo 2+2',
        category: 'Lifestyle & Private Use',
        version: 'lifestyle',
        layout: '2+2',
        accessoryTags: ['tempo', 'tempo-2+2'],
        colorFamily: 'tempo',
        canopyKey: 'tempo-2+2',
        tagline: 'Family transport, made practical.',
        description: 'Two forward-facing seats plus two rear-facing seats, with an optional rear flip seat that turns passenger space into cargo space.',
        priceLabel: 'Inquire for Price',
        seating: '4 Seats (2 Forward + 2 Rear)',
        range: '88 km per charge',
        speed: '32 km/h max',
        battery: 'Trojan FLA 8V lead-acid (Essential, Signature) or Battlite lithium (Elite)',
        chargingTime: '3.5 Hours',
        powertrain: '5.0 kW AC Motor',
        image: 'image/Products/Tempo 2+2 - Family.png',
        gallery: ['image/Products/Tempo 2+2 - Family.png', 'image/Products/Tempo 2+2 - Family - Sangria Red.png', 'image/Products/Tempo 2+2 - Explorer.png', 'image/Products/Tempo 2+2 - Lifted.png'],
        colorPhotos: { 'Green': 'image/Products/Tempo 2+2 - Family.png', 'Sangria': 'image/Products/Tempo 2+2 - Family - Sangria Red.png' },
        features: ['Two Forward + Two Rear-Facing Seats', 'Optional Rear Flip Seat for Cargo', 'Compatible Seat Belts and Grab Handles', 'Defined Lighting and Mirror Package'],
        specs: { 'Motor Type': '5.0 kW AC Motor', 'Controller': 'Enpower 350A Controller', 'Chassis': 'Aluminum Frame Chassis', 'Brakes': '4-Wheel Hydraulic Disc Brakes' }
    },
    {
        id: 'lifestyle-tempo-4',
        slug: 'lifestyle-tempo-4',
        name: 'Tempo 4',
        category: 'Lifestyle & Private Use',
        version: 'lifestyle',
        layout: '4',
        accessoryTags: ['tempo', 'tempo-4'],
        colorFamily: 'tempo',
        canopyKey: 'tempo-4',
        tagline: 'Four passengers, all facing forward.',
        description: 'Four seats in two forward-facing rows, for families and guests moving around a village, estate or farm.',
        priceLabel: 'Inquire for Price',
        seating: '4 Seats (Two Forward Rows)',
        range: '95 km per charge',
        speed: '32 km/h max',
        battery: 'Trojan FLA 8V lead-acid (Essential, Signature) or Battlite lithium (Elite)',
        chargingTime: '3.0 Hours',
        powertrain: '5.0 kW AC High-Output Motor',
        image: 'image/Products/Club Car 4.png',
        gallery: ['image/Products/Club Car 4.png'],
        features: ['Four Seats in Two Forward-Facing Rows', 'Compatible Seat Belts and Grab Handles', 'Defined Lighting and Mirror Package', 'Extended Roof Canopy'],
        specs: { 'Motor Type': '5.0 kW High Output AC Motor', 'Controller': 'Curtis 350A Controller', 'Chassis': 'Aluminum Spaceframe', 'Brakes': '4-Wheel Hydraulic Brake System' }
    },
    {
        id: 'lifestyle-tempo-4-2',
        slug: 'lifestyle-tempo-4-2',
        name: 'Tempo 4+2',
        category: 'Lifestyle & Private Use',
        version: 'lifestyle',
        layout: '4+2',
        accessoryTags: ['tempo', 'tempo-4+2'],
        colorFamily: 'tempo',
        canopyKey: 'tempo-4+2',
        tagline: 'Room for the whole group.',
        description: 'Four forward-facing seats plus a rear row, with an optional rear flip-seat arrangement for extra passengers or cargo.',
        priceLabel: 'Inquire for Price',
        seating: '6 Seats (4 Forward + 2 Rear)',
        range: '85 km per charge',
        speed: '32 km/h max',
        battery: 'Trojan FLA 8V lead-acid (Essential, Signature) or Battlite lithium (Elite)',
        chargingTime: '4.0 Hours',
        powertrain: '6.3 kW Heavy Torque Motor',
        image: 'image/Products/4 plus2 Lifted.png',
        gallery: ['image/Products/4 plus2 Lifted.png'],
        features: ['Four Forward + Two Rear-Facing Seats', 'Optional Rear Flip-Seat Arrangement', 'Compatible Seat Belts and Grab Handles', 'Lifted Package Available'],
        specs: { 'Motor Type': '6.3 kW AC Heavy Duty', 'Controller': 'Curtis 400A Controller', 'Chassis': 'Heavy Duty Tubular Frame', 'Brakes': '4-Wheel Hydraulic Disc Brakes' }
    },

    // ==========================================
    // 3. RESORT & HOSPITALITY — Guest Transportation, Utility & Operations, Fit-to-Task (blueprint 05–06)
    // ==========================================
    {
        id: 'villager-6',
        slug: 'villager-6',
        name: 'Villager 6',
        category: 'Resort & Hospitality',
        subgroup: 'Guest Transportation',
        buildSet: 'villager',
        accessoryTags: ['villager', 'villager-6'],
        colorFamily: 'villager',
        canopyKey: 'villager-6',
        tagline: 'Guest transportation.',
        description: 'Six seats for resort transfers and property shuttles, chosen around passenger demand, comfort and presentation.',
        priceLabel: 'Inquire for Price',
        seating: '6 Seats (4 Forward + 2 Rear)',
        range: '90 km per charge',
        speed: '28 km/h max',
        battery: '72V 160Ah High-Capacity Lithium',
        chargingTime: '4.0 Hours',
        powertrain: '6.3 kW Heavy Duty AC Motor',
        image: 'image/Products/Villager 6.png',
        gallery: ['image/Products/Villager 6.png'],
        features: ['Extended Roof Canopy with Rain Gutter Trim', 'Ultra-Soft Memory Foam Marine Cushioning', 'Rear Fold-Down Footrest Deck', 'Heavy Duty Commercial Axle Suspension'],
        specs: { 'Motor Type': '6.3 kW AC Motor', 'Controller': 'Curtis 400A Controller', 'Chassis': 'Galvanized Steel Frame', 'Brakes': 'Hydraulic Disc Brakes + Regenerative' }
    },
    {
        id: 'villager-8',
        slug: 'villager-8',
        name: 'Villager 8',
        category: 'Resort & Hospitality',
        subgroup: 'Guest Transportation',
        buildSet: 'villager',
        accessoryTags: ['villager', 'villager-8'],
        colorFamily: 'villager',
        canopyKey: 'villager-8',
        tagline: 'Higher-capacity guest transportation.',
        description: 'Eight seats for group movement and frequent shuttle runs, in quiet, eco-friendly comfort.',
        priceLabel: 'Inquire for Price',
        seating: '8 Seats (6 Forward + 2 Rear)',
        range: '100 km per charge',
        speed: '28 km/h max',
        battery: '72V 200Ah High-Output Lithium',
        chargingTime: '4.5 Hours',
        powertrain: '7.5 kW Silent AC Motor',
        image: 'image/Products/Villager 8.png',
        gallery: ['image/Products/Villager 8.png'],
        features: ['Full Panoramic Length Overhead Canopy Roof', 'Heavy Load-Bearing Suspension Dampers', 'Individual Row USB Fast Charging Outlets', 'Rear Cargo Convertible Seat Deck'],
        specs: { 'Motor Type': '7.5 kW AC Motor', 'Controller': 'Curtis 450A Controller', 'Chassis': 'Reinforced Steel Frame', 'Brakes': '4-Wheel Hydraulic Disc Brakes' }
    },
    {
        id: 'transporter-400',
        slug: 'transporter-400',
        name: 'Transporter 4',
        category: 'Resort & Hospitality',
        subgroup: 'Guest Transportation',
        accessoryTags: ['utility', 'transporter-4'],
        colorFamily: 'carryall',
        canopyKey: 'transporter-4',
        tagline: 'Guests plus luggage.',
        description: 'Forward-facing passenger seating with rear cargo space for luggage transfers and property logistics.',
        priceLabel: 'Inquire for Price',
        seating: '4 Seats + Cargo Box',
        range: '80 km per charge',
        speed: '30 km/h max',
        battery: '72V Industrial Lithium',
        chargingTime: '4.0 Hours',
        powertrain: '6.3 kW AC Motor',
        image: 'image/Products/Transporter 4.png',
        gallery: ['image/Products/Transporter 4.png'],
        features: ['Forward-Facing Passenger Seating', 'Rear Cargo Space for Luggage', 'Heavy Duty Tow Hitch Receiver Included', 'Waterproof Heavy Rubberized Cabin Floor'],
        specs: { 'Motor Type': '6.3 kW AC Heavy Torque Brushless', 'Controller': 'Curtis High-Output Industrial Controller', 'Chassis': 'Hot-Dip Galvanized Reinforced Steel Frame', 'Brakes': '4-Wheel Hydraulic Disc Brakes' }
    },
    {
        id: 'minibus-14',
        slug: 'minibus-14',
        name: 'Minibus 14',
        category: 'Resort & Hospitality',
        subgroup: 'Guest Transportation',
        accessoryTags: ['minibus'],
        canopyKey: 'minibus-14',
        tagline: 'Larger-group transport.',
        description: 'A 14-seater for moving larger groups, chosen around your route, gradients, passenger volume and charging plan.',
        priceLabel: 'Inquire for Price',
        seating: '14 Seats',
        range: '110 km per charge',
        speed: '30 km/h max',
        battery: '72V 200Ah Commercial Lithium Pack',
        chargingTime: '4.5 Hours',
        powertrain: '7.5 kW Heavy Duty Motor',
        image: 'image/Products/Minibus 14 GC.png',
        gallery: ['image/Products/Minibus 14 GC.png'],
        features: ['14 Forward-Facing Captain Seats with Lap Belts', 'Passenger Roof Ventilation System', 'Motorized Retractable Boarding Step', 'Built-in PA Public Address Speaker System'],
        specs: { 'Motor Type': '7.5 kW AC Heavy Torque Motor', 'Controller': 'Curtis 450A Industrial Controller', 'Chassis': 'Reinforced Box Tubular Steel Frame', 'Brakes': 'Dual Circuit Vacuum Servo Brakes' }
    },
    {
        id: 'carryall-300',
        slug: 'carryall-300',
        name: 'Carryall 300',
        category: 'Resort & Hospitality',
        subgroup: 'Utility & Operations',
        accessoryTags: ['utility', 'carryall'],
        colorFamily: 'carryall',
        canopyKey: 'carryall-300',
        tagline: 'Compact utility work.',
        description: 'For compact utility work and light maintenance tasks, with a tight turning radius for narrow paths and service areas.',
        priceLabel: 'Inquire for Price',
        seating: '2 Seats + Cargo Box',
        range: '70 km per charge',
        speed: '25 km/h max',
        battery: '72V Standard Utility Lithium',
        chargingTime: '4.5 Hours',
        powertrain: '5.0 kW AC Motor',
        image: 'image/Products/CA300.png',
        gallery: ['image/Products/CA300.png'],
        features: ['800 lbs Total Carrying Capacity', 'Compact Turning Radius for Narrow Aisles', 'Scuff-Resistant Utility Molded Body Panels'],
        specs: { 'Motor Type': '5.0 kW AC Motor', 'Controller': 'Curtis 350A Controller', 'Chassis': 'Aluminum Box Frame Chassis', 'Brakes': 'Dual Rear Mechanical Brakes' }
    },
    {
        id: 'carryall-500',
        slug: 'carryall-500',
        name: 'Carryall 500',
        category: 'Resort & Hospitality',
        subgroup: 'Utility & Operations',
        accessoryTags: ['utility', 'carryall'],
        colorFamily: 'carryall',
        canopyKey: 'carryall-500',
        tagline: 'Daily property operations.',
        description: 'The base for daily property operations and customized service bodies, from amenities and linen to engineering carts.',
        priceLabel: 'Inquire for Price',
        seating: '2 Seats + Cargo Box',
        range: '75 km per charge',
        speed: '30 km/h max',
        battery: '72V Heavy-Duty Lithium',
        chargingTime: '4.0 Hours',
        powertrain: '6.3 kW Heavy Torque Motor',
        image: 'image/Products/CA500.png',
        gallery: ['image/Products/CA500.png'],
        features: ['Heavy Duty Aluminum Cargo Box', '1,200 lbs Total Payload Carrying Capacity', 'Base for Fit-to-Task Service Bodies', 'All-Terrain Heavy Ply Tires'],
        specs: { 'Motor Type': '6.3 kW Heavy Duty AC Motor', 'Controller': 'Curtis 400A Industrial Controller', 'Chassis': 'Rust-Proof Armor-Plex Aluminum Frame', 'Brakes': '4-Wheel Mechanical Disc Brakes' }
    },
    {
        id: 'cafe-express',
        slug: 'cafe-express',
        name: 'Café Express',
        category: 'Resort & Hospitality',
        subgroup: 'Fit-to-Task',
        tagline: 'Food and beverage service, on the move.',
        description: 'A fully equipped mobile refreshment and catering cart for resorts, golf courses and outdoor venues.',
        priceLabel: 'Inquire for Price',
        seating: '2 Seats + Beverage Counter',
        range: '75 km per charge',
        speed: '25 km/h max',
        battery: '72V Commercial Grade Lithium',
        chargingTime: '4.0 Hours',
        powertrain: '5.0 kW AC Motor',
        image: 'image/Products/Cafe Express.png',
        gallery: ['image/Products/Cafe Express.png'],
        features: ['Insulated Stainless Steel Beverage Compartment', 'Display Shelving with Overhead Illumination', 'Slide-Out Trash and Recycling Receptacles', 'Retractable Awning Canopy Shade Bar'],
        specs: { 'Motor Type': '5.0 kW AC Direct Drive Motor', 'Controller': 'Curtis 350A Commercial Controller', 'Chassis': 'Galvanized Steel Frame', 'Brakes': 'Front Disc & Rear Drum Brakes' }
    },

    // ==========================================
    // 5. ALL ACCESSORIES
    // ==========================================
    {
        id: 'acc-5-panel-mirror',
        slug: 'acc-5-panel-mirror',
        name: '5-Panel Wide Panoramic Rear Mirror',
        category: 'Accessories',
        tagline: 'Full 180-Degree Blindspot Reduction',
        description: 'Ultra-wide 5-panel rear view mirror system maximizing driver visibility and safety.',
        priceLabel: 'Inquire for Price',
        seating: 'Universal Canopy Mount',
        range: 'N/A',
        speed: 'N/A',
        battery: 'N/A',
        chargingTime: 'N/A',
        powertrain: 'Anti-Glare Glass',
        image: 'image/Accessories/5 Panel Rear Mirror.jpg',
        gallery: ['image/Accessories/5 Panel Rear Mirror.jpg', 'image/Accessories/5 Panel Rear Mirror png.png'],
        features: ['5 Individual Anti-Glare Glass Panels', 'Shatter-Proof High Impact Casing', 'Vibration-Free Metal Bracket Kit'],
        specs: { 'Mounting': 'Canopy Frame Mount', 'Field of View': '180 Degrees Panoramic' }
    },
    {
        id: 'acc-bag-cover',
        slug: 'acc-bag-cover',
        name: 'Golf Bag Weather Cover',
        category: 'Accessories',
        tagline: 'Waterproof All-Weather Bag Protection',
        description: 'Heavy-duty water-repellent canvas bag cover designed to protect golf clubs from rain and dirt.',
        priceLabel: 'Inquire for Price',
        seating: 'Rear Bag Holder Fit',
        range: 'N/A',
        speed: 'N/A',
        battery: 'N/A',
        chargingTime: 'N/A',
        powertrain: 'Quick-Zip Closure',
        image: 'image/Accessories/Bag Cover.jpg',
        gallery: ['image/Accessories/Bag Cover.jpg', 'image/Accessories/Golf Cover.jpg'],
        features: ['Waterproof Fabric Construction', 'Easy Quick-Zip Access to Clubs', 'Elasticated Hem for Snug Secure Fit'],
        specs: { 'Material': 'Heavy-Duty Waterproof Nylon', 'Compatibility': 'Universal Bag Racks' }
    },
    {
        id: 'acc-ball-cleaner',
        slug: 'acc-ball-cleaner',
        name: 'Club & Ball Cleaner Washer Unit',
        category: 'Accessories',
        tagline: 'Dual Chamber Cleaning System',
        description: 'Heavy-duty mountable club head and golf ball washer with internal cleaning bristles.',
        priceLabel: 'Inquire for Price',
        seating: 'Fender/Strut Mount',
        range: 'N/A',
        speed: 'N/A',
        battery: 'N/A',
        chargingTime: 'N/A',
        powertrain: 'Drain Plug Base',
        image: 'image/Accessories/Ball Cleaner.jpg',
        gallery: ['image/Accessories/Ball Cleaner.jpg', 'image/Accessories/ball cleaner png.png'],
        features: ['Separate Golf Ball and Club Washer Chambers', 'High-Density Nylon Internal Bristles', 'Easy Drain Plug for Fast Reservoir Rinsing'],
        specs: { 'Capacity': 'Twin Chamber', 'Mounting': 'Universal Fender Bracket' }
    },
    {
        id: 'acc-brush-guard',
        slug: 'acc-brush-guard',
        name: 'Front Steel Brush Guard',
        category: 'Accessories',
        tagline: 'Heavy Duty Front Body Protection',
        description: 'Powder-coated steel front brush guard designed to shield the cowl and body panels from trail debris.',
        priceLabel: 'Inquire for Price',
        seating: 'Front Bumper Mount',
        range: 'N/A',
        speed: 'N/A',
        battery: 'N/A',
        chargingTime: 'N/A',
        powertrain: 'Reinforced Steel',
        image: 'image/Accessories/Brush guard.jpg',
        gallery: ['image/Accessories/Brush guard.jpg'],
        features: ['Tubular Steel Construction', 'Black Powder-Coated Rust Resistant Finish', 'Direct Bolt-On No-Drill Installation'],
        specs: { 'Material': 'Heavy-Gauge Steel', 'Compatibility': 'Tempo & Club Car Chassis' }
    },
    {
        id: 'acc-cooler',
        slug: 'acc-cooler',
        name: 'Side Mount Thermal Cooler',
        category: 'Accessories',
        tagline: 'Insulated Beverage Companion',
        description: 'Thermal insulated beverage cooler unit designed to keep drinks cold throughout 18 holes.',
        priceLabel: 'Inquire for Price',
        seating: 'Side Strut Mount',
        range: 'N/A',
        speed: 'N/A',
        battery: 'N/A',
        chargingTime: 'N/A',
        powertrain: 'Thermal Insulation',
        image: 'image/Accessories/Cooler.jpg',
        gallery: ['image/Accessories/Cooler.jpg', 'image/Accessories/cooler png.png'],
        features: ['Holds up to 12 Standard Cans plus Ice', 'Double-Wall Thermal Insulation', 'Quick-Release Lock Bracket Assembly'],
        specs: { 'Capacity': '12 Quarts', 'Material': 'UV-Stabilized Polyethylene' }
    },
    {
        id: 'acc-dashboard',
        slug: 'acc-dashboard',
        name: 'Custom Carbon Dashboard Console',
        category: 'Accessories',
        tagline: 'Locking Glove Boxes & Beverage Holders',
        description: 'Custom replacement dashboard console with dual locking storage compartments and cup holders.',
        priceLabel: 'Inquire for Price',
        seating: 'Dash Insert',
        range: 'N/A',
        speed: 'N/A',
        battery: 'N/A',
        chargingTime: 'N/A',
        powertrain: 'Carbon Finish',
        image: 'image/Accessories/Dashboard.jpg',
        gallery: ['image/Accessories/Dashboard.jpg', 'image/Accessories/dashboard png.png'],
        features: ['Twin Key-Locking Glove Compartments', 'Carbon Fiber Accent Weave Trim', 'Quad Molded Beverage Holders'],
        specs: { 'Material': 'High-Impact ABS Plastic', 'Finish': 'Carbon Fiber Finish' }
    },
    {
        id: 'acc-deluxe-lights',
        slug: 'acc-deluxe-lights',
        name: 'Deluxe LED Headlight & Taillight Kit',
        category: 'Accessories',
        tagline: 'Street-Legal Turn Signals & Brake Lights',
        description: 'Complete LED lighting package including headlights, tail lights, turn signals, horn, and brake switch.',
        priceLabel: 'Inquire for Price',
        seating: 'Full Wiring Harness',
        range: '12V-48V Compatible',
        speed: 'N/A',
        battery: 'LED Energy Saver',
        chargingTime: 'N/A',
        powertrain: 'Plug and Play',
        image: 'image/Accessories/Deluxe Lights.jpg',
        gallery: ['image/Accessories/Deluxe Lights.jpg'],
        features: ['Energy-Efficient High Output LED Beams', 'Integrated Turn Signal & Emergency Hazard Controls', 'Automotive Horn Switch Included'],
        specs: { 'Voltage': '12V - 48V Voltage Reducer Compatible', 'Rating': 'IP67 Waterproof' }
    },
    {
        id: 'acc-divot-sand-bottle',
        slug: 'acc-divot-sand-bottle',
        name: 'Divot Repair Sand Bottle Assembly',
        category: 'Accessories',
        tagline: 'Fairway Care Sand Dispenser',
        description: 'Ergonomic sand bottle dispenser unit for quick fairway turf divot repair.',
        priceLabel: 'Inquire for Price',
        seating: 'Strut Mount',
        range: 'N/A',
        speed: 'N/A',
        battery: 'N/A',
        chargingTime: 'N/A',
        powertrain: 'Pour Spout',
        image: 'image/Accessories/Divot repair sand bottle.jpg',
        gallery: ['image/Accessories/Divot repair sand bottle.jpg', 'image/Accessories/Divot repair sand bottle png.png'],
        features: ['Ergonomic Handle for Smooth Pouring', 'Durable Weatherproof Bottle Body', 'Quick Snap-In Bracket Holder'],
        specs: { 'Capacity': '1.5 Liters', 'Mounting': 'Canopy Support Strut' }
    },
    {
        id: 'acc-golf-cover',
        slug: 'acc-golf-cover',
        name: 'Full Vehicle All-Weather Enclosure',
        category: 'Accessories',
        tagline: 'Roll-Down Clear Vinyl Rain Curtains',
        description: 'Full-vehicle clear rain enclosure protecting passengers and golf gear during wet weather.',
        priceLabel: 'Inquire for Price',
        seating: '2 or 4 Seater Fit',
        range: 'N/A',
        speed: 'N/A',
        battery: 'N/A',
        chargingTime: 'N/A',
        powertrain: 'Heavy Zipper System',
        image: 'image/Accessories/Golf Cover.jpg',
        gallery: ['image/Accessories/Golf Cover.jpg', 'image/Accessories/Magnetic Cover.jpg'],
        features: ['Heavy-Duty Clear Marine Grade Vinyl Windows', 'Roll-Up Side Doors with Snap Straps', 'Reinforced Zipper Door Closures'],
        specs: { 'Material': 'Commercial Grade Poly Canvas', 'Fit': 'Custom Canopy Fit' }
    },
    {
        id: 'acc-lux-seat-brown',
        slug: 'acc-lux-seat-brown',
        name: 'Lux Diamond Leather Seat (Brown)',
        category: 'Accessories',
        tagline: 'Executive Camello Warm Brown Leather',
        description: 'Hand-stitched luxury seat replacement featuring diamond quilt patterns and high-density foam.',
        priceLabel: 'Inquire for Price',
        seating: 'Front & Rear Bench',
        range: 'N/A',
        speed: 'N/A',
        battery: 'UV Protected',
        chargingTime: 'N/A',
        powertrain: 'Memory Foam',
        image: 'image/Accessories/Lux Seat - Brown.jpg',
        gallery: ['image/Accessories/Lux Seat - Brown.jpg', 'image/Accessories/Lux Seat - White.jpg'],
        features: ['Marine Grade Waterproof Synthetic Leather', 'Custom Diamond Stitching Accent', 'High Density Ergonomic Core Foam'],
        specs: { 'Color': 'Camello Warm Brown', 'Material': 'UV Treated Synthetic Leather' }
    },
    {
        id: 'acc-lux-seat-white',
        slug: 'acc-lux-seat-white',
        name: 'Lux Diamond Leather Seat (White)',
        category: 'Accessories',
        tagline: 'Pristine White Luxury Seating',
        description: 'Premium white diamond-stitched seat cushions providing cool comfort and modern luxury style.',
        priceLabel: 'Inquire for Price',
        seating: 'Front & Rear Bench',
        range: 'N/A',
        speed: 'N/A',
        battery: 'Stain Resistant',
        chargingTime: 'N/A',
        powertrain: 'Memory Foam',
        image: 'image/Accessories/Lux Seat - White.jpg',
        gallery: ['image/Accessories/Lux Seat - White.jpg', 'image/Accessories/Premium Seat - Camello white beige.jpg'],
        features: ['Stain-Resistant Heat Reduction Coating', 'Double Diamond Accent Stitching', 'Ergonomic Thigh Support Contour'],
        specs: { 'Color': 'Pristine Bright White', 'Material': 'Marine Synthetic Leather' }
    },
    {
        id: 'acc-magnetic-cover',
        slug: 'acc-magnetic-cover',
        name: 'Magnetic Fast-Attach Enclosure',
        category: 'Accessories',
        tagline: 'Quick Snap Magnetic Side Curtains',
        description: 'Innovative enclosure curtain system utilizing ultra-strong neodymium magnets for fast installation.',
        priceLabel: 'Inquire for Price',
        seating: 'Universal Fit',
        range: 'N/A',
        speed: 'N/A',
        battery: 'N/A',
        chargingTime: 'N/A',
        powertrain: 'Magnetic Seal',
        image: 'image/Accessories/Magnetic Cover.jpg',
        gallery: ['image/Accessories/Magnetic Cover.jpg', 'image/Accessories/magnetic cover png.png'],
        features: ['Ultra-Fast Magnetic Frame Seal', 'Clear Optical Clear Windows', 'Compact Storage Storage Bag Included'],
        specs: { 'Fastener': 'Neodymium Magnet Strip', 'Material': 'Marine Vinyl' }
    },
    {
        id: 'acc-premium-seat-black',
        slug: 'acc-premium-seat-black',
        name: 'Premium Diamond Seat (Black)',
        category: 'Accessories',
        tagline: 'Classic Stealth Black Cushioning',
        description: 'Sleek black diamond-stitched seats crafted for high durability and aggressive style.',
        priceLabel: 'Inquire for Price',
        seating: 'Front & Rear Bench',
        range: 'N/A',
        speed: 'N/A',
        battery: 'N/A',
        chargingTime: 'N/A',
        powertrain: 'Heavy Duty Foam',
        image: 'image/Accessories/Premium Seat - Black.jpg',
        gallery: ['image/Accessories/Premium Seat - Black.jpg', 'image/Accessories/Premium Seat - Grey.jpg'],
        features: ['All-Black Stealth Aesthetic', 'Water-Repellent Stitch Seams', 'Heavy-Duty Reinforced Base Plate'],
        specs: { 'Color': 'Obsidian Black', 'Material': 'Marine Grade Vinyl' }
    },
    {
        id: 'acc-premium-seat-grey',
        slug: 'acc-premium-seat-grey',
        name: 'Premium Diamond Seat (Grey)',
        category: 'Accessories',
        tagline: 'Modern Slate Grey Cushioning',
        description: 'Modern slate grey replacement seating cushions resistant to sun damage and moisture.',
        priceLabel: 'Inquire for Price',
        seating: 'Front & Rear Bench',
        range: 'N/A',
        speed: 'N/A',
        battery: 'N/A',
        chargingTime: 'N/A',
        powertrain: 'Heavy Duty Foam',
        image: 'image/Accessories/Premium Seat - Grey.jpg',
        gallery: ['image/Accessories/Premium Seat - Grey.jpg'],
        features: ['Cool-Touch Grey Surface Treatment', 'Reinforced Side Bolsters', 'Precision Stitched Seams'],
        specs: { 'Color': 'Slate Grey', 'Material': 'Marine Grade Vinyl' }
    },
    {
        id: 'acc-premium-speaker',
        slug: 'acc-premium-speaker',
        name: 'Premium Soundstream Bluetooth Bar',
        category: 'Accessories',
        tagline: '300W Peak Waterproof Audio Bar',
        description: 'High-output Bluetooth marine soundbar with integrated RGB LED accent lighting.',
        priceLabel: 'Inquire for Price',
        seating: 'Roof Bar Mount',
        range: 'Bluetooth 5.0',
        speed: 'N/A',
        battery: '12V Connection',
        chargingTime: 'N/A',
        powertrain: '300W Amplifier',
        image: 'image/Accessories/premium speaker.jpg',
        gallery: ['image/Accessories/premium speaker.jpg'],
        features: ['IP66 Waterproof Rating', 'Integrated 300W Amplifier', 'Wireless Bluetooth Audio Connection'],
        specs: { 'Power': '300W Peak', 'Rating': 'IP66 Waterproof' }
    },
    {
        id: 'acc-rear-armrest',
        slug: 'acc-rear-armrest',
        name: 'Rear Armrest Console with Cup Holders',
        category: 'Accessories',
        tagline: 'Rear Passenger Comfort Extension',
        description: 'Padded armrest console with integrated dual cup holders designed for rear flip seats.',
        priceLabel: 'Inquire for Price',
        seating: 'Rear Flip Seat Fit',
        range: 'N/A',
        speed: 'N/A',
        battery: 'N/A',
        chargingTime: 'N/A',
        powertrain: 'Bolt-On Mount',
        image: 'image/Accessories/Rear arm rest with cup holder.jpg',
        gallery: ['image/Accessories/Rear arm rest with cup holder.jpg', 'image/Accessories/Rear Flip Seat.jpg'],
        features: ['Dual Stainless Steel Cup Holder Inserts', 'Plush Padded Armrest Cushioning', 'Easy Clamp-On Installation'],
        specs: { 'Material': 'Padded Vinyl + Stainless Steel Inserts', 'Compatibility': 'Universal Rear Flip Seats' }
    },
    {
        id: 'acc-rear-flip-seat',
        slug: 'acc-rear-flip-seat',
        name: 'Convertible Rear Flip Seat Kit',
        category: 'Accessories',
        tagline: 'Transforms Seating into Flatbed Cargo Deck',
        description: 'Multi-functional rear seat kit that folds flat into a heavy-duty cargo utility platform.',
        priceLabel: 'Inquire for Price',
        seating: 'Adds 2 Rear Seats',
        range: 'N/A',
        speed: 'N/A',
        battery: 'N/A',
        chargingTime: 'N/A',
        powertrain: 'Heavy Duty Frame',
        image: 'image/Accessories/Rear Flip Seat.jpg',
        gallery: ['image/Accessories/Rear Flip Seat.jpg'],
        features: ['Heavy-Duty Composite Plastic Flatbed Surface', 'Integrated Safety Grab Bar', 'Powder-Coated Steel Frame Structure'],
        specs: { 'Capacity': '400 lbs Deck Load', 'Material': 'Powder Coated Steel + Composite Deck' }
    },
    {
        id: 'acc-seat-belt',
        slug: 'acc-seat-belt',
        name: 'Retractable Passenger Seat Belt Kit',
        category: 'Accessories',
        tagline: 'DOT Approved Safety Seatbelts',
        description: 'Universal retractable 3-point seatbelt safety kit for front or rear passengers.',
        priceLabel: 'Inquire for Price',
        seating: 'Universal Fit',
        range: 'N/A',
        speed: 'N/A',
        battery: 'N/A',
        chargingTime: 'N/A',
        powertrain: 'Auto Retract',
        image: 'image/Accessories/seat belt.jpg',
        gallery: ['image/Accessories/seat belt.jpg', 'image/Accessories/seatbelt png.png'],
        features: ['Auto-Retracting Belt Reel Mechanism', 'DOT Certified Safety Buckles', 'Universal Mounting Bracket Hardware'],
        specs: { 'Standard': 'DOT Certified', 'Fit': 'Universal Front / Rear' }
    },
    {
        id: 'acc-side-mirror',
        slug: 'acc-side-mirror',
        name: 'LED Turn Signal Side Mirrors',
        category: 'Accessories',
        tagline: 'Integrated Amber LED Signal Lights',
        description: 'Dual side-view mirrors with integrated forward-facing LED turn signal indicators.',
        priceLabel: 'Inquire for Price',
        seating: 'Front Strut Mount',
        range: 'N/A',
        speed: 'N/A',
        battery: '12V LED Light',
        chargingTime: 'N/A',
        powertrain: 'Adjustable Angle',
        image: 'image/Accessories/Side Mirror.jpg',
        gallery: ['image/Accessories/Side Mirror.jpg', 'image/Accessories/Side mirror png.png', 'image/Accessories/rear mirror.jpg'],
        features: ['Built-in Front Amber LED Turn Signals', 'Fully Adjustable Convex Mirror Glass', 'High-Impact Weatherproof Plastic Housing'],
        specs: { 'Voltage': '12V', 'Glass': 'Convex Anti-Glare' }
    },
    {
        id: 'acc-velcro-bag',
        slug: 'acc-velcro-bag',
        name: 'Velcro Quick-Attach Organizer Bag',
        category: 'Accessories',
        tagline: 'Convenient Dash & Frame Storage',
        description: 'Multi-pocket storage bag with industrial velcro straps for keeping personal items secure.',
        priceLabel: 'Inquire for Price',
        seating: 'Dash / Frame Fit',
        range: 'N/A',
        speed: 'N/A',
        battery: 'N/A',
        chargingTime: 'N/A',
        powertrain: 'Velcro Strap',
        image: 'image/Accessories/Velcro Bag png.png',
        gallery: ['image/Accessories/Velcro Bag png.png'],
        features: ['Heavy Duty Zipper Compartments', 'Industrial Strength Fastening Straps', 'Water-Resistant Cordura Fabric'],
        specs: { 'Material': 'Cordura Nylon', 'Mounting': 'Velcro Strap System' }
    }
];

// Category Headers Data Map (one per buying pillar). `photo` is a lifestyle banner shown full-bleed behind the text
// (`photoFocus` keeps the cart in frame); categories without one show the product cut-out. `label` overrides the tab name.
const CATEGORY_BANNERS = {
    'The Golfer': {
        title: 'The Golfer',
        headline: 'Built around the way you play.',
        subheadline: 'Golfer 2, Golfer 2+2 and Tempo 4, each in Golfer, Scratch and Pro builds.',
        image: 'image/Products/Premium.png',
        photo: 'image/Banners/golf.jpg',
        photoFocus: '60% 60%'
    },
    'Lifestyle & Private Use': {
        title: 'Lifestyle & Private Use',
        headline: 'Mobility for homes, villages, estates and farms.',
        subheadline: 'Practical, comfort and premium builds, with optional packages.',
        image: 'image/Products/Tempo 2+2 - Family - Sangria Red.png',
        photo: 'image/Banners/personal.jpg',
        photoFocus: '50% 45%'
    },
    'Resort & Hospitality': {
        title: 'Resort & Hospitality',
        headline: 'Guest transport and daily property operations.',
        subheadline: 'Guest transportation, utility and fit-to-task solutions, matched to passenger flow, luggage and operating conditions.',
        image: 'image/Products/Villager 8.png',
        photo: 'image/Banners/resort.jpg',
        photoFocus: '60% 65%'
    },
    'Accessories': {
        label: 'Parts & Accessories',
        title: 'Parts & Accessories',
        headline: 'Genuine upgrades for your cart.',
        subheadline: 'Golf equipment, wheels and tires, seats, lighting, storage, audio, batteries and other compatible accessories.',
        image: 'image/Accessories/Lux Seat - Brown.jpg'
    }
};

// Display name for a category (e.g. the 'Accessories' key shows as "Parts & Accessories")
function categoryLabel(cat) {
    return (CATEGORY_BANNERS[cat] && CATEGORY_BANNERS[cat].label) || cat;
}

// Build levels for the Villager. The Tempo builds come from the "Versions" document (TEMPO_LINES below).
// `confirmed: false` labels the names and contents "proposed" until sales finalizes them.
const BUILD_SETS = {
    villager: {
        title: 'Choose your package.',
        confirmed: false,
        builds: [
            { id: 'standard', name: 'Standard Guest Transport', tagline: 'Base transport configuration', includes: ['Lighting, mirrors and passenger equipment defined in your quotation'] },
            { id: 'comfort', name: 'Guest Comfort & Weather', tagline: 'Added comfort and protection', includes: ['Rain enclosure', 'Grab handles', 'Compatible seat belts'], note: 'Extra storage or lighting specified separately.' }
        ]
    }
};

// ==========================================
// TEMPO VERSIONS: what each Tempo build includes and which options it offers, from the "Versions"
// document (Google Doc "Versions", read 2026-10-15) and the sales team's answers:
//   - the Golf build has no headlights; the lift kit starts at Scratch / Signature and is optional;
//   - sand bottle, ball washer and cooler: none, 1 or 2 each; the GC floor mat comes with every build;
//   - Tempo 4+2 follows the same matrix (4-seater canopy and enclosure, +2 rear flip seat).
// Each row lists the choices per build level: [Golf / Essential, Scratch / Signature, Pro / Elite];
// an empty list means not offered. The builder before this (every colour, seat and package for every
// build) is saved in docs/configurator-previous.json.
// ==========================================
const TEMPO_LINES = {
    golfer: {
        title: 'Golfer, Scratch or Pro.',
        levels: [
            { id: 'golf', name: 'Golfer', fullName: 'Tempo Golf', tagline: 'Golf essentials', blurb: 'The golf essentials: a bag cover, a floor mat and a dependable lead-acid battery.' },
            { id: 'scratch', name: 'Scratch', fullName: 'Tempo Scratch Golf', tagline: 'Golf accessories and comfort', blurb: 'Golf accessories and comfort: LED lighting, more colors and seats, and the lift kit as an option.' },
            { id: 'pro', name: 'Pro', fullName: 'Tempo Pro', tagline: 'The premium personal cart', blurb: 'The premium personal cart: lithium power, the Club Car Deluxe light kit and premium seats.' }
        ]
    },
    lifestyle: {
        title: 'Essential, Signature or Elite.',
        levels: [
            { id: 'essential', name: 'Essential', fullName: 'Essential', tagline: 'Everyday practicality' },
            { id: 'signature', name: 'Signature', fullName: 'Signature', tagline: 'Comfort and style' },
            { id: 'elite', name: 'Elite', fullName: 'Elite', tagline: 'The premium personal cart' }
        ]
    }
};

const TEMPO_STD_BODY = ['White', 'Black', 'Cashmere', 'Sangria', 'Sapphire', 'Green', 'Platinum Grey'];
const TEMPO_CUSTOM_BODY = ['3D Paint', 'Chameleon (7 colors) Black Red', 'Chameleon (7 colors) Violet Blue',
    'Chameleon (7 colors) Green Blue', 'Chameleon (3 colors) White'];
const TEMPO_SCRATCH_SEATS = ['White', 'Beige', 'Black', 'Grey', 'Tsunami Silver Red & Black',
    'Tsunami Silver Grey & Black', 'Tsunami Silver Blue & Black', 'GC Black Premium Seat'];
const WHEEL_STEEL = '8" steel rims with cover';
const WHEEL_TRITON = '12" Triton Machined Black, 215/35-12 tires';
const WHEEL_HELA = '12" Hela Bright Chrome, 215/35-12 tires';
const WHEEL_ALLOY = '10" 5-spoke alloy wheels, gunmetal';
const TEMPO_MIRRORS = ['Side Mirrors', 'Side Mirrors with Turn Signal', '5 Panel Mirror', 'Convex Inner Mirror (short)', 'Convex Inner Mirror (long)'];
const TEMPO_THREE_SIDED = ['Three-sided rain enclosure, Beige', 'Three-sided rain enclosure, White', 'Three-sided rain enclosure, Black'];

const TEMPO_MATRIX = {
    body: [['White', 'Cashmere'], TEMPO_STD_BODY, [...TEMPO_STD_BODY, ...TEMPO_CUSTOM_BODY]],
    seat: [['White', 'Beige'], TEMPO_SCRATCH_SEATS, ['Classic Premium Seat Camello', 'Classic Premium Seat Black and Gray', 'Elite Bright White Seat']],
    // Canopy by layout; Tempo 4+2 uses the 4-seater row
    canopy: {
        '2': [['2 Pass Canopy White', '2 Pass Canopy Beige'], ['2 Pass Canopy White', '2 Pass Canopy Beige', '2 Pass Canopy Black'], ['2 Pass Canopy White', '2 Pass Canopy Beige', '2 Pass Canopy Black']],
        '2+2': [['80" GC Canopy'], ['80" Canopy Black', '4 Pass Onward Canopy Black', '4 Pass Onward Canopy White', '4 Pass Onward Canopy Beige'], ['4 Pass Onward Canopy Black', '4 Pass Onward Canopy White', '4 Pass Onward Canopy Beige']],
        '4': [['88" Canopy Black'], ['88" Canopy Black'], ['88" Canopy Black']]
    },
    battery: ['Trojan FLA 8V lead-acid', 'Trojan FLA 8V lead-acid', 'Battlite lithium'],
    wheels: [[WHEEL_STEEL], [WHEEL_STEEL, WHEEL_TRITON, WHEEL_HELA], [WHEEL_ALLOY, WHEEL_TRITON, WHEEL_HELA]],
    wheelUpgrades: [
        [],
        ['14" Gridlock Machined Black, 225/30-14 tires', '14" Gridlock Gloss Black, 225/30-14 tires', '14" Talon, 225/30-14 tires', '12" Triton Machined Black, 23x10.5-12 tires'],
        ['14" Aerion Gloss Black, 225/30-14 tires', '14" Gridlock Machined Black, 225/30-14 tires', '14" Gridlock Gloss Black, 225/30-14 tires',
            '14" Talon, 225/30-14 tires', '14" Aerion Gloss Black, Kraken 23x10-14 tires', '14" Aerion Black Chrome, Kraken 23x10-14 tires',
            '14" Athena Solid Gloss Black, Kraken 23x10-14 tires', '14" Atlas Gunmetal, Kraken 23x10-14 tires',
            '14" Zeus Gloss Black and Machined, Kraken 23x10-14 tires', '14" Mercury, Kraken 23x10-14 tires',
            '12" Hela Bright Chrome, 23x10.5-12 tires', '12" Triton Machined Black, 23x10.5-12 tires']
    ],
    lighting: {
        // Scratch lists "No Headlight" as a choice too
        golfer: [[], ['No headlights', 'GC Apex Tempo LED Headlights & Tail Lights', 'GC Tempo LED Headlights', 'GC Tempo LED Headlights & Tail Lights'], ['Club Car Tempo Deluxe Light Kit']],
        lifestyle: [['GC Tempo LED Headlights & Tail Lights'], ['GC Apex Tempo LED Headlights & Tail Lights', 'GC Tempo LED Headlights & Tail Lights'], ['Club Car Tempo Deluxe Light Kit']]
    },
    // Golfer accessories (the Golf build includes the black GC bag cover)
    bagCover: [['GC Bag Cover, Black'], ['GC Bag Cover, Black', 'Bag Cover, Beige', 'Bag Cover, White', 'Club Car Magnetic Bag Cover, Black', 'Club Car Magnetic Bag Cover, Beige'], ['Club Car Magnetic Bag Cover, Black', 'Club Car Magnetic Bag Cover, Beige']],
    // Sand bottle (with mounting bracket): 0-2. Ball washer and Caddy Master cooler share the cart's left and
    // right mounts: each takes none, one side or both, and a side one takes is not offered to the other.
    golfExtras: [false, true, true],
    lifestyleCooler: [false, true, true], // the Lifestyle builds' only accessory row
    lift: [false, true, true],           // Lifted 3.5" GC lift kit, optional from Scratch / Signature
    liftFenders: ['Tempo Fenders 3"', 'Tempo Fenders 1.5"', 'Onward Fender Flare Kit'],
    liftAddOns: ['GC Brush Guard', 'Nerf Bar'],
    // +2 layouts: rear flip seat and its colours
    flipSeat: [['Genesis Rear Flip Seat'], ['Genesis Rear Flip Seat'], ['Genesis Rear Flip Seat', 'Onward Premium Flip Seat']],
    genesisColors: [['White', 'Beige'], TEMPO_SCRATCH_SEATS, ['Premium Upholstered Seat Camello', 'Premium Upholstered Seat Black and Gray']],
    onwardColors: ['Classic Premium Seat Back Camello', 'Classic Premium Seat Back Black and Gray'],
    // +2 layouts. Lifestyle lists the GC premium bag attachment under Elite's flip seat upgrades.
    bagAttachment: {
        golfer: [['Golf Bag Attachment Combo'], ['Golf Bag Attachment Combo', 'GC Premium Bag Attachment'], ['GC Premium Bag Attachment']],
        lifestyle: [[], [], ['GC Premium Bag Attachment']]
    },
    electronics: [[], [], ['Club Car Premium Sound Bar', 'Apple CarPlay', 'GC Sound Bar 27" RGB']],
    electronicsAddOns: [[], [], ['Wireless Charging', 'Premium USB-C Charging Port', 'GC USB-C Charging Port QC3.0 with Volt Meter']],
    steering: [[], [], ['Premium Steering Wheel with Scorecard (Club Car)']],
    mirrors: [[], TEMPO_MIRRORS, TEMPO_MIRRORS],
    storage: [[], ['Overhead Storage Console', 'Under Seat Storage Tray'], ['Overhead Storage Console', 'Under Seat Storage Tray']],
    enclosureTwoSeat: [[], TEMPO_THREE_SIDED, ['Two-sided rain enclosure, Black (Club Car)', ...TEMPO_THREE_SIDED]],
    enclosureFourSeat: [[], ['Custom enclosure'], ['Custom enclosure']],
    cooling: [[], ['Zero Breeze Mark 3'], ['Zero Breeze Mark 3']] // only with an enclosure
};

// Swatches for the document's paint names that the Club Car list doesn't have (approximate screen colours)
const TEMPO_EXTRA_BODY_HEX = {
    'Chameleon (7 colors) Black Red': 'linear-gradient(135deg, #1C1D1F, #8E1B22, #C4161C)',
    'Chameleon (7 colors) Violet Blue': 'linear-gradient(135deg, #5B2C83, #1F4FBF, #2F5D8A)',
    'Chameleon (7 colors) Green Blue': 'linear-gradient(135deg, #2E9E6B, #1F6FB2, #0F5A45)',
    'Chameleon (3 colors) White': 'linear-gradient(135deg, #F5F5F2, #C9CCD1, #E3D5C3)'
};

// The document's seat names, matched to the seat photos and swatches the site already has
const SEAT_ALIASES = {
    'Classic Premium Seat Camello': 'Premium Camello (Special Promo)',
    'Classic Premium Seat Black and Gray': 'Premium Black and Grey (Special Promo)',
    'Elite Bright White Seat': 'Elite Bright White',
    'Premium Upholstered Seat Camello': 'Premium Camello (Special Promo)',
    'Premium Upholstered Seat Black and Gray': 'Premium Black and Grey (Special Promo)',
    'Classic Premium Seat Back Camello': 'Premium Camello (Special Promo)',
    'Classic Premium Seat Back Black and Gray': 'Premium Black and Grey (Special Promo)'
};

// "Golfer 2 · Scratch": a model and its build level named together
function buildTitle(product, level) {
    return `${product.name} · ${level.name}`;
}

// Build line, level and layout of a Tempo model
function isTempoVersion(product) {
    return !!(product && product.version && TEMPO_LINES[product.version]);
}

function tempoLayoutRow(product) {
    return product.layout === '4+2' ? '4' : product.layout;
}

// Index of the selected build level on the open model page (0 when none is selected yet)
function detailLevelIndex(product) {
    if (!isTempoVersion(product)) return 0;
    const i = TEMPO_LINES[product.version].levels.findIndex(l => l.id === detailBuild.level);
    return i < 0 ? 0 : i;
}

// What the build cards list as included for each level
function tempoLevelIncludes(line, i) {
    const m = TEMPO_MATRIX;
    const lights = m.lighting[line][i];
    const wheels = m.wheels[i];
    const items = [
        `${m.battery[i]} battery`,
        wheels.length > 1 ? `${wheels[0]}, or ${wheels.length - 1} other wheel choices` : wheels[0],
        (() => {
            const kits = lights.filter(l => l !== 'No headlights');
            if (!kits.length) return 'No headlights';
            if (kits.length === 1) return kits[0];
            return `LED headlights${kits.length < lights.length ? ', optional' : ''} (${kits.length} kits to choose from)`;
        })(),
        `${m.body[i].length} body colors, ${m.seat[i].length} seat colors`
    ];
    if (line === 'golfer') items.push(i === 0 ? 'GC bag cover, black' : 'Bag covers, sand bottles, ball washers, cooler');
    else if (m.lifestyleCooler[i]) items.push('Cooler');
    items.push('GC floor mat');
    return items;
}

function tempoLevelNote(i) {
    return [
        'Rear flip seat available on +2 models.',
        'Upgrades: lift kit, 14" wheels, mirrors, storage, rain enclosure and cooling.',
        'Upgrades: everything in the level before, plus sound bars, Apple CarPlay and a premium steering wheel.'
    ][i];
}

// A Tempo line in the shape the build cards and comparison tables use
function tempoBuildSet(line) {
    const def = TEMPO_LINES[line];
    return {
        title: def.title,
        confirmed: true,
        builds: def.levels.map((l, i) => ({ ...l, includes: tempoLevelIncludes(line, i), note: tempoLevelNote(i) }))
    };
}

function getProductBuildSet(product) {
    if (!product) return null;
    return isTempoVersion(product) ? tempoBuildSet(product.version) : BUILD_SETS[product.buildSet] || null;
}

// Mounting sides for the ball washer and Caddy Master cooler: the value, its label and the sides it takes
const TEMPO_SIDES = [
    { value: '', label: 'None', sides: [] },
    { value: 'both', label: 'Both', sides: ['left', 'right'] },
    { value: 'left', label: 'Left', sides: ['left'] },
    { value: 'right', label: 'Right', sides: ['right'] }
];

function tempoSidesOf(value) {
    return (TEMPO_SIDES.find(s => s.value === value) || TEMPO_SIDES[0]).sides;
}

// True when a side choice would use a mount the other side-mounted accessory already has
function tempoSideTaken(group, value, o) {
    if (!group.shares) return false;
    const taken = tempoSidesOf(o[group.shares]);
    return tempoSidesOf(value).some(s => taken.includes(s));
}

// Option groups for a Tempo model at a build level. Types: fixed (shown, nothing to pick), single (pick
// one, the first is the default), optional (pick one or none), multi (any number), qty (none, 1 or 2),
// side (none, both, left or right mount, shared with the group named in `shares`), flag (on / off).
// `section` groups them on the page.
function getTempoOptionGroups(product, i) {
    const m = TEMPO_MATRIX;
    const line = product.version;
    const layout = tempoLayoutRow(product);
    const plusTwo = /\+2$/.test(product.layout);
    const groups = [];
    const add = g => groups.push(g);

    add({ id: 'battery', section: 'Included', title: 'Battery', type: 'fixed', value: m.battery[i] });
    add({ id: 'floorMat', section: 'Included', title: 'Floor mat', type: 'fixed', value: 'GC floor mat' });
    const lights = m.lighting[line][i];
    if (lights.length > 1) add({ id: 'lighting', section: 'Wheels and lighting', title: 'Lighting', type: 'single', options: lights });
    else add({ id: 'lighting', section: 'Included', title: 'Lighting', type: 'fixed', value: lights[0] || 'No headlights' });
    add({ id: 'wheels', section: 'Wheels and lighting', title: 'Wheels and tires', type: 'single',
        options: [...m.wheels[i], ...m.wheelUpgrades[i]], upgradeFrom: m.wheels[i].length });

    if (line === 'golfer') {
        add({ id: 'bagCover', section: 'Accessories', title: 'Bag cover', type: 'single', options: m.bagCover[i] });
        if (m.golfExtras[i]) {
            add({ id: 'sandBottle', section: 'Accessories', title: 'Sand bottle (with mounting bracket)', type: 'qty' });
            add({ id: 'ballWasher', section: 'Accessories', title: 'Ball washer', type: 'side', shares: 'cooler', sharesTitle: 'Caddy Master cooler' });
            add({ id: 'cooler', section: 'Accessories', title: 'Caddy Master cooler', type: 'side', shares: 'ballWasher', sharesTitle: 'ball washer' });
        }
        if (layout === '2') add({ id: 'caddyStand', section: 'Accessories', title: 'Caddy stand', type: 'flag', label: 'Add a caddy stand' });
    } else if (m.lifestyleCooler[i]) {
        add({ id: 'cooler', section: 'Accessories', title: 'Cooler', type: 'qty' });
    }

    if (m.lift[i]) add({ id: 'lift', section: 'Upgrades', title: 'Lift kit', type: 'flag', label: 'Lifted 3.5" GC lift kit' });
    if (plusTwo) {
        add({ id: 'flipSeat', section: 'Upgrades', title: 'Rear flip seat', type: 'optional', options: m.flipSeat[i] });
        const bags = m.bagAttachment[line][i];
        if (bags.length) add({ id: 'bagAttachment', section: 'Upgrades', title: 'Golf bag attachment', type: 'optional', options: bags });
    }
    if (m.electronics[i].length) {
        add({ id: 'electronics', section: 'Upgrades', title: 'Audio', type: 'multi', options: m.electronics[i] });
        add({ id: 'charging', section: 'Upgrades', title: 'Charging', type: 'multi', options: m.electronicsAddOns[i] });
    }
    if (m.steering[i].length) add({ id: 'steering', section: 'Upgrades', title: 'Steering wheel', type: 'flag', label: m.steering[i][0] });
    if (m.mirrors[i].length) add({ id: 'mirrors', section: 'Upgrades', title: 'Mirrors', type: 'multi', options: m.mirrors[i] });
    if (m.storage[i].length) add({ id: 'storage', section: 'Upgrades', title: 'Storage', type: 'multi', options: m.storage[i] });
    const enclosures = (layout === '2' ? m.enclosureTwoSeat : m.enclosureFourSeat)[i];
    if (enclosures.length) add({ id: 'enclosure', section: 'Upgrades', title: 'Rain enclosure', type: 'optional', options: enclosures });
    if (m.cooling[i].length) add({ id: 'cooling', section: 'Upgrades', title: 'Cooling', type: 'flag', label: m.cooling[i][0], requires: 'enclosure', requiresNote: 'Needs a rain enclosure.' });
    return groups;
}

// Sub-choices that appear once a parent option is chosen
function getTempoSubGroups(product, i, o) {
    const m = TEMPO_MATRIX;
    const subs = [];
    if (o.lift) {
        subs.push({ id: 'liftFender', parent: 'lift', title: 'Fenders', type: 'single', options: m.liftFenders });
        subs.push({ id: 'liftAddOns', parent: 'lift', title: 'Lift add-ons', type: 'multi', options: m.liftAddOns });
    }
    if (o.flipSeat) {
        subs.push({ id: 'flipSeatColor', parent: 'flipSeat', title: 'Flip seat color', type: 'single',
            options: o.flipSeat === 'Onward Premium Flip Seat' ? m.onwardColors : m.genesisColors[i] });
    }
    return subs;
}

// Fresh choices for a level: the first of each pick-one group, nothing else added
function defaultTempoOptions(product, i) {
    const o = {};
    getTempoOptionGroups(product, i).forEach(g => {
        if (g.type === 'single') o[g.id] = g.options[0];
        if (g.type === 'optional' || g.type === 'side') o[g.id] = '';
        if (g.type === 'multi') o[g.id] = [];
        if (g.type === 'qty') o[g.id] = 0;
        if (g.type === 'flag') o[g.id] = false;
    });
    o.liftFender = TEMPO_MATRIX.liftFenders[0];
    o.liftAddOns = [];
    o.flipSeatColor = '';
    return o;
}

// Vehicle models referenced by the header menus and pillar pages.
// `slug` links to a PRODUCTS_DATA page when one exists; `image: null` shows a placeholder.
// `label` (optional) is the short name shown in menus and on the pillar pages (e.g. "2 Seater");
// `name` stays the full model name used in quotes and on the model pages.
const VEHICLE_MODELS = {
    'g-tempo-2':     { name: 'Golfer 2', label: '2 Seater',            image: 'image/Products/builds/golfer-2-golfer.jpg',                slug: 'golfer-tempo-2', badge: 'Bestseller' },
    'g-tempo-2-2':   { name: 'Golfer 2+2', label: '2+2 Seater',          image: 'image/Products/builds/golfer-2-2-golfer.jpg',       slug: 'golfer-tempo-2-2' },
    'g-tempo-4':     { name: 'Tempo 4', label: '4 Seater',             image: 'image/Products/Club Car 4.png',             slug: 'golfer-tempo-4' },
    'l-tempo-2':     { name: 'Tempo 2', label: '2 Seater',             image: 'image/Products/Base +.png',                 slug: 'lifestyle-tempo-2' },
    'l-tempo-2-2':   { name: 'Tempo 2+2', label: '2+2 Seater',           image: 'image/Products/Tempo 2+2 - Family.png',     slug: 'lifestyle-tempo-2-2' },
    'l-tempo-4':     { name: 'Tempo 4', label: '4 Seater',             image: 'image/Products/Club Car 4.png',             slug: 'lifestyle-tempo-4' },
    'l-tempo-4-2':   { name: 'Tempo 4+2', label: '4+2 Seater',           image: 'image/Products/4 plus2 Lifted.png',         slug: 'lifestyle-tempo-4-2' },
    'villager-6':    { name: 'Villager 6',          image: 'image/Products/Villager 6.png',             slug: 'villager-6' },
    'villager-8':    { name: 'Villager 8',          image: 'image/Products/Villager 8.png',             slug: 'villager-8' },
    'transporter-4': { name: 'Transporter 4',       image: 'image/Products/Transporter 4.png',          slug: 'transporter-400' },
    'transporter-6': { name: 'Transporter 6',       image: null,                                        slug: null },
    'minibus-14':    { name: 'Minibus 14',          image: 'image/Products/Minibus 14 GC.png',             slug: 'minibus-14' },
    'minibus-21':    { name: 'Minibus 21',          image: null,                                        slug: null },
    'ca300':         { name: 'Carryall 300',        image: 'image/Products/CA300.png',                  slug: 'carryall-300' },
    'ca500':         { name: 'Carryall 500',        image: 'image/Products/CA500.png',                  slug: 'carryall-500' },
    'ca700':         { name: 'Carryall 700',        image: 'image/Products/CA700.png',                  slug: null },
    'amenities':     { name: 'Amenities Cart',      image: 'image/Products/House keeping.png',          slug: null },
    'linen':         { name: 'Linen Cart',          image: null,                                        slug: null },
    'food-delivery': { name: 'Food Delivery Cart',  image: 'image/Products/F&B.png',                    slug: null },
    'engineering':   { name: 'Engineering Cart',    image: null,                                        slug: null },
    'handyman':      { name: 'Tempo Handyman',      image: null,                                        slug: null },
    'landscaping':   { name: 'Landscaping Cart',    image: null,                                        slug: null },
    'cafe-express':  { name: 'Café Express',        image: 'image/Products/Cafe Express.png',           slug: 'cafe-express' },
    'custom':        { name: 'Custom Build',        image: null,                                        slug: null },
    'r-tempo-2':     { name: 'Remanufactured 2-Seater', label: '2 Seater',        image: 'image/Products/reman 2.png',     slug: null },
    'r-tempo-2-custom': { name: 'Remanufactured 2-Seater (Custom Color)', label: '2 Seater (Custom Color)', image: 'image/Products/reman 3.png', slug: null },
    'r-tempo-2-2':   { name: 'Remanufactured 2+2', label: '2+2 Seater',             image: 'image/Products/reman 4.png',     slug: null },
    'r-tempo-2-2-lifted': { name: 'Remanufactured 2+2 Lifted', label: '2+2 Seater, Lifted', image: 'image/Products/reman 5.png',     slug: null },
    'r-tempo-4':     { name: 'Remanufactured 4-Seater', label: '4 Seater',        image: 'image/Products/reman 1.png',     slug: null }
};

// Menu hierarchy: pillar -> subcategory -> group -> model keys. Drives the header dropdowns, the mobile
// drawer, the Cart page tab sub-menus and the pillar landing pages. `links` add extra menu entries that
// jump to a section of the pillar page; `enquiry` adds a business enquiry prompt to a subcategory.
const NAV_SEGMENTS = [
    {
        id: 'golfer',
        label: 'The Golfer',
        category: 'The Golfer',
        tagline: 'Built around the way you play.',
        description: 'A personal cart for regular golf. Golfer 2, Golfer 2+2 and Tempo 4, each in Golfer, Scratch and Pro builds.',
        image: 'image/Products/Premium.png',
        version: 'golfer',
        links: [{ label: 'Compare Golfer / Scratch / Pro', anchor: 'compare' }],
        subcategories: [
            { id: 'models', label: 'Models', groups: [{ label: 'Models', items: ['g-tempo-2', 'g-tempo-2-2', 'g-tempo-4'] }] }
        ]
    },
    {
        id: 'lifestyle',
        label: 'Lifestyle & Private Use',
        category: 'Lifestyle & Private Use',
        tagline: 'Mobility for homes, villages, estates and farms.',
        description: 'Essential, Signature and Elite builds with optional upgrades, for family transport and life around a private property.',
        image: 'image/Products/Tempo 2+2 - Family.png',
        version: 'lifestyle',
        links: [{ label: 'Compare builds', anchor: 'compare' }, { label: 'Explore lifted packages', anchor: 'lifted' }],
        subcategories: [
            { id: 'models', label: 'Models', groups: [{ label: 'Models', items: ['l-tempo-2', 'l-tempo-2-2', 'l-tempo-4', 'l-tempo-4-2'] }] }
        ]
    },
    {
        id: 'resort',
        label: 'Resort & Hospitality',
        category: 'Resort & Hospitality',
        tagline: 'Guest transport and daily property operations.',
        description: 'Match the vehicle to passenger flow, luggage and daily operating conditions, then add utility and fit-to-task builds for the jobs behind the scenes.',
        image: 'image/Products/Villager 8.png',
        subcategories: [
            {
                id: 'guest-transportation',
                label: 'Guest Transportation',
                enquiry: 'Tell us your passenger demand, route, terrain, luggage needs and operating hours. We will recommend a suitable transport setup.',
                groups: [{ label: 'Guest Transportation', items: ['villager-6', 'villager-8', 'transporter-4', 'transporter-6', 'minibus-14', 'minibus-21'] }]
            },
            {
                id: 'utility-operations',
                label: 'Utility & Operations',
                intro: 'Start with the job. Select the vehicle and equipment around it.',
                groups: [{ label: 'Utility & Operations', items: ['ca300', 'ca500', 'ca700'] }]
            },
            {
                id: 'fit-to-task',
                label: 'Fit-to-Task',
                enquiry: 'Need a cart for a specific job? Tell us what it needs to carry and where it will operate.',
                groups: [{ label: 'Fit-to-Task', items: ['amenities', 'linen', 'food-delivery', 'engineering', 'handyman', 'landscaping', 'cafe-express', 'custom'] }]
            }
        ]
    },
    {
        id: 'remanufactured',
        label: 'Remanufactured',
        category: null,
        tagline: 'A clear value offering.',
        description: 'Remanufactured golf and lifestyle builds, with utility where available. Each unit is quoted with its seating layout, rebuild scope, battery type and condition, included equipment, warranty terms and available upgrades.',
        image: 'image/Products/reman 4.png',
        subcategories: [
            {
                id: 'available-units',
                label: 'Available Builds',
                intro: 'Availability changes as units are rebuilt. Ask for the current units, photos and rebuild details.',
                groups: [{ label: 'Available Builds', items: ['r-tempo-2', 'r-tempo-2-custom', 'r-tempo-2-2', 'r-tempo-2-2-lifted', 'r-tempo-4'] }]
            }
        ]
    }
];

// Header navigation order from the blueprint: three buying pillars, then value, fleet and aftersales routes
const MAIN_NAV = [
    { segment: 'golfer' },
    { segment: 'lifestyle' },
    { segment: 'resort' },
    { segment: 'remanufactured' },
    { label: 'Fleet Solutions', href: 'fleet/', page: 'solutions' },
    { label: 'Parts & Accessories', href: 'carts/?category=Accessories', action: "setCategoryAndNavigate('Accessories')", category: 'Accessories' },
    { label: 'Service & Support', href: 'service/', page: 'service' }
];

// Primary action for individual buyers: start on the hero product's build selector
function buildYourCart() {
    // The color picked in the homepage preview starts the builder
    if (currentPage === 'home') pendingBodyColor = homePreviewColor;
    navigateTo('product-details', 'golfer-tempo-2');
    setTimeout(() => scrollToDetailSection('build'), 350);
}

// ==========================================
// HOMEPAGE CONTENT
// ==========================================

// The range as one group photo: the four families standing together, largest to smallest, each sized by
// its real height (about 2.4 m, 2.0 m, 1.9 m and 1.8 m) on one ground line. Photos are the product
// cut-outs trimmed to the cart (image/lineup/). Positions are percentages of a 3.57 : 1 stage; each cart
// overlaps the next slightly, and later carts sit in front, so every cart's front stays visible.
const HOME_LINEUP = [
    { name: 'Minibus', seats: '14 and 21 seats', image: 'image/lineup/minibus.png', slug: 'minibus-14', left: 1.12, width: 34.76, height: 82 },
    { name: 'Villager', seats: '6 to 8 seats', image: 'image/lineup/villager.png', slug: 'villager-8', left: 33.08, width: 29, height: 68 },
    { name: 'Carryall', seats: '2 seats and a cargo bed', image: 'image/lineup/carryall.png', slug: 'carryall-500', left: 59.28, width: 25.18, height: 65 },
    { name: 'Tempo', seats: '2 to 6 seats', image: 'image/lineup/tempo.png', slug: 'golfer-tempo-2', left: 81.67, width: 17.21, height: 61 }
];

// Shop by use. Golfer leads with the largest photo; Remanufactured is a text-led strip (see renderHomeUses)
const HOME_USES = {
    golfer: { image: 'image/Banners/golf.jpg', alt: 'Green Tempo 2+2 with beige seats on a fairway', width: 1800, height: 1239 },
    lifestyle: { image: 'image/Banners/personal.jpg', alt: 'Two golfers greeting each other beside a white Tempo 2', width: 990, height: 960 },
    resort: { image: 'image/Banners/resort.jpg', alt: 'Cream guest shuttle parked at a resort entrance', width: 1800, height: 1399 }
};

// Body colors in the homepage color preview (a few from the Tempo range; the full list is in the builder)
const HOME_PREVIEW_COLORS = ['White', 'Black', 'Sangria', 'Sapphire', 'Green', 'Platinum Grey'];
const HOME_PREVIEW_SLUG = 'golfer-tempo-2';
let homePreviewColor = 'White';
let pendingBodyColor = null;
let homePreviewToken = 0;


// lat / lon from OpenStreetMap: Manila and Clark match the building; Cebu (Casuntingan) and Laguna
// (Pulong Santa Cruz) match the neighbourhood, so the site shows them to 2 decimals (about 1 km)
const BRANCHES = [
    {
        name: 'Manila Branch',
        city: 'Manila', region: 'Metro Manila', lat: 14.5857, lon: 120.9947,
        address: '1877 Honda Cars Manila Building, Paz M. Guazon St. cor Pres. Quirino Ave. Paco, Manila, 1007 National Capital Region',
        phones: ['(02) 7745-5089', '(+63) 999 997 7688', '(+63) 917 631 2184']
    },
    {
        name: 'Cebu Branch',
        city: 'Mandaue City', region: 'Cebu', lat: 10.3453, lon: 123.9305,
        address: 'Unit 301 Clotilde Commercial Center, ML Quezon Ave., Casuntingan, Mandaue City, 6014 Cebu',
        phones: ['(+63) 917 310 5239']
    },
    {
        name: 'Laguna Branch',
        city: 'Santa Rosa', region: 'Laguna', lat: 14.2776, lon: 121.0835,
        address: 'Nissan Technopark, Purok 5 NMPI Rd, City of Santa Rosa, Laguna',
        phones: []
    },
    {
        name: 'Clark Branch',
        city: 'Clark Freeport Zone', region: 'Pampanga', lat: 15.1742, lon: 120.5309,
        address: 'Unit 16E-F, Philexcel Business Park, M.A. Roxas Highway, Clark Freeport Zone, Pampanga',
        phones: []
    }
];

// DRAFT answers built only from facts already on the site; review before publishing
const HOME_FAQS = [
    { q: 'Which golf cart is right for me?', a: 'It depends on where you will drive and how many people you carry. Two-seaters suit golf and personal errands, 2+2 models add rear-facing seats for family and friends, and 6 to 14 seat shuttles are built for moving groups. Our team can recommend a model for your property.' },
    { q: 'Do you supply fleets for resorts, golf courses, and townships?', a: 'Yes. We supply guest transport, people movers, and utility vehicles for resorts, golf courses, industrial sites, and townships, including fit-to-task builds such as F&B and laundry carts.' },
    { q: 'How do I charge an electric golf cart?', a: 'Our carts charge from a standard 110V/220V outlet. For best battery life, charge after every use instead of waiting for the battery to run low.' },
    { q: 'Can I customize colors, seats, and accessories?', a: 'Yes. Choose from body colors, premium seats, lighting, enclosures, audio, and more from our genuine accessory range. Mention your preferences when you request a quote.' },
    { q: 'Do you offer after-sales service and parts?', a: 'Yes. Our service team handles inspections, battery and electrical checks, and repairs, and we stock spare parts and accessories. Visit our Service page or contact a branch to book.' },
    { q: 'Where can I see the carts in person?', a: 'Visit any of our branches in Manila, Cebu, Laguna (Santa Rosa) or Pampanga (Clark). You can also request a quote and our team will arrange a viewing for you.' }
];

// Scrolls to a homepage section, navigating home first when needed
function goToHomeSection(sectionId) {
    const scroll = () => {
        const target = document.getElementById(sectionId);
        if (target) target.scrollIntoView({ behavior: scrollBehavior() });
    };
    if (currentPage === 'home') {
        scroll();
    } else {
        navigateTo('home');
        setTimeout(scroll, 400);
    }
}

function handleHomeQuoteSubmit(e) {
    e.preventDefault();
    e.target.reset();
    showToast("Request sent. We'll reply with your quote.");
}

// Customer quotes on the About page

const TESTIMONIALS_DATA = [
    {
        quote: "Club cars are great. Good quality carts with great after sales service from golfcarts.ph. Company of choice to deal with.",
        author: "Anil Sehwani"
    },
    {
        quote: "We used a gas cart for quite some time before making the switch to the electric club car...moving around the course became more peaceful, less problematic, and generally more enjoyable. The cart looks really good too!",
        author: "BJ Imperial"
    }
];

// Blog Articles Data
const BLOGS_DATA = [
    {
        slug: 'choosing-the-right-golf-cart',
        title: 'How to Choose the Right Golf Cart for Your Needs',
        category: 'Buying Guide',
        date: '2026-09-15',
        image: 'image/Products/Tempo 2+2 - Family - Sangria Red.png',
        excerpt: 'Personal, resort, commercial or golf course use? Here is what to consider before you pick a model.',
        content: [
            'Start with how the cart will be used. A family cart for a gated subdivision needs comfort and safety features, while a resort shuttle needs seating capacity and a smooth, quiet ride.',
            'Next, count your passengers. Two-seaters suit golf and personal errands, 2+2 models add rear-facing seats for family and friends, and 6 to 14 seat shuttles are built for moving groups.',
            'Finally, think about terrain. Lifted models handle gravel roads and unpaved trails, while standard models are ideal for paved paths and fairways.'
        ]
    },
    {
        slug: 'electric-cart-battery-care',
        title: 'Battery Care Tips to Keep Your Electric Cart Running Longer',
        category: 'Maintenance',
        date: '2026-08-28',
        image: 'image/Products/Villager 6.png',
        excerpt: 'Simple charging and storage habits that protect your battery and keep your fleet on the road.',
        content: [
            'Charge after every use instead of waiting for the battery to run low. Regular charging keeps the battery healthy and ready for the next trip.',
            'Store your cart in a cool, shaded place. Heat is one of the biggest causes of battery wear.',
            'Schedule regular check-ups with our service team so small issues are caught before they become costly repairs.'
        ]
    },
    {
        slug: 'resort-guest-mobility',
        title: 'Elevating the Guest Experience with Resort Shuttles',
        category: 'Resort',
        date: '2026-08-10',
        image: 'image/Products/Villager 8.png',
        excerpt: 'Quiet, eco-friendly shuttles help resorts move guests comfortably between villas, pools and restaurants.',
        content: [
            'First impressions matter. A quiet, comfortable shuttle from the lobby to the villa sets the tone for a guest\'s whole stay.',
            'Electric shuttles produce zero emissions on site, which keeps pathways quiet and gardens clean.',
            'With options from 4+2 lifted carts to 8-seat Villagers, resorts can match vehicles to every route on the property.'
        ]
    }
];

function formatBlogDate(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// State Engine Variables
let currentPage = 'home';
let currentSlug = null;
let productFilterCategory = 'All';
let productSearchQuery = '';

// ==========================================
// ROUTING: every page has a real URL
// ==========================================
// The site's base path comes from <base href>: "/" locally, "/golfcarts.ph/" on GitHub Pages
// (set by scripts/build.mjs). Paths below are relative to it.
function siteBasePath() {
    const base = document.querySelector('base');
    return base ? new URL(base.href).pathname : '/';
}

// Page + slug -> path relative to the site base, e.g. ('product-details', 'golfer-tempo-2') -> 'models/golfer-tempo-2/'
function routeToPath(page, slug = null) {
    switch (page) {
        case 'products': return productFilterCategory && productFilterCategory !== 'All'
            ? `carts/?category=${encodeURIComponent(productFilterCategory)}` : 'carts/';
        case 'product-details': return `models/${slug}/`;
        case 'segment': return `use/${slug}/`;
        case 'solutions': return 'fleet/';
        case 'service': return 'service/';
        case 'blogs': return 'blog/';
        case 'blog-details': return `blog/${slug}/`;
        case 'about': return 'about/';
        case 'contact': return 'contact/';
        default: return '';
    }
}

// Absolute path -> { page, slug }; unknown paths fall back to the homepage
function pathToRoute(pathname, search = '') {
    const base = siteBasePath();
    const rel = pathname.startsWith(base) ? pathname.slice(base.length) : pathname.replace(/^\//, '');
    const [first, second] = rel.split('/').filter(Boolean);
    const simple = { carts: 'products', fleet: 'solutions', service: 'service', blog: 'blogs', about: 'about', contact: 'contact' };
    if (first === 'models' && PRODUCTS_DATA.some(p => p.slug === second)) return { page: 'product-details', slug: second };
    if (first === 'use' && NAV_SEGMENTS.some(s => s.id === second)) return { page: 'segment', slug: second };
    if (first === 'blog' && second && BLOGS_DATA.some(b => b.slug === second)) return { page: 'blog-details', slug: second };
    if (simple[first] && !second) {
        const category = new URLSearchParams(search).get('category');
        return { page: simple[first], slug: null, category };
    }
    return rel.replace(/^index\.html$/, '') ? { page: 'not-found', slug: null } : { page: 'home', slug: null };
}

// Link target for <a href> (relative, so it resolves against <base href>)
function routeHref(page, slug = null) {
    return routeToPath(page, slug) || './';
}

// Title and description for each page, used by the browser on navigation and by the pre-render build
function getPageMeta(page, slug = null) {
    const site = 'Golfcarts.ph';
    const defaultDescription = 'Low-speed electric vehicles for private roads: golf carts, resort shuttles and utility vehicles for golf courses, resorts, gated villages, estates and industrial sites. Branches in Manila, Cebu, Laguna and Clark.';
    const product = page === 'product-details' && PRODUCTS_DATA.find(p => p.slug === slug);
    const segment = page === 'segment' && NAV_SEGMENTS.find(s => s.id === slug);
    const post = page === 'blog-details' && BLOGS_DATA.find(b => b.slug === slug);
    if (product) return {
        title: `${product.name}${product.category ? `, ${categoryLabel(product.category)}` : ''} | ${site}`,
        description: `${product.tagline || ''} ${product.description || ''}`.trim().slice(0, 158),
        image: product.image
    };
    if (segment) return { title: `${segment.label} | ${site}`, description: (segment.description || defaultDescription).slice(0, 158), image: segment.image || null };
    if (post) return { title: `${post.title} | ${site}`, description: (post.excerpt || defaultDescription).slice(0, 158), image: post.image };
    const pages = {
        home: { title: `${site} | Low-speed electric vehicles for private roads`, description: defaultDescription },
        products: { title: `All carts | ${site}`, description: 'Every Golfcarts.ph cart: golf, lifestyle, resort and utility models, with colors, seats and accessories.' },
        solutions: { title: `Fleet solutions | ${site}`, description: 'Fleet proposals for golf courses, resorts, estates and industrial sites: guest transport, utility and fit-to-task carts.' },
        service: { title: `Service and support | ${site}`, description: 'Book a service, order parts and get maintenance and charging advice from the Golfcarts.ph team.' },
        blogs: { title: `Blog | ${site}`, description: 'Buying guides, maintenance tips and stories about low-speed electric vehicles.' },
        about: { title: `About | ${site}`, description: 'Golfcarts.ph, run by SJK Guahan Inc., sells, customizes and services low-speed electric vehicles for private roads.' },
        contact: { title: `Contact | ${site}`, description: 'Visit or call our branches in Manila, Cebu, Laguna and Clark, or send us a message.' },
        'not-found': { title: `Page not found | ${site}`, description: defaultDescription }
    };
    return { ...(pages[page] || pages.home), image: null };
}

function applyPageMeta(page, slug) {
    const meta = getPageMeta(page, slug);
    document.title = meta.title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', meta.description);
}

// Edge light: elements with .edge-light get a green light on their border that follows the mouse
// (positions come from --mx / --my; the look is in site.css). Mouse only: touch has no hover.
document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const el = e.target.closest && e.target.closest('.edge-light');
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
}, { passive: true });

// Light / dark mode. Light is the default; the choice is kept in this browser (localStorage) and applied
// before first paint by a small script in index.html. The toggle buttons sit in the header.
function currentTheme() {
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function setTheme(theme) {
    if (theme === 'dark') document.documentElement.dataset.theme = 'dark';
    else delete document.documentElement.dataset.theme;
    try { localStorage.setItem('theme', theme); } catch (e) { /* private mode: the choice lasts for this page only */ }
    syncThemeToggles();
}

function syncThemeToggles() {
    const dark = currentTheme() === 'dark';
    document.querySelectorAll('.theme-toggle').forEach(btn => btn.setAttribute('aria-pressed', String(dark)));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#121411' : '#F6F6F2');
}

document.addEventListener('click', e => {
    if (e.target.closest && e.target.closest('.theme-toggle')) setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
});

// Real links: <a href="..." data-route="page" data-slug="..."> navigate in place (new tab / modifier clicks still work)
document.addEventListener('click', e => {
    const a = e.target.closest('a[data-route]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    // Links to the cart list show every cart unless they name a category
    if (a.dataset.route === 'products') productFilterCategory = a.dataset.category || 'All';
    navigateTo(a.dataset.route, a.dataset.slug || null);
});

window.addEventListener('popstate', () => {
    const route = pathToRoute(location.pathname, location.search);
    if (route.category) productFilterCategory = route.category;
    navigateTo(route.page, route.slug, { fromHistory: true });
});

// Application Initialization
window.addEventListener('DOMContentLoaded', () => {
    // Open the page the address points at (pre-rendered pages are re-rendered in place, same markup)
    const route = pathToRoute(location.pathname, location.search);
    currentPage = route.page;
    currentSlug = route.slug;
    if (route.category) productFilterCategory = route.category;

    syncThemeToggles();
    renderSegmentMenus();
    initMobileMenu();
    populateModalProductDropdown();
    applyPageMeta(currentPage, currentSlug);
    updateNavState();
    renderApp();
});

function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    if (btn) btn.addEventListener('click', () => toggleMobileMenu());
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            toggleMobileMenu(false);
            closeQuoteModal();
        }
    });
}

// Opens or closes the mobile menu; pass true / false to force a state
function toggleMobileMenu(open) {
    const drawer = document.getElementById('mobile-drawer');
    const btn = document.getElementById('mobile-menu-btn');
    if (!drawer) return;
    const show = typeof open === 'boolean' ? open : drawer.classList.contains('hidden');
    drawer.classList.toggle('hidden', !show);
    document.body.classList.toggle('overflow-hidden', show);
    if (btn) {
        btn.setAttribute('aria-expanded', String(show));
        const label = btn.querySelector('.mobile-menu-label');
        if (label) label.textContent = show ? 'Close' : 'Menu';
    }
}

// Marks the header link for the current page (pillar pages and their carts mark their pillar)
function updateNavState() {
    const pillarProduct = currentPage === 'product-details' && PRODUCTS_DATA.find(p => p.slug === currentSlug);
    const listCategory = currentPage === 'products' && productFilterCategory !== 'All' ? productFilterCategory : null;
    const pillarSeg = currentPage === 'segment' ? currentSlug
        : pillarProduct ? (NAV_SEGMENTS.find(s => s.category === pillarProduct.category) || {}).id
        : listCategory ? (NAV_SEGMENTS.find(s => s.category === listCategory) || {}).id || null : null;
    const activePage = currentPage === 'blog-details' ? 'blogs' : (pillarSeg || listCategory) ? null : currentPage === 'product-details' ? 'products' : currentPage;
    document.querySelectorAll('.nav-link').forEach(link => {
        const active = (activePage && link.dataset.page === activePage) || (pillarSeg && link.dataset.segment === pillarSeg)
            || (listCategory && link.dataset.category === listCategory);
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
    });
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const text = document.getElementById('toast-text');
    if (container && text) {
        text.innerText = message;
        container.classList.remove('translate-y-20', 'opacity-0');
        setTimeout(() => {
            container.classList.add('translate-y-20', 'opacity-0');
        }, 3500);
    }
}

// Smooth scrolling, unless the visitor asked for reduced motion
function scrollBehavior() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

function navigateTo(page, slug = null, options = {}) {
    currentPage = page;
    currentSlug = slug;
    // Record the page in the address bar so back / forward / sharing work
    if (!options.fromHistory) {
        const url = siteBasePath() + routeToPath(page, slug);
        if (url !== location.pathname + location.search) history.pushState({ page, slug }, '', url);
    }
    applyPageMeta(page, slug);
    window.scrollTo({ top: 0, behavior: options.fromHistory ? 'auto' : scrollBehavior() });
    
    toggleMobileMenu(false);
    updateNavState();

    renderApp();
    // Keyboard and screen reader users start at the new page's content, not back at the header
    const main = document.getElementById('app-viewport');
    if (main) main.focus({ preventScroll: true });
}

function setCategoryFilter(cat) {
    productFilterCategory = cat;
    history.replaceState({ page: 'products' }, '', siteBasePath() + routeToPath('products'));
    applyPageMeta('products');
    updateNavState();
    renderApp();
}

// --- PILLAR MENUS (The Golfer / Lifestyle & Private Use / Resort & Hospitality / Remanufactured) ---

function modelAnchorId(segmentId, subId, modelKey) {
    return `${segmentId}-${subId}-${modelKey}`;
}

// Opens a segment landing page, optionally scrolling to a subcategory or model card
function openSegment(segmentId, anchorId = null) {
    navigateTo('segment', segmentId);
    if (anchorId) {
        setTimeout(() => {
            const target = document.getElementById(anchorId);
            if (target) {
                target.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
                target.classList.add('segment-card-flash');
                setTimeout(() => target.classList.remove('segment-card-flash'), 1600);
            }
        }, 350);
    }
}

// Menu click for a model: its own page when it has one, otherwise its card on the pillar page
function modelMenuAction(seg, sub, key) {
    const model = VEHICLE_MODELS[key];
    return model.slug
        ? `navigateTo('product-details', '${model.slug}')`
        : `openSegment('${seg.id}', '${modelAnchorId(seg.id, sub.id, key)}')`;
}

// Menu entry for a model: a link to its own page when it has one, otherwise a button to its card on the pillar page
function modelMenuItem(seg, sub, key, className) {
    const model = VEHICLE_MODELS[key];
    const badge = model.badge ? ` <span class="text-green-text text-xs font-medium">${model.badge}</span>` : '';
    return model.slug
        ? `<a href="${routeHref('product-details', model.slug)}" data-route="product-details" data-slug="${model.slug}" class="${className}" role="menuitem">${model.label || model.name}${badge}</a>`
        : `<button type="button" onclick="${modelMenuAction(seg, sub, key)}" class="${className}" role="menuitem">${model.label || model.name}${badge}</button>`;
}

// Hover/focus sub-menu for a pillar (header nav and Cart page tabs)
function renderSegmentDropdown(seg) {
    return `
        <div class="segment-dropdown" role="menu">
            <div class="segment-dropdown-inner grid gap-8" style="grid-template-columns: repeat(${seg.subcategories.length}, minmax(180px, 1fr));">
                ${seg.subcategories.map(sub => `
                    <div class="space-y-3">
                        <button type="button" onclick="openSegment('${seg.id}', '${seg.id}-${sub.id}')" class="block text-left text-[0.8125rem] font-medium text-mute hover:text-ink">${sub.label}</button>
                        ${sub.groups.map(group => `
                            <div class="space-y-0.5">
                                ${group.label !== sub.label ? `<p class="text-xs font-semibold text-ink">${group.label}</p>` : ''}
                                ${group.items.map(key => modelMenuItem(seg, sub, key, 'segment-dropdown-item')).join('')}
                            </div>
                        `).join('')}
                        ${sub === seg.subcategories[0] && seg.links ? `
                            <div class="pt-3 mt-2 border-t border-line space-y-0.5">
                                ${seg.links.map(l => `<button type="button" onclick="openSegment('${seg.id}', '${seg.id}-${l.anchor}')" class="segment-dropdown-item" role="menuitem">${l.label}</button>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Desktop header navigation, in the blueprint's order
function renderMainNav() {
    const nav = document.getElementById('main-nav');
    if (!nav) return;
    nav.innerHTML = MAIN_NAV.map(item => {
        const seg = item.segment && NAV_SEGMENTS.find(s => s.id === item.segment);
        if (seg) {
            return `
                <div class="segment-menu header-menu relative">
                    <a href="${routeHref('segment', seg.id)}" data-route="segment" data-slug="${seg.id}" class="nav-link header-nav-link" data-segment="${seg.id}" aria-haspopup="true">${seg.label}<svg class="nav-chevron" viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 4.5l3 3 3-3"/></svg></a>
                    ${renderSegmentDropdown(seg)}
                </div>`;
        }
        return `<a href="${item.href}" ${item.page ? `data-route="${item.page}" data-page="${item.page}"` : `onclick="event.preventDefault(); ${item.action}"`} ${item.category ? `data-category="${item.category}"` : ''} class="nav-link header-nav-link">${item.label}</a>`;
    }).join('');
}

function renderSegmentMenus() {
    renderMainNav();
    const mobile = document.getElementById('mobile-segment-menus');
    if (mobile) {
        mobile.innerHTML = NAV_SEGMENTS.map(seg => `
            <details class="mobile-segment">
                <summary><span>${seg.label}</span><span class="disclosure-sign" aria-hidden="true"></span></summary>
                <div class="mobile-segment-models">
                    <a href="${routeHref('segment', seg.id)}" data-route="segment" data-slug="${seg.id}" class="font-semibold text-ink">All ${seg.label}</a>
                    ${seg.subcategories.map(sub => `
                        ${seg.subcategories.length > 1 ? `<p class="pt-3 text-[0.8125rem] font-medium text-mute">${sub.label}</p>` : ''}
                        ${sub.groups.flatMap(group => group.items).map(key => modelMenuItem(seg, sub, key, '')).join('')}
                    `).join('')}
                </div>
            </details>
        `).join('');
    }
}

function populateModalProductDropdown() {
    const select = document.getElementById('modal-product-select');
    if (select) {
        // Values are product slugs (two carts share the name "Tempo 2"); menu models without a page use their name
        const extraModels = Object.values(VEHICLE_MODELS).filter(m => !m.slug);
        select.innerHTML = PRODUCTS_DATA.map(p => `<option value="${p.slug}">${p.name} (${categoryLabel(p.category)})</option>`).join('')
            + extraModels.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
    }
}

// Finds a product by slug or by name (quote buttons pass either)
function findProductRef(ref) {
    if (!ref) return null;
    const lower = String(ref).toLowerCase();
    return PRODUCTS_DATA.find(p => p.slug === ref) || PRODUCTS_DATA.find(p => p.name.toLowerCase() === lower) || null;
}

function openQuoteModal(productName = '', notes = '') {
    const modal = document.getElementById('quote-modal');
    const select = document.getElementById('modal-product-select');
    const notesField = document.getElementById('modal-notes');
    if (notesField) notesField.value = notes;
    if (modal) {
        if (productName && select) {
            const match = findProductRef(productName);
            if (match) select.value = match.slug;
            else if ([...select.options].some(o => o.value === productName)) select.value = productName;
        }
        // Each quote starts with a fresh accessory selection for the chosen model
        quoteAccessories = new Set();
        // Opened from a model page: carry everything chosen there (build, packages, colors) into the request
        quoteBuild = currentPage === 'product-details' ? getBuildDetails() : null;
        renderAccessoryChips();
        renderAccessoryPicker();
        renderQuoteSummary();
        modal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        quoteModalReturnFocus = document.activeElement;
        const first = document.getElementById('modal-name');
        if (first) setTimeout(() => first.focus(), 0);
    }
}

let quoteModalReturnFocus = null;

function closeQuoteModal() {
    const modal = document.getElementById('quote-modal');
    if (!modal || modal.classList.contains('hidden')) return;
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    if (quoteModalReturnFocus && quoteModalReturnFocus.focus) quoteModalReturnFocus.focus();
}

function handleModalQuoteSubmit(e) {
    e.preventDefault();
    const refCode = 'QT-' + Math.floor(100000 + Math.random() * 900000);
    // Everything the visitor chose goes into the request alongside their own notes
    const details = document.getElementById('quote-details');
    if (details) details.value = `Reference: ${refCode}\n${getQuoteSummaryText()}`;
    closeQuoteModal();
    const count = quoteAccessories.size;
    const accessoryNote = count ? ` with ${count} accessor${count === 1 ? 'y' : 'ies'}` : '';
    showToast(`Request sent${accessoryNote}. Your reference is ${refCode}.`);
    e.target.reset();
    quoteAccessories = new Set();
    quoteBuild = null;
}

// --- QUOTE SUMMARY: what the visitor chose, shown in the quote form and sent with the request ---
let quoteBuild = null;

// The current model page's choices as label / value rows
function getBuildDetails() {
    const product = PRODUCTS_DATA.find(p => p.slug === currentSlug);
    if (!product) return null;
    const buildSet = getProductBuildSet(product);
    const level = buildSet && (buildSet.builds.find(b => b.id === detailBuild.level) || buildSet.builds[0]);
    const rows = [['Model', `${product.name} (${categoryLabel(product.category)})`]];
    if (level) rows.push(['Build', `${buildTitle(product, level)}${level.fullName && level.fullName !== level.name ? ` (${level.fullName})` : ''}`]);
    if (detailBodyColors(product).length) rows.push(['Body color', detailBuild.body || 'Standard']);
    if (getDetailSeatGroups(product).length) rows.push(['Seat', detailBuild.seat || 'Standard']);
    if (getDetailCanopyOptions(product).length) rows.push(['Canopy', detailBuild.canopy || 'Standard']);
    if (isTempoVersion(product)) rows.push(...getTempoOptionRows(product));
    return { slug: product.slug, rows };
}

// Rows for the model currently selected in the quote form (the build only applies to the model it came from)
function getQuoteSummaryRows() {
    const select = document.getElementById('modal-product-select');
    const rows = quoteBuild && select && select.value === quoteBuild.slug ? quoteBuild.rows.slice() : [];
    if (!rows.length && select && select.value) {
        const option = select.options[select.selectedIndex];
        rows.push(['Model', option ? option.textContent : select.value]);
    }
    const accessories = [...quoteAccessories].map(findAccessory).filter(Boolean);
    rows.push(['Accessories', accessories.length ? accessories.map(a => a.sku ? `${a.name} (${a.sku})` : a.name).join(', ') : 'None']);
    return rows;
}

function getQuoteSummaryText() {
    return getQuoteSummaryRows().map(([k, v]) => `${k}: ${v}`).join('\n');
}

function renderQuoteSummary() {
    const box = document.getElementById('quote-summary');
    if (!box) return;
    box.innerHTML = `
        <p class="text-sm font-medium text-ink mb-2">Your request</p>
        <dl class="border-y border-line divide-y divide-line text-sm">
            ${getQuoteSummaryRows().map(([k, v]) => `
                <div class="grid grid-cols-[7rem_1fr] gap-3 py-2"><dt class="text-mute">${k}</dt><dd class="text-ink">${v}</dd></div>
            `).join('')}
        </dl>`;
}

// SPA View Renderer Switchboard
function renderApp() {
    const viewport = document.getElementById('app-viewport');
    if (!viewport) return;
    stopLogoGrid();
    if (branchMap) { branchMap.stop(); branchMap = null; }
    if (homeBanners) { homeBanners.stop(); homeBanners = null; }

    if (currentPage === 'home') {
        viewport.innerHTML = renderHomePage();
        initHomePage();
    } else if (currentPage === 'products') {
        viewport.innerHTML = renderProductsPage();
        bindProductsFilterEvents();
    } else if (currentPage === 'product-details') {
        viewport.innerHTML = renderProductDetailsPage();
    } else if (currentPage === 'segment') {
        viewport.innerHTML = renderSegmentPage();
    } else if (currentPage === 'solutions') {
        viewport.innerHTML = renderSolutionsPage();
    } else if (currentPage === 'service') {
        viewport.innerHTML = renderServicePage();
    } else if (currentPage === 'blogs') {
        viewport.innerHTML = renderBlogsPage();
    } else if (currentPage === 'blog-details') {
        viewport.innerHTML = renderBlogDetailsPage();
    } else if (currentPage === 'about') {
        viewport.innerHTML = renderAboutPage();
    } else if (currentPage === 'contact') {
        viewport.innerHTML = renderContactPage();
        initBranchMap();
    } else if (currentPage === 'not-found') {
        viewport.innerHTML = renderNotFoundPage();
    }

    initRevealOnScroll();

}

// --- PAGE RENDERING FUNCTIONS ---

// Fades major sections in once as they scroll into view (elements with the .rise class)
function initRevealOnScroll() {
    const items = document.querySelectorAll('.rise:not(.is-visible)');
    if (!('IntersectionObserver' in window)) {
        items.forEach(el => el.classList.add('is-visible'));
        return;
    }
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    items.forEach(el => observer.observe(el));
}

// Battery comparison rows. `bars` are relative 0-100 lengths for the meter (higher = better for the buyer).
const BATTERY_COMPARISON = [
    { label: 'Lifespan', lead: '3–5 years', lithium: '8–12+ years', bars: [35, 100] },
    { label: 'Charging time', lead: '8–10 hours', lithium: '2–4 hours', bars: [30, 100] },
    { label: 'Battery weight', lead: '135–180 kg', lithium: '45–68 kg', bars: [35, 100] },
    { label: 'Maintenance', lead: 'Monthly water top-ups and terminal cleaning', lithium: 'None. Sealed, with built-in battery management', bars: [25, 100] },
    { label: 'Power on hills', lead: 'Slows down as the charge drops', lithium: 'Full power until empty', bars: [45, 100] },
    { label: 'Upfront cost', lead: 'Lower', lithium: 'About 2–3× higher', bars: [100, 40] },
    { label: '10-year cost', lead: 'Higher: 2–3 pack replacements', lithium: 'Lower: one pack lasts the decade', bars: [40, 100] }
];

// `side` is 'lead' or 'lithium'. Bars grow outward from the middle column: the lead-acid bar is anchored
// on its right edge, the lithium bar on its left, so each row reads as a head-to-head comparison.
function renderBatteryBar(value, side) {
    const isLithium = side === 'lithium';
    return `
        <div class="battery-track ${isLithium ? 'justify-start' : 'justify-end'}" aria-hidden="true">
            <div class="battery-bar ${isLithium ? 'bg-green' : 'bg-mute'}" style="--bar:${value}%"></div>
        </div>`;
}

// Lead-acid on the left, what is being compared in the middle, lithium on the right
function renderHomeBatteryCompare() {
    return `
        <section id="home-battery" class="rise home-section max-w-site mx-auto px-5 sm:px-8 lg:px-12">
            <div class="grid lg:grid-cols-12 gap-8 lg:gap-12 items-end mb-12 lg:mb-16">
                <h2 class="type-xl text-ink lg:col-span-7">Lead-acid or lithium?</h2>
                <p class="measure lg:col-span-5">It comes down to a lower price today, or lower costs and less upkeep over the life of the cart.</p>
            </div>

            <div class="max-w-5xl mx-auto">
                <div class="battery-grid">
                    <div class="battery-cell-lead px-4 sm:px-6 pt-4 pb-4 md:text-right">
                        <p class="type-md text-ink">Lead-acid</p>
                        <p class="text-sm text-mute mt-1">Flooded (FLA)</p>
                    </div>
                    <div class="battery-cell-label hidden md:block"></div>
                    <div class="battery-cell-lithium px-4 sm:px-6 pb-4 pt-4 bg-stone">
                        <p class="type-md text-ink">Lithium</p>
                        <p class="text-sm text-ink-2 mt-1">LiFePO₄ · lower running cost</p>
                    </div>
                </div>

                ${BATTERY_COMPARISON.map(row => `
                    <div class="battery-row battery-grid">
                        <p class="battery-cell-label px-4 pt-4 md:py-4 text-sm font-medium text-ink md:text-center">${row.label}</p>
                        <div class="battery-cell-lead px-4 sm:px-6 py-3 md:py-4 space-y-2 md:text-right">
                            <p class="text-sm leading-snug">${row.lead}</p>
                            ${renderBatteryBar(row.bars[0], 'lead')}
                        </div>
                        <div class="battery-cell-lithium px-4 sm:px-6 py-3 md:py-4 space-y-2 bg-stone">
                            <p class="text-sm leading-snug text-ink font-medium">${row.lithium}</p>
                            ${renderBatteryBar(row.bars[1], 'lithium')}
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="max-w-5xl mx-auto grid md:grid-cols-2 gap-px bg-line border-y border-line mt-16">
                <div class="bg-paper py-8 md:pr-10 space-y-4">
                    <h3 class="type-md text-ink">Lead-acid suits you if you</h3>
                    <ul class="home-list">
                        <li>are working with a tight upfront budget</li>
                        <li>plan to keep the cart for two years or less</li>
                        <li>don't mind monthly water checks</li>
                    </ul>
                    <button type="button" onclick="openQuoteModal('', 'Battery preference: Lead-Acid')" class="btn btn-outline">Quote with lead-acid</button>
                </div>
                <div class="bg-paper py-8 md:pl-10 space-y-4">
                    <h3 class="type-md text-ink">Lithium suits you if you</h3>
                    <ul class="home-list">
                        <li>keep the cart long-term, or run a resort, golf or village fleet</li>
                        <li>drive on hills or rough ground</li>
                        <li>want fast charging and no battery maintenance</li>
                    </ul>
                    <button type="button" onclick="openQuoteModal('', 'Battery preference: Lithium')" class="btn btn-primary">Quote with lithium</button>
                </div>
            </div>
            <p class="max-w-5xl mx-auto mt-6 text-[0.8125rem] text-mute">Typical figures for golf cart battery packs. Actual results vary with model, use and charging habits.</p>
        </section>
    `;
}

// "2 Seats (Forward Facing)" + "85 km per charge" + "30 km/h max" -> "2 seats · 85 km range · 30 km/h"
function homeSpecLine(p) {
    const seats = (p.seating || '').replace(/\s*\(.*\)/, '').replace('Seats', 'seats').replace('Cargo Box', 'cargo bed');
    return [seats, p.range && p.range.replace(' per charge', ' range'), p.speed && p.speed.replace(' max', '')].filter(Boolean).join(' · ');
}

// Promotional banners (the original homepage slider). The text is part of each image, so `alt`
// repeats it for screen readers; each banner has its own action under the slider.
const HOME_BANNERS = [
    { image: 'image/Hero/hero-1.jpg', alt: 'Fairway? Covered. Quiet, smooth, and ready to roll. Upgrade your ride with us!', cta: 'Explore The Golfer', route: 'segment', slug: 'golfer' },
    { image: 'image/Hero/hero-2.webp', alt: 'End of Year Sale: 5% off', cta: 'Shop the sale', route: 'products', slug: null },
    { image: 'image/Hero/hero-3.webp', alt: 'More than just golf carts. We keep you rolling. Message us to learn how we can help!', cta: 'Book a service', route: 'service', slug: null },
    { image: 'image/Hero/hero-5.png', alt: 'One cart is great. A whole fleet? Even better. Outfit your golf course, resort, subdivision, or campus with carts that keep up all day.', cta: 'Request a fleet proposal', route: 'solutions', slug: null }
];
const HOME_BANNER_MS = 6000;
let homeBanners = null;

function renderHomeBanners() {
    const total = HOME_BANNERS.length;
    return `
        <section class="home-banners" aria-roledescription="carousel" aria-label="Golfcarts.ph highlights">
            <h1 class="sr-only">Golfcarts.ph: low-speed electric vehicles for private roads</h1>
            <div id="home-banners" class="banner-stage">
                ${HOME_BANNERS.map((b, i) => `
                    <div class="banner-slide ${i === 0 ? 'is-active' : ''}" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${total}" ${i === 0 ? '' : 'aria-hidden="true" inert'}>
                        <img src="${b.image}" alt="${b.alt}" width="1920" height="1080" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
                    </div>
                `).join('')}
            </div>
            <div class="banner-bar">
                <div class="max-w-site mx-auto px-5 sm:px-8 lg:px-12 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div id="home-banner-ctas">
                        ${HOME_BANNERS.map((b, i) => `<a href="${routeHref(b.route, b.slug)}" data-route="${b.route}" ${b.slug ? `data-slug="${b.slug}"` : ''} class="btn btn-primary ${i === 0 ? '' : 'hidden'}" data-banner-cta="${i}">${b.cta}</a>`).join('')}
                    </div>
                    <div class="flex items-center gap-4">
                        <p class="text-sm text-mute tabular-nums hidden sm:block"><span id="home-banner-index">1</span> / ${total}</p>
                        <div class="banner-progress" aria-hidden="true">
                            ${HOME_BANNERS.map((_, i) => `<button type="button" tabindex="-1" class="banner-dot ${i === 0 ? 'is-active' : ''}" data-banner-go="${i}"><span></span></button>`).join('')}
                        </div>
                        <div class="flex items-center gap-2">
                            <button type="button" class="banner-control" data-banner="prev" aria-label="Previous banner">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>
                            </button>
                            <button type="button" class="banner-control" data-banner="toggle" aria-label="Pause banners" hidden>
                                <svg class="icon-pause" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>
                                <svg class="icon-play" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M7 5v14l12-7z"/></svg>
                            </button>
                            <button type="button" class="banner-control" data-banner="next" aria-label="Next banner">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <p id="home-banner-status" class="sr-only" aria-live="polite"></p>
        </section>
    `;
}

// Crossfades between banners; advances every few seconds unless paused, hovered, focused, off screen,
// or the visitor prefers reduced motion
function initHomeBanners() {
    if (homeBanners) homeBanners.stop();
    homeBanners = null;
    const stage = document.getElementById('home-banners');
    if (!stage) return;
    const section = stage.closest('section');
    const slides = [...stage.querySelectorAll('.banner-slide')];
    const ctas = [...document.querySelectorAll('[data-banner-cta]')];
    const dots = [...section.querySelectorAll('.banner-dot')];
    const toggle = section.querySelector('[data-banner="toggle"]');
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { index: 0, paused: reduceMotion, hovered: false, focused: false, onScreen: true, timer: 0 };

    const show = (i, announce) => {
        state.index = (i + slides.length) % slides.length;
        slides.forEach((s, k) => {
            const on = k === state.index;
            s.classList.toggle('is-active', on);
            if (on) { s.removeAttribute('aria-hidden'); s.inert = false; }
            else { s.setAttribute('aria-hidden', 'true'); s.inert = true; }
        });
        ctas.forEach((a, k) => a.classList.toggle('hidden', k !== state.index));
        dots.forEach((d, k) => d.classList.toggle('is-active', k === state.index));
        document.getElementById('home-banner-index').textContent = state.index + 1;
        if (announce) document.getElementById('home-banner-status').textContent = `Banner ${state.index + 1} of ${slides.length}`;
        restart();
    };
    const running = () => !state.paused && !state.hovered && !state.focused && state.onScreen && !document.hidden;
    // The progress bar of the active banner fills over the interval while the slider runs
    const restart = () => {
        clearTimeout(state.timer);
        section.classList.toggle('is-running', running());
        dots.forEach(d => { const bar = d.firstElementChild; bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; });
        if (running()) state.timer = setTimeout(() => show(state.index + 1, false), HOME_BANNER_MS);
    };
    const setPaused = paused => {
        state.paused = paused;
        toggle.classList.toggle('is-paused', paused);
        toggle.setAttribute('aria-label', paused ? 'Play banners' : 'Pause banners');
        restart();
    };

    const onClick = e => {
        const ctl = e.target.closest('[data-banner]');
        if (ctl) {
            const what = ctl.dataset.banner;
            if (what === 'prev') show(state.index - 1, true);
            if (what === 'next') show(state.index + 1, true);
            if (what === 'toggle') setPaused(!state.paused);
        }
        const go = e.target.closest('[data-banner-go]');
        if (go) show(+go.dataset.bannerGo, true);
    };
    const hover = on => () => { state.hovered = on; restart(); };
    const focus = on => () => { state.focused = on && section.contains(document.activeElement); restart(); };
    section.addEventListener('click', onClick);
    stage.addEventListener('mouseenter', hover(true));
    stage.addEventListener('mouseleave', hover(false));
    section.addEventListener('focusin', focus(true));
    section.addEventListener('focusout', () => setTimeout(focus(true), 0));
    const onVisibility = () => restart();
    document.addEventListener('visibilitychange', onVisibility);
    const observer = 'IntersectionObserver' in window
        ? new IntersectionObserver(([entry]) => { state.onScreen = entry.isIntersecting; restart(); }, { threshold: 0.3 })
        : null;
    if (observer) observer.observe(stage);

    toggle.hidden = reduceMotion; // nothing moves by itself with reduced motion, so no pause control
    setPaused(state.paused);

    homeBanners = {
        stop() {
            clearTimeout(state.timer);
            if (observer) observer.disconnect();
            document.removeEventListener('visibilitychange', onVisibility);
            section.removeEventListener('click', onClick);
        }
    };
}

function renderHomeRange() {
    return `
        <section class="rise home-section" aria-labelledby="home-range-title">
            <div class="max-w-site mx-auto px-5 sm:px-8 lg:px-12">
                <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6 lg:mb-8">
                    <h2 id="home-range-title" class="type-xl text-ink max-w-[13ch]">From two seats to fourteen.</h2>
                    <a href="${routeHref('products')}" data-route="products" class="link self-start md:self-auto">See every cart</a>
                </div>
                <ul class="lineup" aria-label="Model families">
                    ${HOME_LINEUP.map((c, i) => `
                        <li class="lineup-item" style="--left:${c.left}%; --width:${c.width}%; --height:${c.height}%; z-index:${i + 1}">
                            <a href="${routeHref('product-details', c.slug)}" data-route="product-details" data-slug="${c.slug}" class="lineup-cart">
                                <img src="${c.image}" alt="">
                                <span class="lineup-label">
                                    <span class="lineup-name">${c.name}</span>
                                    <span class="lineup-seats">${c.seats}</span>
                                </span>
                            </a>
                        </li>
                    `).join('')}
                </ul>
            </div>
        </section>
    `;
}

function renderHomeUseTile(id, sizeClass, imageClass) {
    const seg = NAV_SEGMENTS.find(s => s.id === id);
    const use = HOME_USES[id];
    return `
        <a href="${routeHref('segment', id)}" data-route="segment" data-slug="${id}" class="group block ${sizeClass}">
            <div class="media-zoom edge-light ${imageClass}">
                <img src="${use.image}" alt="${use.alt}" width="${use.width}" height="${use.height}" loading="lazy" decoding="async" class="w-full h-full object-cover">
            </div>
            <div class="pt-5 space-y-2">
                <h3 class="type-lg text-ink">${seg.label}</h3>
                <p class="measure">${seg.tagline}</p>
            </div>
        </a>`;
}

// Editorial grid: a large Golfer photo, two offset tiles of different sizes, and a text-led Remanufactured strip
function renderHomeUses() {
    const reman = NAV_SEGMENTS.find(s => s.id === 'remanufactured');
    return `
        <section class="rise home-section bg-paper" aria-labelledby="home-uses-title">
            <div class="max-w-site mx-auto px-5 sm:px-8 lg:px-12">
                <h2 id="home-uses-title" class="type-xl text-ink mb-12 lg:mb-16 max-w-[14ch]">Shop by how you'll use it.</h2>
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-14">
                    ${renderHomeUseTile('golfer', 'lg:col-span-7', 'aspect-[4/3] lg:aspect-[7/6]')}
                    <div class="lg:col-span-5 grid gap-y-14 lg:pt-40">
                        ${renderHomeUseTile('lifestyle', '', 'aspect-square lg:aspect-[5/4]')}
                    </div>
                    <div class="lg:col-span-5 lg:col-start-2">
                        ${renderHomeUseTile('resort', '', 'aspect-[4/3]')}
                    </div>
                    <a href="${routeHref('segment', 'remanufactured')}" data-route="segment" data-slug="remanufactured" class="group lg:col-span-5 lg:col-start-8 self-end border-t border-ink pt-6 grid grid-cols-[1fr_auto] gap-6 items-start">
                        <div class="space-y-3">
                            <h3 class="type-lg text-ink">${reman.label}</h3>
                            <p class="measure">Rebuilt Tempo carts, each quoted with its rebuild scope, battery condition and warranty terms.</p>
                            <span class="link inline-block">See available builds</span>
                        </div>
                        <img src="image/Products/reman 4.png" alt="" loading="lazy" decoding="async" class="w-28 sm:w-40 object-contain">
                    </a>
                </div>
            </div>
        </section>
    `;
}

// One Tempo 2 that repaints from a few swatches, leading into the full builder
// "What's under the seat": the animated tour of a Tempo 2 (video/vid2.mp4), leading into the battery
// comparison. The figures come from the Tempo 2's own data so they always match its model page.
function renderHomeInside() {
    const tempo = PRODUCTS_DATA.find(p => p.slug === 'golfer-tempo-2');
    const facts = [
        ['Battery', tempo.battery],
        ['Motor', tempo.powertrain],
        ['Full charge', tempo.chargingTime]
    ].filter(([, v]) => isMeaningful(v));
    return `
        <section class="rise home-inside" aria-labelledby="home-inside-title">
            <div class="max-w-site mx-auto px-5 sm:px-8 lg:px-12 py-12 lg:py-[4.5rem] grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                <div class="lg:col-span-5 space-y-8">
                    <h2 id="home-inside-title" class="type-xl text-ink">What's under the seat.</h2>
                    <p class="measure">The battery, the drive and the frame decide how far a cart goes, how it climbs and how long it lasts. Here is the Tempo 2, taken apart.</p>
                    <dl class="border-t border-line">
                        ${facts.map(([k, v]) => `<div class="grid grid-cols-[7rem_1fr] gap-4 py-3 border-b border-line"><dt class="text-sm text-mute pt-1">${k}</dt><dd class="text-lg text-ink">${v}</dd></div>`).join('')}
                    </dl>
                    <a href="${routeHref('product-details', tempo.slug)}" data-route="product-details" data-slug="${tempo.slug}" class="btn btn-outline">See the Tempo 2</a>
                </div>
                <div class="lg:col-span-7">
                    <div class="home-inside-frame">
                        <video id="home-inside-video" class="home-inside-media" muted playsinline loop preload="none" poster="image/Hero/vid2-poster.jpg" aria-label="Animation: a Tempo 2 opens to show its suspension, lithium battery and motor, then reassembles">
                            <source src="video/vid2.mp4" type="video/mp4">
                        </video>
                        <button type="button" id="home-inside-toggle" class="home-hero-toggle" aria-label="Pause video" hidden>
                            <svg class="icon-pause" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>
                            <svg class="icon-play" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M7 5v14l12-7z"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    `;
}

// Plays the tour only while it's on screen, loads it only when it comes near, and follows reduced motion
function initHomeInside() {
    const video = document.getElementById('home-inside-video');
    const toggle = document.getElementById('home-inside-toggle');
    if (!video || !toggle || !('IntersectionObserver' in window)) return;
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return; // the poster stays as a still
    let userPaused = false;
    const sync = () => {
        toggle.classList.toggle('is-paused', video.paused);
        toggle.setAttribute('aria-label', video.paused ? 'Play video' : 'Pause video');
    };
    const play = () => { const p = video.play(); if (p && p.catch) p.catch(sync); };
    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);
    toggle.addEventListener('click', () => {
        userPaused = !video.paused;
        if (video.paused) play(); else video.pause();
    });
    toggle.hidden = false;
    sync();
    new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
            if (video.preload === 'none') { video.preload = 'auto'; video.load(); }
            if (!userPaused) play();
        } else if (!video.paused) {
            video.pause();
        }
    }, { rootMargin: '200px 0px', threshold: 0.25 }).observe(video);
}

function renderHomeConfigurator() {
    const colors = getProductBodyColors(PRODUCTS_DATA.find(p => p.slug === HOME_PREVIEW_SLUG))
        .filter(c => HOME_PREVIEW_COLORS.includes(c.name));
    const base = hasLiveColorPreview(HOME_PREVIEW_SLUG) ? COLOR_PREVIEW[HOME_PREVIEW_SLUG].base : 'image/Products/Premium.png';
    return `
        <section class="rise home-section bg-stone" aria-labelledby="home-config-title">
            <div class="max-w-site mx-auto px-5 sm:px-8 lg:px-12 grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                <div class="lg:col-span-7 lg:order-2">
                    <img id="home-config-img" src="${base}" alt="Tempo 2 in ${homePreviewColor}" class="w-full aspect-[4/3] object-contain">
                </div>
                <div class="lg:col-span-5 space-y-8">
                    <h2 id="home-config-title" class="type-xl text-ink">Your color. Your seat. Your cart.</h2>
                    <p class="measure text-ink-2">Pick the body, seats, canopy and build, see it on the cart, and send it to us for a quote.</p>
                    <div class="space-y-3">
                        <p class="text-sm text-ink-2">Body color: <span id="home-config-color" class="font-semibold text-ink">${homePreviewColor}</span></p>
                        <div role="radiogroup" aria-label="Body color" class="flex flex-wrap gap-3">
                            ${colors.map(c => `
                                <button type="button" role="radio" aria-checked="${c.name === homePreviewColor}" aria-label="${c.name}" title="${c.name}"
                                    onclick="selectHomeColor('${c.name}')" class="home-swatch" style="--swatch:${c.hex}"></button>
                            `).join('')}
                        </div>
                    </div>
                    <button type="button" onclick="buildYourCart()" class="btn btn-primary">Build your cart</button>
                </div>
            </div>
        </section>
    `;
}

function selectHomeColor(name) {
    homePreviewColor = name;
    document.querySelectorAll('.home-swatch').forEach(b => b.setAttribute('aria-checked', String(b.getAttribute('aria-label') === name)));
    const label = document.getElementById('home-config-color');
    if (label) label.textContent = name;
    const product = PRODUCTS_DATA.find(p => p.slug === HOME_PREVIEW_SLUG);
    const color = getProductBodyColors(product).find(c => c.name === name);
    if (!color || !hasLiveColorPreview(HOME_PREVIEW_SLUG) || !livePreviewAvailable) return;
    const token = ++homePreviewToken;
    renderCartPreview(HOME_PREVIEW_SLUG, { body: color.hex, seat: null, canopy: null }).then(url => {
        const img = document.getElementById('home-config-img');
        if (!url || !img || token !== homePreviewToken) return;
        img.src = url;
        img.alt = `Tempo 2 in ${name}`;
    }).catch(() => { livePreviewAvailable = false; });
}

// ==========================================
// CLIENT LOGO GRID: logos travel clockwise around the outer ring of the grid. The centre block of cells
// becomes one large tile: at the end of each lap a logo slides in there and is shown large, then waits
// off the grid while the others take their turn, and comes back in at the top-left corner. Every client
// logo takes part, not only the ones that fit in the grid. The static grid is the fallback: no JavaScript,
// reduced motion, or a grid too small to have a centre.
// ==========================================
const LOGO_GRID_STEP_MS = 3200;
let logoGrid = null;

// Cell indexes (row-major) around the edge of a rows x cols grid, clockwise from the top-left corner
function logoRingOrder(rows, cols) {
    const ring = [];
    for (let c = 0; c < cols; c++) ring.push(c);
    for (let r = 1; r < rows; r++) ring.push(r * cols + cols - 1);
    for (let c = cols - 2; c >= 0; c--) ring.push((rows - 1) * cols + c);
    for (let r = rows - 2; r >= 1; r--) ring.push(r * cols);
    return ring;
}

function initLogoGrid() {
    stopLogoGrid();
    const wrap = document.getElementById('home-logos-wrap');
    const grid = document.getElementById('home-logos');
    const toggle = document.getElementById('home-logos-toggle');
    if (!wrap || !grid || !toggle) return;
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cells = [...grid.children].filter(li => li.offsetParent !== null);
    const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;
    const rows = cols ? Math.floor(cells.length / cols) : 0;
    if (reduceMotion || rows < 3 || cols < 3 || rows * cols !== cells.length) return;

    const ring = logoRingOrder(rows, cols);
    const inner = cells.map((_, i) => i).filter(i => !ring.includes(i));

    // The path every logo follows: each ring cell in turn, then the centre tile, then the waiting line
    // (hidden), then back to the first ring cell. One step moves every logo one place along it.
    const pathLength = Math.max(CLIENT_LOGOS.length, ring.length + 1);
    const layer = document.createElement('div');
    layer.className = 'home-logo-layer';
    layer.setAttribute('aria-hidden', 'true'); // the static list underneath keeps the logos' names for screen readers
    const feature = document.createElement('div');
    feature.className = 'home-logo-feature';
    layer.appendChild(feature);
    const logos = CLIENT_LOGOS.map(src => {
        const item = document.createElement('div');
        item.className = 'home-logo-float';
        item.innerHTML = `<img src="${src}" alt="" decoding="async">`;
        layer.appendChild(item);
        return item;
    });
    wrap.appendChild(layer);
    wrap.classList.add('is-animated');

    let offset = 0; // logo i sits at path position (i + offset) % pathLength

    const place = (animate = true) => {
        layer.classList.toggle('is-still', !animate);
        const box = cell => ({ x: cell.offsetLeft, y: cell.offsetTop, w: cell.offsetWidth, h: cell.offsetHeight });
        const first = box(cells[inner[0]]), last = box(cells[inner[inner.length - 1]]);
        // The centre tile covers the inner cells; it stops 1px short so the ring's grid lines stay visible
        const centre = { x: first.x, y: first.y, w: last.x + last.w - first.x - 1, h: last.y + last.h - first.y - 1 };
        Object.assign(feature.style, { width: `${centre.w}px`, height: `${centre.h}px`, transform: `translate(${centre.x}px, ${centre.y}px)` });
        const cellBox = box(cells[ring[0]]);
        const grow = Math.min(centre.w / cellBox.w, centre.h / cellBox.h) * 0.9;

        logos.forEach((item, i) => {
            const pos = (i + offset) % pathLength;
            let x, y, scale = 1, state;
            if (pos < ring.length) {
                ({ x, y } = box(cells[ring[pos]]));
                state = 'ring';
            } else if (pos === ring.length) {
                // Centred in the big tile and enlarged
                x = centre.x + (centre.w - cellBox.w) / 2;
                y = centre.y + (centre.h - cellBox.h) / 2;
                scale = grow;
                state = 'featured';
            } else {
                // Waiting: hidden on the first ring cell, ready to fade in there
                ({ x, y } = box(cells[ring[0]]));
                state = 'waiting';
            }
            item.style.width = `${cellBox.w}px`;
            item.style.height = `${cellBox.h}px`;
            item.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
            item.dataset.state = state;
        });
        if (!animate) {
            void layer.offsetWidth; // apply positions before transitions come back
            layer.classList.remove('is-still');
        }
    };
    place(false);

    const state = { paused: false, hovered: false, onScreen: true };
    const tick = () => {
        if (state.paused || state.hovered || !state.onScreen || document.hidden) return;
        offset = (offset + 1) % pathLength;
        place();
    };

    const setPaused = paused => {
        state.paused = paused;
        toggle.textContent = paused ? 'Play logos' : 'Pause logos';
        toggle.setAttribute('aria-pressed', String(paused));
    };
    const onToggle = () => setPaused(!state.paused);
    toggle.addEventListener('click', onToggle);
    layer.addEventListener('mouseenter', () => { state.hovered = true; });
    layer.addEventListener('mouseleave', () => { state.hovered = false; });
    setPaused(false);
    toggle.hidden = false;

    const onScreen = new IntersectionObserver(([entry]) => { state.onScreen = entry.isIntersecting; });
    onScreen.observe(wrap);
    // Keep logos on their cells when the layout changes; a different column count rebuilds the grid
    const resized = new ResizeObserver(() => {
        const nowCols = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;
        if (nowCols !== cols) initLogoGrid();
        else place(false);
    });
    resized.observe(grid);

    logoGrid = {
        timer: setInterval(tick, LOGO_GRID_STEP_MS),
        stop() {
            onScreen.disconnect();
            resized.disconnect();
            toggle.removeEventListener('click', onToggle);
            toggle.hidden = true;
            layer.remove();
            wrap.classList.remove('is-animated');
        }
    };
}

function stopLogoGrid() {
    if (!logoGrid) return;
    clearInterval(logoGrid.timer);
    logoGrid.stop();
    logoGrid = null;
}

function renderHomeTrust() {
    return `
        <section class="rise home-section" aria-labelledby="home-trust-title">
            <div class="max-w-site mx-auto px-5 sm:px-8 lg:px-12 grid lg:grid-cols-12 gap-12">
                <div class="lg:col-span-4 space-y-10">
                    <h2 id="home-trust-title" class="type-lg text-ink">Running on courses, resorts and sites across the Philippines.</h2>
                    <dl class="grid grid-cols-2 gap-8 border-t border-line pt-8">
                        <div><dt class="text-sm text-mute">Clients</dt><dd class="type-xl text-ink mt-2">${CLIENT_LOGOS.length}+</dd></div>
                        <div><dt class="text-sm text-mute">Branches</dt><dd class="mt-2"><a href="./#home-branches" onclick="event.preventDefault(); goToHomeSection('home-branches')" class="group inline-flex items-baseline gap-3"><span class="type-xl text-ink">${BRANCHES.length}</span><span class="link text-sm">See the map</span></a></dd></div>
                    </dl>
                </div>
                <div class="lg:col-span-8">
                    <!-- Logos animate around the grid (initLogoGrid); without JavaScript or with reduced motion it stays static -->
                    <div id="home-logos-wrap" class="relative">
                        <ul id="home-logos" class="home-logos" aria-label="Clients">
                            ${CLIENT_LOGOS.slice(0, 24).map((logo, i) => `
                                <li class="${i >= 12 ? 'hidden md:flex' : 'flex'}"><img src="${logo}" alt="Client logo ${i + 1}" loading="lazy" decoding="async"></li>
                            `).join('')}
                        </ul>
                    </div>
                    <button type="button" id="home-logos-toggle" class="link text-sm mt-4" aria-pressed="false" hidden>Pause logos</button>
                </div>
            </div>
        </section>
    `;
}

function renderHomeQuote() {
    const vehicleOptions = PRODUCTS_DATA.filter(p => p.category !== 'Accessories');
    return `
        <section id="home-quote" class="rise home-section bg-paper border-t border-line scroll-mt-20" aria-labelledby="home-quote-title">
            <div class="max-w-site mx-auto px-5 sm:px-8 lg:px-12 grid lg:grid-cols-12 gap-12">
                <div class="lg:col-span-4 space-y-5">
                    <h2 id="home-quote-title" class="type-xl text-ink">Get a quote.</h2>
                    <p class="measure">Choose a model and your nearest branch. We'll reply with pricing and lead times.</p>
                </div>
                <form onsubmit="handleHomeQuoteSubmit(event)" class="lg:col-span-7 lg:col-start-6 grid sm:grid-cols-2 gap-x-6 gap-y-5">
                    <div class="field"><label for="hq-name">Full name</label><input id="hq-name" name="name" required type="text" autocomplete="name"></div>
                    <div class="field"><label for="hq-phone">Mobile number</label><input id="hq-phone" name="phone" required type="tel" autocomplete="tel" placeholder="+63 900 000 0000"></div>
                    <div class="field"><label for="hq-email">Email</label><input id="hq-email" name="email" required type="email" autocomplete="email"></div>
                    <div class="field"><label for="hq-qty">Quantity</label><input id="hq-qty" name="quantity" type="number" min="1" value="1"></div>
                    <div class="field"><label for="hq-model">Model</label>
                        <select id="hq-model" name="model" required>
                            <option value="">Select a model</option>
                            ${vehicleOptions.map(p => `<option value="${p.slug}">${p.name} (${categoryLabel(p.category)})</option>`).join('')}
                        </select>
                    </div>
                    <div class="field"><label for="hq-branch">Nearest branch</label>
                        <select id="hq-branch" name="branch" required>
                            <option value="">Select a branch</option>
                            ${BRANCHES.map(b => `<option>${b.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="field sm:col-span-2"><label for="hq-notes">Notes (optional)</label><textarea id="hq-notes" name="notes" rows="3" placeholder="Color, accessories, delivery location"></textarea></div>
                    <div class="sm:col-span-2"><button type="submit" class="btn btn-primary">Send request</button></div>
                </form>
            </div>
        </section>
    `;
}

// ==========================================
// BRANCH MAP: a dot-matrix map of the Philippines with the four branches. Routes run from Manila to the
// other branches; choosing a branch flies the camera to it. The coastline (image/map/philippines.svg) is
// Natural Earth 1:10m data, projected with the same formula as branchMapPoint() so the pins line up.
// Without JavaScript the branch list below the map carries everything.
// ==========================================
const BRANCH_MAP = {
    lon0: 116, lat0: 21.5,
    kx: 100 * Math.cos(12.5 * Math.PI / 180), ky: 100,
    hub: 0,               // Manila: routes start here
    focusWidth: 110,      // view width when flying to one branch (about 1.1 degrees: the city, its bay and nearby branches)
    flyMs: 1400
};
let branchMap = null;

// lat / lon -> map units (1 degree of latitude = 100 units)
function branchMapPoint(b) {
    return [(b.lon - BRANCH_MAP.lon0) * BRANCH_MAP.kx, (BRANCH_MAP.lat0 - b.lat) * BRANCH_MAP.ky];
}

function branchMapLatLon(x, y) {
    return [BRANCH_MAP.lat0 - y / BRANCH_MAP.ky, x / BRANCH_MAP.kx + BRANCH_MAP.lon0];
}

function formatLatLon(lat, lon) {
    return `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
}

// A view that fits every branch, with room around it, at the given width / height ratio
function branchMapOverview(aspect) {
    const pts = BRANCHES.map(branchMapPoint);
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const w = (Math.max(...xs) - Math.min(...xs)) * 1.6, h = (Math.max(...ys) - Math.min(...ys)) * 1.35;
    const width = Math.max(w, h * aspect);
    return { cx, cy, w: width, h: width / aspect };
}

// Curved route from the hub to a branch: a quadratic curve bowed to one side
function branchRoutePath(from, to) {
    const [x1, y1] = from, [x2, y2] = to;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1;
    return `M${x1.toFixed(1)} ${y1.toFixed(1)}Q${(mx - dy * 0.22).toFixed(1)} ${(my + dx * 0.22).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

function renderBranchMap(sectionId = 'home-branches') {
    const view = branchMapOverview(4 / 3);
    const pts = BRANCHES.map(branchMapPoint);
    const hub = pts[BRANCH_MAP.hub];
    return `
        <section id="${sectionId}" class="branch-map-section scroll-mt-16" aria-labelledby="${sectionId}-title">
            <div class="max-w-site mx-auto px-5 sm:px-8 lg:px-12 py-12 lg:py-[4.5rem]">
                <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 lg:mb-14">
                    <h2 id="${sectionId}-title" class="type-xl text-ink">Four branches.</h2>
                    <p class="measure">Showrooms and service in Manila, Cebu, Laguna and Clark. Choose a branch to find it on the map.</p>
                </div>
                <div class="grid lg:grid-cols-12 gap-6 lg:gap-8">
                    <div id="branch-map" class="branch-map lg:col-span-8">
                        <svg id="branch-map-svg" viewBox="${(view.cx - view.w / 2).toFixed(1)} ${(view.cy - view.h / 2).toFixed(1)} ${view.w.toFixed(1)} ${view.h.toFixed(1)}"
                             role="img" aria-label="Map of the Philippines showing the four Golfcarts.ph branches">
                            <defs>
                                <pattern id="branch-map-dots" width="6" height="6" patternUnits="userSpaceOnUse">
                                    <circle cx="3" cy="3" r="1.1"></circle>
                                </pattern>
                            </defs>
                            <g id="branch-map-land"></g>
                            <g class="branch-map-routes">
                                ${pts.map((p, i) => i === BRANCH_MAP.hub ? '' : `
                                    <path id="branch-route-${i}" d="${branchRoutePath(hub, p)}" class="branch-route"></path>
                                    <circle class="branch-packet" r="2.5">
                                        <animateMotion dur="${3 + i * 0.6}s" repeatCount="indefinite"><mpath href="#branch-route-${i}"></mpath></animateMotion>
                                    </circle>`).join('')}
                            </g>
                            <g class="branch-map-pins">
                                ${BRANCHES.map((b, i) => `
                                    <g class="branch-pin" data-branch="${i}" transform="translate(${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)})">
                                        <circle class="branch-pin-pulse" r="6"></circle>
                                        <circle class="branch-pin-pulse branch-pin-pulse-late" r="6"></circle>
                                        <circle class="branch-pin-core" r="5"></circle>
                                        <text class="branch-pin-label" x="12" y="4">${b.name.replace(' Branch', '')}</text>
                                    </g>`).join('')}
                            </g>
                        </svg>
                        <div class="branch-map-grid" aria-hidden="true"></div>
                        <div class="branch-map-sweep" aria-hidden="true"></div>
                        <p class="branch-map-hud" aria-hidden="true"><span id="branch-map-readout">${formatLatLon(...branchMapLatLon(view.cx, view.cy))}</span><span id="branch-map-zoom">1.0×</span></p>
                        <button type="button" id="branch-map-reset" class="branch-map-reset" hidden>Show all branches</button>
                    </div>

                    <ol class="branch-list lg:col-span-4" aria-label="Branches">
                        ${BRANCHES.map((b, i) => `
                            <li class="branch-item edge-light" data-branch="${i}">
                                <button type="button" class="branch-item-select" data-branch="${i}" aria-pressed="false" aria-controls="branch-map">
                                    <span class="flex items-baseline justify-between gap-4">
                                        <span class="type-md text-ink">${b.name.replace(' Branch', '')}</span>
                                        <span class="branch-coords">${formatLatLon(b.lat, b.lon)}</span>
                                    </span>
                                    <span class="block text-sm text-ink-2 mt-2">${b.address}</span>
                                </button>
                                <p class="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm mt-3">
                                    ${b.phones.length
                                        ? b.phones.map(ph => `<a href="tel:${ph.replace(/[^\d+]/g, '')}" class="text-ink hover:underline underline-offset-4">${ph}</a>`).join('')
                                        : `<a href="${routeHref('contact')}" data-route="contact" class="text-ink hover:underline underline-offset-4">Contact us</a>`}
                                    <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}" target="_blank" rel="noopener" class="branch-directions">Get directions<span class="sr-only"> to the ${b.name} (opens Google Maps)</span></a>
                                </p>
                            </li>
                        `).join('')}
                    </ol>
                </div>
            </div>
        </section>
    `;
}

// cubic-bezier(0.22, 1, 0.36, 1), the site's easing curve, as a function of time 0..1
function branchMapEase(t) {
    const p1x = 0.22, p1y = 1, p2x = 0.36, p2y = 1;
    const bez = (a, b, s) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
    let s = t;
    for (let i = 0; i < 6; i++) {
        const x = bez(p1x, p2x, s) - t;
        const dx = 3 * p1x * (1 - s) ** 2 + 6 * (p2x - p1x) * s * (1 - s) + 3 * (1 - p2x) * s * s;
        if (Math.abs(dx) < 1e-6) break;
        s = Math.min(1, Math.max(0, s - x / dx));
    }
    return bez(p1y, p2y, s);
}

function initBranchMap() {
    if (branchMap) branchMap.stop();
    branchMap = null;
    const box = document.getElementById('branch-map');
    const svg = document.getElementById('branch-map-svg');
    // The camera needs a real browser; pre-rendered pages keep the static overview
    if (!box || !svg || !('ResizeObserver' in window)) return;
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) svg.querySelectorAll('animateMotion').forEach(a => a.remove());

    const pins = [...svg.querySelectorAll('.branch-pin')];
    const items = [...document.querySelectorAll('.branch-item')];
    const pattern = svg.querySelector('#branch-map-dots');
    const readout = document.getElementById('branch-map-readout');
    const zoomLabel = document.getElementById('branch-map-zoom');
    const reset = document.getElementById('branch-map-reset');
    const pts = BRANCHES.map(branchMapPoint);
    let overview = null, view = null, frame = 0, selected = null;

    // Draws the camera: viewBox, plus pins, dots and packets kept at a constant size on screen
    const draw = v => {
        view = v;
        svg.setAttribute('viewBox', `${v.cx - v.w / 2} ${v.cy - v.h / 2} ${v.w} ${v.h}`);
        const unit = v.w / Math.max(1, box.clientWidth); // map units per screen pixel
        pins.forEach((pin, i) => pin.setAttribute('transform', `translate(${pts[i][0]} ${pts[i][1]}) scale(${unit})`));
        svg.querySelectorAll('.branch-packet').forEach(p => p.setAttribute('r', 2.5 * unit));
        const dot = 7 * unit;
        pattern.setAttribute('width', dot);
        pattern.setAttribute('height', dot);
        pattern.firstElementChild.setAttribute('cx', dot / 2);
        pattern.firstElementChild.setAttribute('cy', dot / 2);
        pattern.firstElementChild.setAttribute('r', 1.2 * unit);
        readout.textContent = formatLatLon(...branchMapLatLon(v.cx, v.cy));
        zoomLabel.textContent = `${(overview.w / v.w).toFixed(1)}×`;
    };

    // Smooth camera move: centre eases linearly, zoom eases on a log scale so it feels even
    const flyTo = target => {
        cancelAnimationFrame(frame);
        if (reduceMotion) { draw(target); return; }
        const from = { ...view }, start = performance.now();
        const step = now => {
            const t = Math.min(1, (now - start) / BRANCH_MAP.flyMs), e = branchMapEase(t);
            const w = Math.exp(Math.log(from.w) + (Math.log(target.w) - Math.log(from.w)) * e);
            draw({ cx: from.cx + (target.cx - from.cx) * e, cy: from.cy + (target.cy - from.cy) * e, w, h: w * (target.h / target.w) });
            if (t < 1) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
    };

    const aspect = () => box.clientWidth / Math.max(1, box.clientHeight);
    const focusView = i => ({ cx: pts[i][0], cy: pts[i][1], w: BRANCH_MAP.focusWidth, h: BRANCH_MAP.focusWidth / aspect() });

    const select = i => {
        selected = i;
        items.forEach((li, k) => {
            li.classList.toggle('is-selected', k === i);
            li.querySelector('.branch-item-select').setAttribute('aria-pressed', String(k === i));
        });
        pins.forEach((pin, k) => pin.classList.toggle('is-selected', k === i));
        reset.hidden = i === null;
        flyTo(i === null ? overview : focusView(i));
    };
    const highlight = (i, on) => pins[i] && pins[i].classList.toggle('is-hovered', on);

    const onClick = e => {
        const btn = e.target.closest('.branch-item-select');
        if (btn) select(selected === +btn.dataset.branch ? null : +btn.dataset.branch);
        const pin = e.target.closest('.branch-pin');
        if (pin) select(+pin.dataset.branch);
        if (e.target.closest('#branch-map-reset')) select(null);
    };
    const onOver = e => { const li = e.target.closest('.branch-item'); if (li) highlight(+li.dataset.branch, true); };
    const onOut = e => { const li = e.target.closest('.branch-item'); if (li) highlight(+li.dataset.branch, false); };
    const section = box.closest('section');
    section.addEventListener('click', onClick);
    section.addEventListener('mouseover', onOver);
    section.addEventListener('mouseout', onOut);

    const layout = () => {
        overview = branchMapOverview(aspect());
        cancelAnimationFrame(frame);
        draw(selected === null ? overview : focusView(selected));
    };
    layout();
    const resized = new ResizeObserver(layout);
    resized.observe(box);

    // The coastline loads separately so pages without the map don't download it
    if (window.fetch) {
        fetch('image/map/philippines.svg').then(r => (r.ok ? r.text() : '')).then(text => {
            const d = (text.match(/\sd="([^"]+)"/) || [])[1];
            const land = document.getElementById('branch-map-land');
            if (d && land) land.innerHTML = `<path class="branch-map-land" d="${d}"></path>`;
        }).catch(() => {});
    }

    branchMap = {
        stop() {
            cancelAnimationFrame(frame);
            resized.disconnect();
            section.removeEventListener('click', onClick);
            section.removeEventListener('mouseover', onOver);
            section.removeEventListener('mouseout', onOut);
        }
    };
}

function renderHomeBranches() {
    return renderBranchMap('home-branches');
}

function renderHomeFaq() {
    return `
        <section class="rise home-section pt-0" aria-labelledby="home-faq-title">
            <div class="max-w-site mx-auto px-5 sm:px-8 lg:px-12 grid lg:grid-cols-12 gap-12">
                <div class="lg:col-span-4 space-y-5">
                    <h2 id="home-faq-title" class="type-lg text-ink">Questions, answered.</h2>
                    <a href="${routeHref('contact')}" data-route="contact" class="link inline-block">Ask us something else</a>
                </div>
                <div class="lg:col-span-8 border-b border-line">
                    ${HOME_FAQS.map(faq => `
                        <details class="home-faq border-t border-line">
                            <summary class="flex items-start justify-between gap-6 py-6 cursor-pointer list-none text-lg text-ink font-medium">
                                <span>${faq.q}</span><span class="home-faq-sign" aria-hidden="true"></span>
                            </summary>
                            <p class="pb-6 -mt-2 measure">${faq.a}</p>
                        </details>
                    `).join('')}
                </div>
            </div>
        </section>
    `;
}

function renderHomePage() {
    return `
        ${renderHomeBanners()}

        ${renderHomeRange()}
        ${renderHomeUses()}
        ${renderHomeConfigurator()}
        ${renderHomeInside()}
        ${renderHomeBatteryCompare()}
        ${renderHomeTrust()}
        ${renderHomeQuote()}
        ${renderHomeBranches()}
        ${renderHomeFaq()}
    `;
}

// Starts the homepage's moving parts: banner slider (the hero), client logos, branch map and the video tour
function initHomePage() {
    initHomeBanners();
    initLogoGrid();
    initBranchMap();
    initHomeInside();
}

function renderNotFoundPage() {
    return `
        <section class="home-section max-w-site mx-auto px-5 sm:px-8 lg:px-12 min-h-[60vh]">
            <h1 class="type-xl text-ink max-w-[14ch]">This page isn't on the map.</h1>
            <p class="measure mt-6">The link may be old or mistyped. Start from the homepage or see every cart.</p>
            <div class="flex flex-wrap gap-4 mt-10">
                <a href="./" data-route="home" class="btn btn-primary">Go to the homepage</a>
                <a href="${routeHref('products')}" data-route="products" class="btn btn-outline">See every cart</a>
            </div>
        </section>
    `;
}

function filterProducts() {
    const q = productSearchQuery.toLowerCase();
    return PRODUCTS_DATA.filter(p => (productFilterCategory === 'All' || p.category === productFilterCategory)
        && (p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)));
}

function renderProductGridItems(list) {
    return list.length
        ? list.map(p => `<li>${renderModelTile(p)}</li>`).join('')
        : `<li class="col-span-full py-16 border-y border-line"><p class="type-md text-ink">Nothing matches "${productSearchQuery.replace(/</g, '&lt;')}".</p><p class="mt-2">Try a model name, such as Tempo or Villager.</p></li>`;
}

function renderProductsPage() {
    const banner = CATEGORY_BANNERS[productFilterCategory];
    const filtered = filterProducts();

    return `
        <section class="max-w-site mx-auto px-5 sm:px-8 lg:px-12 pt-16 lg:pt-24">
            <div class="grid lg:grid-cols-12 gap-8 lg:gap-12 items-end">
                <h1 class="type-xl text-ink lg:col-span-7">${banner ? banner.headline : 'Every cart we sell.'}</h1>
                <p class="measure lg:col-span-5">${banner ? banner.subheadline : 'Golf, lifestyle, resort and utility models, plus parts and accessories. Every cart can be built to order.'}</p>
            </div>

            <!-- Categories live in the header menu; this row only searches within the current list -->
            <div class="mt-12 flex flex-col-reverse md:flex-row md:items-end justify-between gap-4 border-b border-line pb-4">
                <p class="text-sm text-mute"><span id="product-count" aria-live="polite">${filtered.length} ${filtered.length === 1 ? 'result' : 'results'}</span>${productFilterCategory !== 'All'
                    ? ` · <a href="carts/" data-route="products" data-category="All" class="link text-ink">See all carts</a>` : ''}</p>
                <div class="field md:w-72">
                    <label for="product-search-input" class="sr-only">Search carts and accessories</label>
                    <input id="product-search-input" type="search" value="${productSearchQuery.replace(/"/g, '&quot;')}" placeholder="Search carts and accessories" class="!min-h-[2.75rem]">
                </div>
            </div>
        </section>

        ${banner && banner.photo ? `
            <div class="max-w-site mx-auto px-5 sm:px-8 lg:px-12 mt-10">
                <div class="aspect-[16/9] md:aspect-[21/8] overflow-hidden bg-stone">
                    <img src="${banner.photo}" alt="${banner.title}" class="w-full h-full object-cover" style="object-position:${banner.photoFocus || 'center'}">
                </div>
            </div>
        ` : ''}

        <section class="max-w-site mx-auto px-5 sm:px-8 lg:px-12 pt-12 pb-12 lg:pb-[4.5rem]">
            <ul id="product-grid-container" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
                ${renderProductGridItems(filtered)}
            </ul>
        </section>
    `;
}

function bindProductsFilterEvents() {
    const input = document.getElementById('product-search-input');
    if (!input) return;
    input.addEventListener('input', e => {
        productSearchQuery = e.target.value;
        const list = filterProducts();
        const grid = document.getElementById('product-grid-container');
        if (grid) grid.innerHTML = renderProductGridItems(list);
        const count = document.getElementById('product-count');
        if (count) count.textContent = `${list.length} ${list.length === 1 ? 'result' : 'results'}`;
    });
}

// --- VEHICLE DETAIL PAGE (Overview / Colors / Features / Specifications) ---

// Available colors per model family, from the "Versions" cart-builder sheet (STEP 2 COLORS tab).
// Products opt in with `colorFamily`; hex values are approximate screen swatches.
const CHAMELEON_SWATCH = 'linear-gradient(135deg, #5B2C83, #1F6FB2, #2E9E6B)';

// Seat options for Tempo, Tempo Premium and Reman (sheet: "SELECT YOUR SEAT COLOR").
// The sheet's premium "Light Beige", "Black" and "Grey" are its Modern Premium seats, named in full here
// so they don't clash with the standard White / Beige / Black / Grey.
const CLUB_CAR_SEAT_GROUPS = [
    { tier: 'Standard Club Car Seats', options: ['White', 'Beige', 'Black', 'Grey'] },
    { tier: 'Premium Club Car Seats', options: [
        'Modern Premium Light Beige', 'Premium Camello', 'Modern Premium Black', 'Premium Black and Grey',
        'Modern Premium Grey', 'Elite Bright White', 'Premium Light Beige', 'Premium Off White', 'Premium Black',
        'Premium Grey', 'Premium Camello & Light Beige', 'Premium Camello & Off White', 'Premium Light Beige & Off White',
        'Premium Camello (Special Promo)', 'Premium Black and Grey (Special Promo)',
        'High-Back Sport Black Carbon Fiber with Silver Inlay', 'High-Back Luxury Honey Beige with Black Inlay',
        'High-Back Luxury Briar Brown'
    ] },
    { tier: 'Premium GC Seats', options: [
        'Tsunami Silver Red & Black', 'Tsunami Silver Grey & Black', 'Tsunami Silver Blue & Black',
        'GC White with Arm Rest', 'GC Beige with Arm Rest', 'GC Dark Brown with Arm Rest',
        'Coffee Brown Ventilated Premium Seats'
    ] }
];

// Seat photos from the "Versions" sheet's Guide tab (Photo Links column), saved to image/Seats.
// Two photos = front and rear seat. Only used with CLUB_CAR_SEAT_GROUPS (Carryall seats are a different style).
// The sheet links "GC Beige" to the file named "GC Brown Rear Seat"; both GC front links point to one
// shared photo, so only the rear photos are used for GC Beige / Dark Brown. Coffee Brown has no photo yet.
const SEAT_PHOTOS = {
    'White': ['standard-white'], 'Beige': ['standard-beige'], 'Black': ['standard-black'], 'Grey': ['standard-grey'],
    'Modern Premium Light Beige': ['modern-light-beige'], 'Premium Camello': ['modern-camello'],
    'Modern Premium Black': ['modern-black'], 'Premium Black and Grey': ['modern-black-grey'],
    'Modern Premium Grey': ['modern-grey'], 'Elite Bright White': ['elite-bright-white'],
    'Premium Light Beige': ['classic-light-beige'], 'Premium Off White': ['classic-off-white'],
    'Premium Black': ['classic-black'], 'Premium Grey': ['classic-grey'],
    'Premium Camello & Light Beige': ['classic-camello-light-beige'], 'Premium Camello & Off White': ['classic-camello-off-white'],
    'Premium Camello (Special Promo)': ['classic-camello'], 'Premium Black and Grey (Special Promo)': ['classic-black-grey'],
    'High-Back Sport Black Carbon Fiber with Silver Inlay': ['highback-black-silver'],
    'High-Back Luxury Honey Beige with Black Inlay': ['highback-honey-black'],
    'High-Back Luxury Briar Brown': ['highback-briar-brown'],
    'Tsunami Silver Red & Black': ['tsunami-red-front', 'tsunami-red-rear'],
    'Tsunami Silver Grey & Black': ['tsunami-grey-front', 'tsunami-grey-rear'],
    'Tsunami Silver Blue & Black': ['tsunami-blue-front', 'tsunami-blue-rear'],
    'GC White with Arm Rest': ['gc-white-front', 'gc-white-rear'],
    'GC Beige with Arm Rest': ['gc-brown-rear'],
    'GC Dark Brown with Arm Rest': ['gc-dark-brown-rear']
};

function getSeatPhotos(seatGroups, option) {
    if (seatGroups !== CLUB_CAR_SEAT_GROUPS) return [];
    return (SEAT_PHOTOS[SEAT_ALIASES[option] || option] || []).map(name => `image/Seats/${name}.jpg`);
}
const COLOR_FAMILIES = {
    tempo: {
        body: [
            { tier: 'Standard Club Car Colors', colors: [
                { name: 'White', hex: '#F5F5F2' }, { name: 'Black', hex: '#1C1D1F' }, { name: 'Cashmere', hex: '#CDBA96' },
                { name: 'Sangria', hex: '#8E1B22' }, { name: 'Sapphire', hex: '#1E3A78' }, { name: 'Green', hex: '#0F5A45' },
                { name: 'Platinum Grey', hex: '#8F9396' }
            ] },
            { tier: 'Premium Club Car Colors', colors: [
                { name: 'Atomic Orange', hex: '#F26B1D' }, { name: 'Synergy Green', hex: '#6DB33F' }, { name: 'Rally Red', hex: '#C4161C' },
                { name: 'Metallic Green', hex: '#2E5E3A' }, { name: 'Metallic Black', hex: '#232427' }, { name: 'Metallic Midnight Silver', hex: '#4B5056' },
                { name: 'Metallic Brilliant Blue', hex: '#1F4FBF' }, { name: 'Metallic Ice Blue', hex: '#A9C8DA' }, { name: 'Metallic Signature Silver', hex: '#B7BABD' },
                { name: 'Metallic Glacier White', hex: '#EEF0EE' }, { name: 'Pearl Mist Grey', hex: '#A7A9AA' }, { name: 'Pearl Blue', hex: '#2F5D8A' }
            ] },
            { tier: 'Premium GC Custom Paint', colors: [
                { name: '3D Paint', hex: 'linear-gradient(135deg, #C9CCD1, #5E6670, #E8EAEC)' },
                { name: 'Chameleon (7 colors)', hex: CHAMELEON_SWATCH },
                { name: 'Chameleon (3 colors)', hex: CHAMELEON_SWATCH }
            ] }
        ],
        seatGroups: CLUB_CAR_SEAT_GROUPS
    },
    // Remanufactured Tempo carts; uses the same seat options as Tempo (per the sheet)
    reman: {
        body: [
            { tier: 'Remanufactured Colors', colors: [
                { name: 'Cashmere', hex: '#CDBA96' }, { name: 'Black', hex: '#1C1D1F' }, { name: 'Cayenne', hex: '#A4402A' }
            ] },
            { tier: 'Premium GC Custom Paint', colors: [
                { name: '3D Paint', hex: 'linear-gradient(135deg, #C9CCD1, #5E6670, #E8EAEC)' },
                { name: 'Chameleon (7 colors)', hex: CHAMELEON_SWATCH },
                { name: 'Chameleon (3 colors)', hex: CHAMELEON_SWATCH }
            ] }
        ],
        seatGroups: CLUB_CAR_SEAT_GROUPS
    },
    villager: {
        body: [{ tier: 'Villager Colors', colors: [
            { name: 'White', hex: '#F5F5F2' }, { name: 'Beige', hex: '#D8C8A6' }, { name: 'Green', hex: '#0F5A45' }
        ] }]
    },
    carryall: {
        body: [{ tier: 'Transporter & Carryall Colors', colors: [
            { name: 'White', hex: '#F5F5F2' }, { name: 'Green', hex: '#0F5A45' }, { name: 'Grey', hex: '#8C8F92' }
        ] }],
        seatGroups: [{ tier: 'Carryall Seats', options: ['Gray', 'White', 'Black', 'Beige'] }]
    }
};

// Canopy options per model, from the sheet's "SELECT YOUR CANOPY COLOR" step. Products point here with `canopyKey`.
// CC = Club Car canopy, CN = the non-Club Car 80" / 120" canopy listed in the sheet.
const CANOPY_OPTIONS = {
    'tempo-2': ['White', 'Beige', 'Black'],
    // 2+2 Club Car seat kit: White/Beige/Black; Genesis and Metal flip-seat builds add Black CN
    'tempo-2+2': ['White', 'Beige', 'Black', 'Black CN'],
    'tempo-4': ['Black'],
    'tempo-4+2': ['White CC', 'Beige CC', 'Black CC', 'Black CN'],
    'tempo-6': ['White CC', 'Beige CC', 'Black CC', 'Black CN'],
    'tempo-6+2': ['White', 'Black'],
    'transporter-4': ['White', 'Beige', 'Black'],
    'transporter-6': ['White', 'Beige', 'Black'],
    'villager-6': ['White', 'Beige'],
    'villager-8': ['White', 'Beige'],
    'carryall-300': ['White', 'Beige', 'Black'],
    'carryall-500': ['White', 'Beige', 'Black'],
    'carryall-700': ['White', 'Beige', 'Black', 'White Long Canopy', 'Beige Long Canopy', 'Black Long Canopy'],
    'minibus-14': ['Black'],
    'minibus-23': ['Black']
};

// A product's body colors in their groups. Tempo models offer the colors of a build level (`level` is its
// index); without a level, all the colors any build offers (the last level offers them all).
function getProductBodyGroups(product, level) {
    const family = COLOR_FAMILIES[product.colorFamily];
    if (!family) return [];
    if (!isTempoVersion(product)) return family.body;
    const names = TEMPO_MATRIX.body[level === undefined ? TEMPO_MATRIX.body.length - 1 : level];
    const known = Object.fromEntries(family.body.flatMap(g => g.colors).map(c => [c.name, c.hex]));
    const colors = names.map(name => ({ name, hex: known[name] || TEMPO_EXTRA_BODY_HEX[name] }));
    const custom = colors.filter(c => TEMPO_CUSTOM_BODY.includes(c.name));
    return [
        { tier: 'Standard Club Car Colors', colors: colors.filter(c => !custom.includes(c)) },
        { tier: 'Premium GC Custom Paint', colors: custom }
    ].filter(g => g.colors.length);
}

// Flat list of a product's body colors, each with a photo when one exists for that color
function getProductBodyColors(product, level) {
    const photos = product.colorPhotos || {};
    return getProductBodyGroups(product, level).flatMap(group => group.colors.map(c => ({ ...c, tier: group.tier, image: photos[c.name] || null })));
}

// Body colors, seat groups and canopies on the open model page (for Tempo models, those of the chosen build)
function detailLevelArg(product) {
    return isTempoVersion(product) ? detailLevelIndex(product) : undefined;
}

function detailBodyColors(product) {
    return getProductBodyColors(product, detailLevelArg(product));
}

function getDetailSeatGroups(product) {
    if (isTempoVersion(product)) return [{ tier: null, options: TEMPO_MATRIX.seat[detailLevelIndex(product)] }];
    const family = COLOR_FAMILIES[product.colorFamily];
    return (family && family.seatGroups) || [];
}

function getDetailCanopyOptions(product) {
    if (isTempoVersion(product)) return TEMPO_MATRIX.canopy[tempoLayoutRow(product)][detailLevelIndex(product)];
    return CANOPY_OPTIONS[product.canopyKey] || [];
}

// Accessory options from the "Versions" cart-builder sheet (STEP 4 ACCESSORIES tab).
// `fits` lists the product accessoryTags each item is compatible with, based on the item names
// (e.g. "Villager 6 Rain Enclosure"); Precedent-only items are omitted. `product` links a catalog photo.
const ACCESSORY_CATALOG = [
    { group: 'Windshield', items: [
        { id: 'ws-clear', name: 'Clear Hinged Windshield', sku: 'SJK-0066', fits: ['tempo'] },
        { id: 'ws-tinted', name: 'Tinted Hinged Windshield', sku: 'SJK-1854', fits: ['tempo'] },
        { id: 'ws-premium-clear', name: 'Premium Clear Hinged Windshield', sku: 'SJK-1042', fits: ['onward'] },
        { id: 'ws-premium-tinted', name: 'Premium Tinted Hinged Windshield', sku: 'SJK-1043', fits: ['onward'] }
    ] },
    { group: 'Lighting', items: [
        { id: 'lt-cc-tempo', name: 'CC Tempo Lights (Head Lights)', sku: 'SJK-0249', fits: ['tempo'], product: 'acc-deluxe-lights' },
        { id: 'lt-gc-tempo', name: 'GC Tempo Light Kit', sku: 'SJK-1921', fits: ['tempo'] },
        { id: 'lt-gc-tempo-full', name: 'GC Tempo Full Light Kit', sku: 'SJK-1573', fits: ['tempo'] },
        { id: 'lt-gc-tempo-rgb', name: 'GC Tempo Full Light Kit RGB', sku: 'SJK-1548', fits: ['tempo'] }
    ] },
    { group: 'Golf Accessories', items: [
        { id: 'golf-sand', name: 'Sand Bottle', sku: 'SJK-0332', fits: ['golf'], product: 'acc-divot-sand-bottle' },
        { id: 'golf-washer', name: 'Ball Washer', sku: 'SJK-0248', fits: ['golf'], product: 'acc-ball-cleaner' },
        { id: 'golf-cooler', name: 'Caddie Cooler', sku: 'SJK-0257', fits: ['golf'], product: 'acc-cooler' },
        { id: 'golf-cooler-premium', name: 'Premium Caddie Cooler', sku: 'SJK-1363', fits: ['golf'] },
        { id: 'golf-caddie', name: 'Caddie Carrier', sku: 'SJK-1374', fits: ['golf'] },
        { id: 'golf-bag-mag-black', name: 'Premium Magnetic Bag Cover (Black)', sku: 'SJK-0344', fits: ['golf'], product: 'acc-bag-cover' },
        { id: 'golf-bag-mag-beige', name: 'Premium Magnetic Bag Cover (Beige)', sku: 'SJK-0347', fits: ['golf'], product: 'acc-bag-cover' },
        { id: 'golf-bag-black', name: 'Bag Cover (Black)', sku: 'SJK-0136', fits: ['golf'], product: 'acc-bag-cover' },
        { id: 'golf-bag-beige', name: 'Bag Cover (Beige)', sku: 'SJK-1038', fits: ['golf'], product: 'acc-bag-cover' },
        { id: 'golf-bag-white', name: 'Bag Cover (White)', sku: 'SJK-1040', fits: ['golf'], product: 'acc-bag-cover' }
    ] },
    { group: 'Mirrors', items: [
        { id: 'mir-side', name: 'Side Mirrors', sku: 'SJK-1146', fits: ['tempo', 'onward', 'villager', 'utility'] },
        { id: 'mir-side-blinker', name: 'Side Mirrors with Blinkers', sku: 'SJK-1545', fits: ['tempo', 'onward', 'villager', 'utility'], product: 'acc-side-mirror' },
        { id: 'mir-5-panel', name: '5 Panel Rear Mirror', sku: 'SJK-0154', fits: ['tempo', 'onward', 'villager'], product: 'acc-5-panel-mirror' },
        { id: 'mir-convex', name: 'Convex Rear Mirror', sku: 'SJK-1461', fits: ['tempo', 'onward', 'villager', 'utility'] }
    ] },
    { group: 'Storage', items: [
        { id: 'sto-overhead', name: 'Overhead Storage Console', sku: 'SJK-0880', fits: ['tempo', 'onward'] },
        { id: 'sto-underseat', name: 'Rear Under Seat Storage Bucket', sku: 'SJK-1002', fits: ['tempo', 'onward'] },
        { id: 'sto-glovebox', name: 'Onward Locking Glove Box Kit', sku: 'SJK-0881', fits: ['onward'] }
    ] },
    { group: 'Rain Enclosures', items: [
        { id: 'enc-onward-black', name: 'Two-Sided Rain Enclosure (Black)', fits: ['onward'] },
        { id: 'enc-2-beige', name: 'Three-Sided Rain Enclosure (Beige)', sku: 'SJK-1855', fits: ['tempo-2'], product: 'acc-golf-cover' },
        { id: 'enc-2-white', name: 'Three-Sided Rain Enclosure (White)', sku: 'SJK-1856', fits: ['tempo-2'], product: 'acc-golf-cover' },
        { id: 'enc-2-black', name: 'Three-Sided Rain Enclosure (Black)', sku: 'SJK-1509', fits: ['tempo-2'], product: 'acc-golf-cover' },
        { id: 'enc-22-black', name: '2+2 Three-Sided Rain Enclosure (Black)', sku: 'SJK-0467', fits: ['tempo-2+2'] },
        { id: 'enc-22-beige', name: '2+2 Three-Sided Rain Enclosure (Beige)', fits: ['tempo-2+2'] },
        { id: 'enc-22-white', name: '2+2 Three-Sided Rain Enclosure (White)', sku: 'SJK-1905', fits: ['tempo-2+2'] },
        { id: 'enc-4-black', name: 'Tempo 4 Rain Enclosure (Black)', fits: ['tempo-4'] },
        { id: 'enc-4-beige', name: 'Tempo 4 Rain Enclosure (Beige)', fits: ['tempo-4'] },
        { id: 'enc-42-black', name: 'Tempo 4+2 Rain Enclosure (Black)', fits: ['tempo-4+2'] },
        { id: 'enc-42-beige', name: 'Tempo 4+2 Rain Enclosure (Beige)', fits: ['tempo-4+2'] },
        { id: 'enc-v6-white', name: 'Villager 6 Rain Enclosure (White)', sku: 'SJK-1814', fits: ['villager-6'] },
        { id: 'enc-v6-beige', name: 'Villager 6 Rain Enclosure (Beige)', sku: 'SJK-1815', fits: ['villager-6'] },
        { id: 'enc-v6-white-fold', name: 'Villager 6 Rain Enclosure, Fold Down (White)', fits: ['villager-6'] },
        { id: 'enc-v6-beige-fold', name: 'Villager 6 Rain Enclosure, Fold Down (Beige)', fits: ['villager-6'] },
        { id: 'enc-v8-white', name: 'Villager 8 Rain Enclosure (White)', sku: 'SJK-1816', fits: ['villager-8'] },
        { id: 'enc-v8-beige', name: 'Villager 8 Rain Enclosure (Beige)', sku: 'SJK-1817', fits: ['villager-8'] },
        { id: 'enc-v8-white-fold', name: 'Villager 8 Rain Enclosure, Fold Down (White)', fits: ['villager-8'] },
        { id: 'enc-v8-beige-fold', name: 'Villager 8 Rain Enclosure, Fold Down (Beige)', fits: ['villager-8'] },
        { id: 'enc-t4-white', name: 'Transporter 4 Long Rain Enclosure (White)', fits: ['transporter-4'] },
        { id: 'enc-t4-black', name: 'Transporter 4 Long Rain Enclosure (Black)', fits: ['transporter-4'] },
        { id: 'enc-t4-beige', name: 'Transporter 4 Long Rain Enclosure (Beige)', fits: ['transporter-4'] },
        { id: 'enc-ca-white', name: 'Carryall Rain Enclosure (White)', sku: 'SJK-1248', fits: ['carryall'] },
        { id: 'enc-ca-black', name: 'Carryall Rain Enclosure (Black)', fits: ['carryall'] },
        { id: 'enc-ca-beige', name: 'Carryall Rain Enclosure (Beige)', fits: ['carryall'] },
        { id: 'enc-mb14-black', name: 'Minibus 14 Rain Enclosure (Black)', fits: ['minibus'] },
        { id: 'enc-mb14-beige', name: 'Minibus 14 Rain Enclosure (Beige)', fits: ['minibus'] }
    ] },
    { group: 'Electronics', items: [
        { id: 'el-cc-soundbar', name: 'Club Car Premium Sound Bar', sku: 'SJK-0787', fits: ['tempo', 'onward', 'villager'], product: 'acc-premium-speaker' },
        { id: 'el-gc-soundbar', name: 'GC Sound Bar 27" RGB', sku: 'SJK-1564', fits: ['tempo', 'onward', 'villager'] },
        { id: 'el-wireless', name: 'Wireless Charging', sku: 'SJK-1510', fits: ['tempo', 'onward'] },
        { id: 'el-usb-premium', name: 'Premium USB-C Charging Port', sku: 'SJK-1178', fits: ['tempo', 'onward', 'villager', 'utility'] },
        { id: 'el-usb-gc', name: 'GC USB-C Charging Port QC3.0 with Volt Meter', fits: ['tempo', 'onward', 'villager', 'utility'] }
    ] },
    { group: 'Driver Accessories', items: [
        { id: 'drv-wheel', name: 'Premium Steering Wheel', sku: 'SJK-1355', fits: ['tempo', 'onward'] },
        { id: 'drv-wheel-scorecard', name: 'Premium Steering Wheel with Scorecard', sku: 'SJK-1354', fits: ['golf'] },
        { id: 'drv-floormat', name: 'GC Floor Mat', sku: 'SJK-1375', fits: ['tempo', 'onward', 'villager'] }
    ] },
    { group: 'Exterior', items: [
        { id: 'ext-fender-3', name: 'Tempo Fenders 3"', sku: 'SJK-1542', fits: ['tempo'] },
        { id: 'ext-fender-15', name: 'Tempo Fenders 1.5"', fits: ['tempo'] },
        { id: 'ext-fender-onward', name: 'Onward Fenders', sku: 'SJK-1885', fits: ['onward'] },
        { id: 'ext-brush-guard', name: 'Brush Guard', sku: 'SJK-0119', fits: ['tempo', 'onward', 'utility'], product: 'acc-brush-guard' }
    ] },
    { group: 'Lifted Accessories', items: [
        { id: 'lift-4', name: '4" Lift Kit', sku: 'SJK-0330', fits: ['tempo'] },
        { id: 'lift-nerf', name: 'Nerf Bar', sku: 'SJK-0377', fits: ['lifted'] }
    ] }
];

let quoteAccessories = new Set();

function findAccessory(id) {
    for (const group of ACCESSORY_CATALOG) {
        const item = group.items.find(i => i.id === id);
        if (item) return item;
    }
    return null;
}

// Accessory groups that fit a model, looked up by the product name shown in the quote form
function getCompatibleAccessoryGroups(productName) {
    const product = findProductRef(productName);
    const tags = (product && product.accessoryTags) || [];
    return ACCESSORY_CATALOG
        .map(g => ({ group: g.group, items: g.items.filter(i => i.fits.some(t => tags.includes(t))) }))
        .filter(g => g.items.length);
}

function renderAccessoryPicker() {
    const picker = document.getElementById('modal-accessory-picker');
    const select = document.getElementById('modal-product-select');
    if (!picker || !select) return;
    const groups = getCompatibleAccessoryGroups(select.value);

    picker.innerHTML = groups.length ? groups.map(g => `
        <fieldset class="space-y-2">
            <legend class="text-sm text-ink-2 mb-2">${g.group}</legend>
            ${g.items.map(item => {
                const photo = item.product && (PRODUCTS_DATA.find(p => p.slug === item.product) || {}).image;
                return `
                    <label class="flex items-center gap-3 p-2.5 bg-paper border border-line hover:border-ink-2 cursor-pointer">
                        <input type="checkbox" ${quoteAccessories.has(item.id) ? 'checked' : ''} onchange="toggleQuoteAccessory('${item.id}')" class="w-4 h-4 accent-[#151714] flex-shrink-0">
                        <span class="w-10 h-10 bg-stone flex items-center justify-center overflow-hidden flex-shrink-0">
                            ${photo ? `<img src="${photo}" alt="" loading="lazy" class="max-w-full max-h-full object-contain">` : ''}
                        </span>
                        <span class="flex-1 min-w-0 text-sm">
                            <span class="block text-ink">${item.name}</span>
                            ${item.sku ? `<span class="block text-xs text-mute">${item.sku}</span>` : ''}
                        </span>
                    </label>`;
            }).join('')}
        </fieldset>
    `).join('') + '<p class="text-sm text-ink-2">We confirm fitment before quoting.</p>'
        : '<p class="text-sm text-ink-2">No accessories are listed for this model yet. Tell us what you need in the notes.</p>';
}

function renderAccessoryChips() {
    const chips = document.getElementById('modal-accessory-chips');
    const toggle = document.getElementById('accessory-toggle');
    if (chips) {
        chips.innerHTML = [...quoteAccessories].map(id => {
            const item = findAccessory(id);
            return item ? `
                <span class="inline-flex items-center gap-1 pl-3 pr-1 py-1 bg-paper border border-ink text-sm text-ink rounded-[2px]">
                    ${item.name}
                    <button type="button" onclick="toggleQuoteAccessory('${id}')" aria-label="Remove ${item.name}" class="w-6 h-6 leading-none hover:bg-stone">&times;</button>
                </span>` : '';
        }).join('');
    }
    if (toggle) toggle.textContent = quoteAccessories.size ? `${quoteAccessories.size} selected` : '';
}

function toggleQuoteAccessory(id) {
    if (quoteAccessories.has(id)) quoteAccessories.delete(id);
    else quoteAccessories.add(id);
    renderAccessoryChips();
    renderQuoteSummary();
    const picker = document.getElementById('modal-accessory-picker');
    if (picker && !picker.classList.contains('hidden')) renderAccessoryPicker();
}

function toggleAccessoryPicker(forceOpen = null) {
    const picker = document.getElementById('modal-accessory-picker');
    if (!picker) return;
    const open = forceOpen === null ? picker.classList.contains('hidden') : forceOpen;
    picker.classList.toggle('hidden', !open);
    if (open) renderAccessoryPicker();
}

// Drops selections that don't fit the newly selected model
function onQuoteModelChange() {
    const select = document.getElementById('modal-product-select');
    const fitting = new Set(getCompatibleAccessoryGroups(select ? select.value : '').flatMap(g => g.items.map(i => i.id)));
    quoteAccessories = new Set([...quoteAccessories].filter(id => fitting.has(id)));
    renderAccessoryChips();
    renderQuoteSummary();
    const picker = document.getElementById('modal-accessory-picker');
    if (picker && !picker.classList.contains('hidden')) renderAccessoryPicker();
}

function openQuoteWithAccessories(productName, notes = '') {
    openQuoteModal(productName, notes);
    toggleAccessoryPicker(true);
}

// Vehicle page: opens the quote with the accessory list, carrying over the selected colors
function addAccessoriesFromDetail() {
    const product = PRODUCTS_DATA.find(p => p.slug === currentSlug);
    if (product) openQuoteWithAccessories(product.slug);
}

// Swatch colors for every seat option, measured from the seat photos in image/Seats (the vinyl's main
// mid-tone, ignoring the cart frame and studio background). Two- and three-tone seats use a split swatch;
// the FIRST color is the seat's signature color, because the live preview repaints the seat with it.
const TRIM_COLOR_HEX = {
    // Standard Club Car seats (also used by Carryall seats)
    'White': '#ECEBE7', 'Beige': '#B99E85', 'Black': '#2B2A2C', 'Grey': '#AEAFAE', 'Gray': '#AEAFAE',
    // Modern Premium seats
    'Modern Premium Light Beige': '#D2BFAF', 'Premium Camello': '#B9845F', 'Modern Premium Black': '#2D2E2E',
    'Premium Black and Grey': 'linear-gradient(135deg, #2D2E2E 50%, #9A9693 50%)',
    'Modern Premium Grey': '#ABABAB',
    // Elite and Classic Premium seats
    'Elite Bright White': '#E4E5E8', // the seat is white all over; the black in the photo is the cart base
    'Premium Light Beige': '#D0BEA8', 'Premium Off White': '#E6E2DA', 'Premium Black': '#2E2D2D', 'Premium Grey': '#C1C1C1',
    'Premium Camello & Light Beige': 'linear-gradient(135deg, #AA7E5A 50%, #D7BBA2 50%)',
    'Premium Camello & Off White': 'linear-gradient(135deg, #AC7D58 50%, #E3DAD0 50%)',
    'Premium Light Beige & Off White': 'linear-gradient(135deg, #D0BEA8 50%, #E6E2DA 50%)',
    'Premium Camello (Special Promo)': '#AD8E6F',
    'Premium Black and Grey (Special Promo)': 'linear-gradient(135deg, #2A2A2A 50%, #8C8C8C 50%)',
    // High-back seats
    'High-Back Sport Black Carbon Fiber with Silver Inlay': 'linear-gradient(135deg, #2A2928 60%, #C1BFBC 60%)',
    'High-Back Luxury Honey Beige with Black Inlay': 'linear-gradient(135deg, #CF955A 60%, #1C1B1D 60%)',
    // Briar Brown is one colour all over (no inlay); the dark red in its photo is the cart body, not the seat
    'High-Back Luxury Briar Brown': '#7D6152',
    // Premium GC seats. Tsunami: mostly black, a coloured side panel and a silver stripe (see the seat photos).
    // Bands are roughly in the photo's proportions, colour panel first so the preview shows the option's colour.
    'Tsunami Silver Red & Black': 'linear-gradient(135deg, #B83F33 40%, #36352F 40% 82%, #B5B3AC 82%)',
    'Tsunami Silver Grey & Black': 'linear-gradient(135deg, #5B5955 40%, #2B2A27 40% 82%, #BDB9B0 82%)',
    'Tsunami Silver Blue & Black': 'linear-gradient(135deg, #3A3D72 40%, #363533 40% 82%, #B8B4AC 82%)',
    // GC arm-rest seats. The sheet's "GC Beige" photo is a caramel tan, so its swatch follows the photo.
    'GC White with Arm Rest': '#E8E9EC', 'GC Beige with Arm Rest': '#D9976C', 'GC Dark Brown with Arm Rest': '#765850',
    'Coffee Brown Ventilated Premium Seats': '#5A3A28', // no photo yet; approximate
    'GC Black Premium Seat': '#232324' // no photo yet; approximate
};

// Canopy swatches are kept separate from seats: a beige canopy is a lighter, greyer beige than a beige seat.
// Measured from the canopies in the cart photos. CC = Club Car canopy, CN = non-Club Car canopy.
const CANOPY_COLOR_HEX = {
    'White': '#E8E8E5', 'Beige': '#C8BBA2', 'Black': '#2E302F',
    'White CC': '#E8E8E5', 'Beige CC': '#C8BBA2', 'Black CC': '#2E302F', 'Black CN': '#333436',
    'White Long Canopy': '#E8E8E5', 'Beige Long Canopy': '#C8BBA2', 'Black Long Canopy': '#2E302F',
    // The Versions document's 80" GC canopy is the black non-Club Car canopy ("Black CN" in the earlier sheet)
    '80" GC Canopy': '#333436'
};

// Striped and two-tone seats: the live preview paints these as vertical bands across the seat instead of
// one colour (on photos with a single bench seat).
// Read left to right off the Tsunami seat photos: black bolster, colour panel, silver stripe, black centre,
// then the same mirrored. `to` is where each band ends, as a fraction of the seat's width.
function tsunamiBands(panel, silver, black) {
    return [
        { hex: black, to: 0.12 }, { hex: panel, to: 0.3 }, { hex: silver, to: 0.38 }, { hex: black, to: 0.62 },
        { hex: silver, to: 0.7 }, { hex: panel, to: 0.88 }, { hex: black, to: 1 }
    ];
}
// Two-tone premium seats (see the seat photos): each half of the bench has a centre panel in one colour,
// framed by outer bolsters in the other.
function twoToneBands(outer, center) {
    return [
        { hex: outer, to: 0.1 }, { hex: center, to: 0.42 }, { hex: outer, to: 0.58 },
        { hex: center, to: 0.9 }, { hex: outer, to: 1 }
    ];
}
const SEAT_PATTERNS = {
    'Tsunami Silver Red & Black': tsunamiBands('#B83F33', '#B5B3AC', '#36352F'),
    'Tsunami Silver Grey & Black': tsunamiBands('#5B5955', '#BDB9B0', '#2B2A27'),
    'Tsunami Silver Blue & Black': tsunamiBands('#3A3D72', '#B8B4AC', '#363533'),
    'Premium Black and Grey': twoToneBands('#2D2E2E', '#9A9693'),
    'Premium Black and Grey (Special Promo)': twoToneBands('#2A2A2A', '#8C8C8C'),
    'Premium Camello & Light Beige': twoToneBands('#AA7E5A', '#D7BBA2'),
    'Premium Camello & Off White': twoToneBands('#AC7D58', '#E3DAD0'),
    'Premium Light Beige & Off White': twoToneBands('#D0BEA8', '#E6E2DA'), // no photo; same layout assumed
    'High-Back Sport Black Carbon Fiber with Silver Inlay': twoToneBands('#2A2928', '#C1BFBC'),
    'High-Back Luxury Honey Beige with Black Inlay': twoToneBands('#CF955A', '#1C1B1D')
};

// Swatch value for a seat or canopy option. Seat names from the Versions document use the swatch of the
// matching seat (SEAT_ALIASES); a Tempo canopy takes the color named in it ("2 Pass Canopy Beige").
function getTrimHex(type, option) {
    if (!option) return null;
    if (type !== 'canopy') return TRIM_COLOR_HEX[SEAT_ALIASES[option] || option] || null;
    if (CANOPY_COLOR_HEX[option]) return CANOPY_COLOR_HEX[option];
    const word = (option.match(/\b(White|Beige|Black)\b/) || [])[1];
    return word ? CANOPY_COLOR_HEX[word] : null;
}

function getSeatPattern(option) {
    return option ? SEAT_PATTERNS[SEAT_ALIASES[option] || option] || null : null;
}

// Current color choices on the vehicle page; reset each time a vehicle page renders
let detailBuild = { body: null, seat: null, canopy: null };

// Refreshes the "your build" pills shown on top of the color preview
function updateDetailBuildSummary() {
    const summary = document.getElementById('detail-build-summary');
    if (!summary) return;
    const product = PRODUCTS_DATA.find(p => p.slug === currentSlug);
    const bodyHex = product && detailBuild.body
        ? (getProductBodyColors(product).find(c => c.name === detailBuild.body) || {}).hex
        : null;
    const pill = (label, value, hex) => value ? `
        <span class="build-chip"><span class="detail-trim-dot" style="background:${hex}"></span><span class="text-ink-2">${label}</span> <span class="text-ink font-medium">${value}</span></span>` : '';
    summary.innerHTML = pill('Body', detailBuild.body, bodyHex)
        + pill('Seat', detailBuild.seat, getTrimHex('seat', detailBuild.seat))
        + pill('Canopy', detailBuild.canopy, getTrimHex('canopy', detailBuild.canopy));
    updateDetailPreview();
    updateBuildPanel();
}

function hasLiveColorPreview(slug) {
    return typeof COLOR_PREVIEW !== 'undefined' && !!COLOR_PREVIEW[slug];
}

let detailPreviewToken = 0;
// Browsers block reading image pixels on pages opened as local files (file://), so the repaint only works
// when the site is served from a web address (GitHub Pages or a local server).
let livePreviewAvailable = location.protocol !== 'file:';

// Repaints the color preview photo for the current body / seat / canopy choices (see recolor.js)
// The preview photo for the open model: on Golfer 2 / 2+2, the photo of the chosen build
function detailPreviewKey(product) {
    const key = `${product.slug}:${detailBuild.level}`;
    return hasLiveColorPreview(key) ? key : product.slug;
}

function updateDetailPreview() {
    const product = PRODUCTS_DATA.find(p => p.slug === currentSlug);
    if (!product || !livePreviewAvailable) return;
    const key = detailPreviewKey(product);
    if (!hasLiveColorPreview(key)) return;
    const body = getProductBodyColors(product).find(c => c.name === detailBuild.body);
    // On a build photo, parts still in the photo's own colors stay exactly as photographed
    const look = (key !== product.slug && product.buildLooks && product.buildLooks[detailBuild.level]) || {};
    const keep = part => key !== product.slug && (!detailBuild[part] || detailBuild[part] === look[part]);
    const token = ++detailPreviewToken;
    renderCartPreview(key, {
        body: keep('body') ? null : (body ? body.hex : null),
        seat: keep('seat') ? null : getTrimHex('seat', detailBuild.seat),
        seatBands: keep('seat') ? null : getSeatPattern(detailBuild.seat),
        canopy: keep('canopy') ? null : getTrimHex('canopy', detailBuild.canopy)
    }).then(url => {
        // Ignore results from an older click that finished after a newer one
        if (!url || token !== detailPreviewToken) return;
        const img = document.getElementById('detail-color-img');
        if (img) img.src = url;
        const note = document.getElementById('detail-color-photo-note');
        if (note) {
            note.textContent = 'Color preview · final finish may vary';
            note.classList.remove('hidden');
        }
    }).catch(err => {
        // Preview can't be drawn here: stop trying and fall back to real color photos
        livePreviewAvailable = false;
        console.warn('Color preview unavailable; open the site from a web address to enable it.', err);
        const body = getProductBodyColors(product).find(c => c.name === detailBuild.body);
        const img = document.getElementById('detail-color-img');
        if (img) img.src = (body && body.image) || product.image;
    });
}

// Seat / canopy color buttons: same active-state behaviour as the body swatches
function selectDetailTrim(type, value, fromVisitor) {
    if (fromVisitor) detailBuild.colorsPicked = true;
    detailBuild[type] = value;
    document.querySelectorAll(`.detail-trim[data-type="${type}"]`).forEach(btn => {
        const active = btn.dataset.value === value;
        btn.classList.toggle('detail-trim-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    const label = document.getElementById(`detail-${type}-name`);
    if (label) label.textContent = value;
    if (type === 'seat') updateSeatPhoto(value);
    updateDetailBuildSummary();
}

// Shows the real photo(s) of the chosen seat under the seat picker; hidden when the seat has no photo
function updateSeatPhoto(value) {
    const panel = document.getElementById('detail-seat-photo');
    if (!panel) return;
    const product = PRODUCTS_DATA.find(p => p.slug === currentSlug);
    const family = product && COLOR_FAMILIES[product.colorFamily];
    const photos = getSeatPhotos(family && family.seatGroups, value);
    panel.classList.toggle('hidden', !photos.length);
    if (!photos.length) return;
    const labels = photos.length > 1 ? ['Front seat', 'Rear seat'] : [''];
    panel.querySelector('.seat-photo-grid').innerHTML = photos.map((src, i) => `
        <figure class="seat-photo">
            <img src="${src}" alt="${value}${labels[i] ? ' ' + labels[i].toLowerCase() : ''}" loading="lazy">
            ${labels[i] ? `<figcaption>${labels[i]}</figcaption>` : ''}
        </figure>
    `).join('');
    panel.querySelector('.seat-photo-name').textContent = value;
}

let detailTabObserver = null;

function isMeaningful(value) {
    return value && value !== 'N/A';
}

// Groups the flat product fields into BYD-style specification tables
function getDetailSpecGroups(product) {
    // Accessories reuse vehicle field names for unrelated data, so only their own spec table applies
    if (product.category === 'Accessories') {
        return [{ title: 'Specifications', rows: Object.entries(product.specs || {}) }];
    }
    const groups = [
        { title: 'Performance', rows: [['Range', product.range], ['Top Speed', product.speed], ['Powertrain', product.powertrain]] },
        { title: 'Battery & Charging', rows: [['Battery', product.battery], ['Charging Time', product.chargingTime]] },
        { title: 'Capacity', rows: [['Seating', product.seating]] },
        { title: 'Technical', rows: Object.entries(product.specs || {}) }
    ];
    return groups
        .map(g => ({ ...g, rows: g.rows.filter(([, v]) => isMeaningful(v)) }))
        .filter(g => g.rows.length);
}

function selectDetailColor(index, fromVisitor) {
    if (fromVisitor) detailBuild.colorsPicked = true;
    const product = PRODUCTS_DATA.find(p => p.slug === currentSlug);
    if (!product) return;
    const color = detailBodyColors(product)[index];
    if (!color) return;

    document.querySelectorAll('.detail-swatch').forEach((el, i) => {
        el.classList.toggle('detail-swatch-active', i === index);
        el.setAttribute('aria-checked', String(i === index));
    });
    const label = document.getElementById('detail-color-name');
    if (label) label.textContent = color.name;
    const quoteBtn = document.getElementById('detail-color-quote');
    if (quoteBtn) quoteBtn.dataset.color = color.name;
    // Show the real photo for this color when we have one. Carts with a live preview are then repainted by
    // updateDetailPreview(); if that can't run (e.g. the page was opened from a local file), this photo stays.
    if (!hasLiveColorPreview(detailPreviewKey(product)) || !livePreviewAvailable) {
        const img = document.getElementById('detail-color-img');
        if (img) img.src = color.image || product.image;
        const note = document.getElementById('detail-color-photo-note');
        if (note) {
            note.textContent = 'Photo shows a standard finish';
            note.classList.toggle('hidden', !!color.image);
        }
    }
    detailBuild.body = color.name;
    updateDetailBuildSummary();
}

function requestQuoteInColor() {
    const product = PRODUCTS_DATA.find(p => p.slug === currentSlug);
    if (product) openQuoteModal(product.slug);
}

function scrollToDetailSection(id) {
    const target = document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
}

// Highlights the sticky tab for the section currently in view
function initDetailTabs() {
    if (detailTabObserver) detailTabObserver.disconnect();
    const sections = document.querySelectorAll('.detail-section');
    if (!sections.length || !('IntersectionObserver' in window)) return;

    detailTabObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            document.querySelectorAll('.detail-tab').forEach(tab => {
                tab.classList.toggle('detail-tab-active', tab.dataset.target === entry.target.id);
            });
        });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(section => detailTabObserver.observe(section));
}

// --- BUILD SELECTOR: choose the build level, then its colors, equipment and upgrades ---

function currentDetailProduct() {
    return PRODUCTS_DATA.find(p => p.slug === currentSlug) || null;
}

// A Tempo option group's choice as text, with its sub-choices in brackets; null when nothing is chosen
function describeTempoChoice(product, i, group, o) {
    const v = o[group.id];
    let text = null;
    if (group.type === 'fixed') text = group.value;
    else if (group.type === 'single' || group.type === 'optional') text = v || null;
    else if (group.type === 'multi') text = v && v.length ? v.join(', ') : null;
    else if (group.type === 'qty') text = v ? String(v) : null;
    else if (group.type === 'side') text = v === 'both' ? 'Both sides' : v ? `${v[0].toUpperCase()}${v.slice(1)} side` : null;
    else if (group.type === 'flag') text = v ? group.label : null;
    if (!text) return null;
    const extra = getTempoSubGroups(product, i, o).filter(s => s.parent === group.id).map(s => {
        const sv = o[s.id];
        return Array.isArray(sv) ? (sv.length ? sv.join(', ') : null) : sv || null;
    }).filter(Boolean);
    return extra.length ? `${text} (${extra.join('; ')})` : text;
}

// Every Tempo equipment choice as quote rows ("Ball washer: 2", "Lift kit: Lifted 3.5" GC lift kit (...)")
function getTempoOptionRows(product) {
    const i = detailLevelIndex(product);
    const o = detailBuild.options || {};
    return getTempoOptionGroups(product, i)
        .map(g => [g.title, describeTempoChoice(product, i, g, o)])
        .filter(([, v]) => v);
}

// "Tempo 2 Scratch + Lifted 3.5" GC lift kit + 2 × Ball washer": the build and what's added to it
function getBuildSummaryText() {
    const product = currentDetailProduct();
    const buildSet = product && getProductBuildSet(product);
    if (!buildSet) return '';
    const level = buildSet.builds.find(b => b.id === detailBuild.level) || buildSet.builds[0];
    const parts = [buildTitle(product, level)];
    if (isTempoVersion(product)) {
        const i = detailLevelIndex(product);
        const o = detailBuild.options || {};
        getTempoOptionGroups(product, i).forEach(g => {
            const v = o[g.id];
            if (g.type === 'single' && g.upgradeFrom && g.options.indexOf(v) >= g.upgradeFrom) parts.push(v);
            if (g.type === 'optional' && v) parts.push(v);
            if (g.type === 'multi') parts.push(...(v || []));
            if (g.type === 'qty' && v) parts.push(`${v} × ${g.title}`);
            if (g.type === 'side' && v) parts.push(`${g.title} (${v === 'both' ? 'both sides' : v})`);
            if (g.type === 'flag' && v) parts.push(g.label);
        });
    }
    const more = parts.length - 4;
    return (more > 1 ? [...parts.slice(0, 4), `${more} more`] : parts).join(' + ');
}

function updateBuildSummaryLine() {
    const line = document.getElementById('build-summary-line');
    if (line) line.textContent = getBuildSummaryText();
    updateBuildPanel();
}

// The "Your build" side panel beside Equipment and upgrades (Tempo builds): the build, its colors and every
// choice made so far, with the quote button always in reach
function renderBuildPanel(product) {
    const buildSet = getProductBuildSet(product);
    const level = buildSet.builds.find(b => b.id === detailBuild.level) || buildSet.builds[0];
    const i = detailLevelIndex(product);
    const o = detailBuild.options || {};
    const bodyHex = (getProductBodyColors(product).find(c => c.name === detailBuild.body) || {}).hex;
    const colors = [
        ['Body', detailBuild.body, bodyHex],
        ['Seat', detailBuild.seat || 'Standard', getTrimHex('seat', detailBuild.seat)],
        ['Canopy', detailBuild.canopy || 'Standard', getTrimHex('canopy', detailBuild.canopy)]
    ].filter(([, v]) => v);
    const choices = getTempoOptionGroups(product, i)
        .filter(g => g.type !== 'fixed')
        .map(g => [g.title, describeTempoChoice(product, i, g, o)])
        .filter(([, v]) => v);
    const row = (label, value, hex) => `
        <div class="build-panel-row">
            <dt>${label}</dt>
            <dd>${hex ? `<span class="detail-trim-dot" style="background:${hex}"></span>` : ''}<span>${value}</span></dd>
        </div>`;
    return `
        <div class="build-panel-head">
            <p class="text-sm text-on-band-mute">Your build</p>
            <p class="type-md mt-1">${buildTitle(product, level)}</p>
        </div>
        <div class="build-panel-scroll">
            <dl class="build-panel-list">
                ${colors.map(([l, v, h]) => row(l, v, h)).join('')}
            </dl>
            <dl class="build-panel-list">
                ${choices.map(([l, v]) => row(l, v)).join('')}
            </dl>
            <p class="build-panel-links">
                <button type="button" onclick="scrollToDetailSection('build')" class="build-panel-link">Change build</button>
                <button type="button" onclick="scrollToDetailSection('colors')" class="build-panel-link">Change colors</button>
            </p>
        </div>
        <div class="build-panel-foot">
            <button type="button" onclick="requestQuoteInColor()" class="btn btn-primary w-full">Get a quote for this build</button>
            <p class="text-xs text-on-band-mute mt-2">We confirm inclusions, pricing and availability in the quote.</p>
        </div>`;
}

function updateBuildPanel() {
    const panel = document.getElementById('detail-build-panel');
    const product = currentDetailProduct();
    if (panel && product && isTempoVersion(product)) panel.innerHTML = renderBuildPanel(product);
}

// Choices for a new build level: keeps each earlier choice the new level still offers
function carryTempoOptions(product, i, prev) {
    const next = defaultTempoOptions(product, i);
    getTempoOptionGroups(product, i).forEach(g => {
        const v = prev[g.id];
        if (v === undefined) return;
        if (g.type === 'single' && g.options.includes(v)) next[g.id] = v;
        if (g.type === 'optional' && (v === '' || g.options.includes(v))) next[g.id] = v;
        if (g.type === 'multi') next[g.id] = v.filter(x => g.options.includes(x));
        if (g.type === 'qty' || g.type === 'flag' || g.type === 'side') next[g.id] = v;
    });
    if (prev.liftFender) next.liftFender = prev.liftFender;
    if (prev.liftAddOns) next.liftAddOns = prev.liftAddOns.slice();
    fixTempoSubChoices(product, i, next);
    return next;
}

// Keeps sub-choices valid: a flip seat always has one of its colors, cooling needs an enclosure
function fixTempoSubChoices(product, i, o) {
    const flipColor = getTempoSubGroups(product, i, o).find(s => s.id === 'flipSeatColor');
    o.flipSeatColor = flipColor ? (flipColor.options.includes(o.flipSeatColor) ? o.flipSeatColor : flipColor.options[0]) : '';
    if (!o.enclosure) o.cooling = false;
}

function selectBuildLevel(id) {
    detailBuild.level = id;
    document.querySelectorAll('.build-card').forEach(card => {
        const active = card.dataset.build === id;
        card.classList.toggle('build-card-active', active);
        card.setAttribute('aria-checked', active ? 'true' : 'false');
    });
    const product = currentDetailProduct();
    if (product && isTempoVersion(product)) {
        // Keep the colors the new build offers; otherwise fall back to its first body color / the standard trim
        const i = detailLevelIndex(product);
        if (!TEMPO_MATRIX.seat[i].includes(detailBuild.seat)) detailBuild.seat = null;
        if (!getDetailCanopyOptions(product).includes(detailBuild.canopy)) detailBuild.canopy = null;
        applyBuildLook(product);
        const bodies = detailBodyColors(product);
        const bodyIdx = Math.max(0, bodies.findIndex(c => c.name === detailBuild.body));
        detailBuild.options = carryTempoOptions(product, i, detailBuild.options || {});
        const pickers = document.getElementById('detail-color-pickers');
        if (pickers) pickers.innerHTML = renderDetailColorPickers(product);
        if (detailBuild.seat) updateSeatPhoto(detailBuild.seat);
        selectDetailColor(bodyIdx);
        refreshTempoOptions();
    }
    updateBuildSummaryLine();
}

// The colors of the current build's photo, so the color preview starts out looking like that build. Once the
// visitor picks a color themselves, their choices stay.
function applyBuildLook(product) {
    const look = product.buildLooks && product.buildLooks[detailBuild.level];
    if (!look || detailBuild.colorsPicked) return;
    const i = detailLevelIndex(product);
    if (look.body && TEMPO_MATRIX.body[i].includes(look.body)) detailBuild.body = look.body;
    if (look.seat && TEMPO_MATRIX.seat[i].includes(look.seat)) detailBuild.seat = look.seat;
    if (look.canopy && getDetailCanopyOptions(product).includes(look.canopy)) detailBuild.canopy = look.canopy;
}

// --- Equipment and upgrades (Tempo builds) ---

function findTempoGroup(product, i, id) {
    const o = detailBuild.options;
    return [...getTempoOptionGroups(product, i), ...getTempoSubGroups(product, i, o)].find(g => g.id === id) || null;
}

// Pick-one groups; index -1 clears an optional group
function pickTempoOption(id, index) {
    const product = currentDetailProduct();
    const i = detailLevelIndex(product);
    const group = findTempoGroup(product, i, id);
    if (!group) return;
    detailBuild.options[id] = index < 0 ? '' : group.options[index];
    fixTempoSubChoices(product, i, detailBuild.options);
    refreshTempoOptions();
}

// Multi-choice groups (by option index) and on / off groups (no index)
function toggleTempoOption(id, index) {
    const product = currentDetailProduct();
    const i = detailLevelIndex(product);
    const group = findTempoGroup(product, i, id);
    if (!group) return;
    const o = detailBuild.options;
    if (group.type === 'flag') {
        if (group.requires && !o[group.requires]) return;
        o[id] = !o[id];
    } else {
        const value = group.options[index];
        o[id] = o[id].includes(value) ? o[id].filter(x => x !== value) : [...o[id], value];
    }
    fixTempoSubChoices(product, i, o);
    refreshTempoOptions();
}

function setTempoQty(id, n) {
    detailBuild.options[id] = n;
    refreshTempoOptions();
}

// Ball washer / cooler mount: a side the other accessory already uses can't be picked
function setTempoSide(id, value) {
    const product = currentDetailProduct();
    const group = findTempoGroup(product, detailLevelIndex(product), id);
    if (!group || tempoSideTaken(group, value, detailBuild.options)) return;
    detailBuild.options[id] = value;
    refreshTempoOptions();
}

// Redraws the equipment list (keeping keyboard focus on the button that was pressed) and the summary
function refreshTempoOptions() {
    const box = document.getElementById('detail-options');
    const product = currentDetailProduct();
    if (box && product && isTempoVersion(product)) {
        const focused = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.optKey : null;
        box.innerHTML = renderTempoOptions(product);
        if (focused) {
            const again = box.querySelector(`[data-opt-key="${focused}"]`);
            if (again) again.focus();
        }
    }
    updateBuildSummaryLine();
}

// Photos for the equipment cards (image/Options), from the sales team's Drive library ("Step 3 Power,
// Drivetrain & Suspension" and "Step 4 Accessories"). scripts/import-option-photos.mjs copies them in from a
// downloaded copy of those folders. Options without a photo here show a plain tile.
const OPTION_PHOTOS = {
    // Battery
    'Trojan FLA 8V lead-acid': 'battery-trojan-8v',
    'Battlite lithium': 'battery-battlite',
    // Lighting
    'GC Apex Tempo LED Headlights & Tail Lights': 'light-gc-apex',
    'Club Car Tempo Deluxe Light Kit': 'light-cc-deluxe',
    // Wheels and tires
    '12" Triton Machined Black, 215/35-12 tires': 'wheel-12-triton-215',
    '12" Hela Bright Chrome, 215/35-12 tires': 'wheel-12-hela-215',
    '10" 5-spoke alloy wheels, gunmetal': 'wheel-10-5spoke-gunmetal',
    '14" Gridlock Machined Black, 225/30-14 tires': 'wheel-14-gridlock-machined-225',
    '14" Gridlock Gloss Black, 225/30-14 tires': 'wheel-14-gridlock-gloss-225',
    '14" Talon, 225/30-14 tires': 'wheel-14-talon-225',
    '12" Triton Machined Black, 23x10.5-12 tires': 'wheel-12-triton-23105',
    '14" Aerion Gloss Black, 225/30-14 tires': 'wheel-14-aerion-gloss-225',
    '14" Aerion Gloss Black, Kraken 23x10-14 tires': 'wheel-14-aerion-gloss-kraken',
    '14" Aerion Black Chrome, Kraken 23x10-14 tires': 'wheel-14-aerion-chrome-kraken',
    '14" Athena Solid Gloss Black, Kraken 23x10-14 tires': 'wheel-14-athena-gloss-kraken',
    '14" Atlas Gunmetal, Kraken 23x10-14 tires': 'wheel-14-atlas-gunmetal-kraken',
    '14" Zeus Gloss Black and Machined, Kraken 23x10-14 tires': 'wheel-14-zeus-kraken',
    '14" Mercury, Kraken 23x10-14 tires': 'wheel-14-mercury-kraken',
    '12" Hela Bright Chrome, 23x10.5-12 tires': 'wheel-12-hela-23105',
    // Golf accessories
    'GC Bag Cover, Black': 'bag-cover-black',
    'Bag Cover, Beige': 'bag-cover-beige',
    'Bag Cover, White': 'bag-cover-white',
    'Club Car Magnetic Bag Cover, Black': 'bag-cover-magnetic-black',
    'Club Car Magnetic Bag Cover, Beige': 'bag-cover-magnetic-beige',
    sandBottle: 'sand-bottle',
    ballWasher: 'ball-washer',
    cooler: 'caddy-cooler',
    caddyStand: 'caddy-stand',
    // Lift
    lift: 'lift-gc-35',
    'Tempo Fenders 3"': 'fender-tempo-3',
    'Tempo Fenders 1.5"': 'fender-tempo-15',
    'GC Brush Guard': 'brush-guard',
    'Nerf Bar': 'nerf-bar',
    // Rear flip seats
    'Genesis Rear Flip Seat': 'flip-genesis',
    'Onward Premium Flip Seat': 'flip-onward',
    // Audio and charging
    'Club Car Premium Sound Bar': 'audio-cc-soundbar',
    'GC Sound Bar 27" RGB': 'audio-gc-soundbar-27',
    'Wireless Charging': 'charge-wireless',
    'GC USB-C Charging Port QC3.0 with Volt Meter': 'charge-usb-c-voltmeter',
    steering: 'steering-premium',
    // Mirrors and storage
    'Side Mirrors': 'mirror-side',
    'Side Mirrors with Turn Signal': 'mirror-side-signal',
    '5 Panel Mirror': 'mirror-5-panel',
    'Convex Inner Mirror (short)': 'mirror-convex-short',
    'Convex Inner Mirror (long)': 'mirror-convex-long',
    'Overhead Storage Console': 'storage-overhead',
    'Under Seat Storage Tray': 'storage-under-seat',
    // Rain enclosures
    'Three-sided rain enclosure, Beige': 'enclosure-3-beige',
    'Three-sided rain enclosure, White': 'enclosure-3-white',
    'Three-sided rain enclosure, Black': 'enclosure-3-black',
    'Two-sided rain enclosure, Black (Club Car)': 'enclosure-2-black'
};

// A photo for an option (by option name, or by the group's id for single-item groups such as the ball washer)
function optionPhoto(key) {
    const file = OPTION_PHOTOS[key];
    return file ? `image/Options/${file}.jpg` : null;
}

// "12" Triton Machined Black, 215/35-12 tires" -> name and detail lines for a card
function splitOptionName(text) {
    const at = text.indexOf(', ');
    return at > 0 ? [text.slice(0, at), text.slice(at + 2)] : [text, ''];
}

// The picture area of a card: the photo, or a plain tile with a picture glyph when there's none (a dash for
// "None"); the photo covers the glyph, which shows again if the photo fails to load
const OPTION_PLACEHOLDER = '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.25"><rect x="3.5" y="5" width="17" height="14" rx="1"/><circle cx="9" cy="10" r="1.75"/><path d="M4 17.5l5-4.5 3.5 3 3-2.5 4.5 4"/></svg>';

function optionMedia(photo, label) {
    return `
        <span class="opt-card-media">
            ${photo ? `<img src="${photo}" alt="" loading="lazy" decoding="async" onerror="this.nextElementSibling.hidden=false;this.remove()">` : ''}
            <span class="opt-card-initials" aria-hidden="true" ${photo ? 'hidden' : ''}>${label === 'None' ? '&mdash;' : OPTION_PLACEHOLDER}</span>
        </span>`;
}

// One selectable card. `extra` holds attributes such as disabled.
function optionCard({ key, label, photo, active, onclick, kind, note = '', extra = '' }) {
    const [name, detail] = splitOptionName(label);
    return `
        <button type="button" onclick="${onclick}" data-opt-key="${key}" aria-pressed="${active}" class="opt-card ${active ? 'opt-card-active' : ''}" ${extra}>
            ${optionMedia(photo, name)}
            <span class="opt-card-check ${kind === 'check' ? 'opt-card-check-check' : 'opt-card-check-radio'}" aria-hidden="true"></span>
            <span class="opt-card-body">
                <span class="opt-card-name">${name}</span>
                ${detail ? `<span class="opt-card-detail">${detail}</span>` : ''}
                ${note ? `<span class="opt-card-note">${note}</span>` : ''}
            </span>
        </button>`;
}

// A small segmented control (None / 1 / 2, or None / Both / Left / Right) under a single-item card
function optionSegments(items) {
    return `<span class="opt-seg" role="group">${items.map(it => `
        <button type="button" onclick="${it.onclick}" data-opt-key="${it.key}" aria-pressed="${it.active}" class="opt-seg-btn ${it.active ? 'opt-seg-active' : ''}" ${it.disabled ? 'disabled' : ''}>${it.label}</button>`).join('')}
    </span>`;
}

// What the visitor can do in a group, shown under its title
function optionGroupHint(g) {
    if (g.type === 'single') return 'Choose one';
    if (g.type === 'optional') return 'Optional, choose one';
    if (g.type === 'multi') return 'Optional, add any';
    if (g.type === 'qty') return 'None, one or two';
    if (g.type === 'side') return 'Mounts on the left, right or both sides';
    if (g.type === 'flag') return 'Optional';
    return '';
}

function renderTempoGroup(g, o, nested) {
    let body = '';
    if (g.type === 'single' || g.type === 'optional' || g.type === 'multi') {
        const cards = [];
        if (g.type === 'optional') {
            cards.push(optionCard({ key: `${g.id}:none`, label: 'None', photo: null, active: !o[g.id], onclick: `pickTempoOption('${g.id}', -1)`, kind: 'radio' }));
        }
        g.options.forEach((opt, k) => {
            if (g.upgradeFrom && k === g.upgradeFrom) cards.push('<p class="opt-grid-label">Upgrades</p>');
            const multi = g.type === 'multi';
            const active = multi ? (o[g.id] || []).includes(opt) : o[g.id] === opt;
            cards.push(optionCard({
                key: `${g.id}:${k}`, label: opt, photo: optionPhoto(opt), active,
                onclick: multi ? `toggleTempoOption('${g.id}', ${k})` : `pickTempoOption('${g.id}', ${k})`,
                kind: multi ? 'check' : 'radio'
            }));
        });
        // Seat colors read better as swatches than as photo cards
        if (g.id === 'flipSeatColor') {
            body = `<div class="flex flex-wrap gap-2">${g.options.map((opt, k) => `
                <button type="button" onclick="pickTempoOption('${g.id}', ${k})" data-opt-key="${g.id}:${k}" aria-pressed="${o[g.id] === opt}" class="detail-trim ${o[g.id] === opt ? 'detail-trim-active' : ''}">
                    <span class="detail-trim-dot" style="background:${getTrimHex('seat', opt) || '#D6D6CE'}"></span>${opt}
                </button>`).join('')}</div>`;
        } else {
            body = `<div class="opt-grid">${cards.join('')}</div>`;
        }
    } else if (g.type === 'qty' || g.type === 'side') {
        const segs = g.type === 'qty'
            ? [0, 1, 2].map(n => ({ key: `${g.id}:${n}`, label: n ? String(n) : 'None', active: o[g.id] === n, onclick: `setTempoQty('${g.id}', ${n})` }))
            : TEMPO_SIDES.map(s => ({ key: `${g.id}:${s.value || 'none'}`, label: s.label, active: (o[g.id] || '') === s.value, onclick: `setTempoSide('${g.id}', '${s.value}')`, disabled: tempoSideTaken(g, s.value, o) }));
        const used = g.type === 'side' ? tempoSidesOf(o[g.shares]) : [];
        const chosen = g.type === 'qty' ? o[g.id] > 0 : !!o[g.id];
        body = `
            <div class="opt-item ${chosen ? 'opt-card-active' : ''}">
                ${optionMedia(optionPhoto(g.id), g.title)}
                <span class="opt-item-body">
                    ${optionSegments(segs)}
                    ${used.length ? `<span class="opt-card-note">${used.length > 1 ? 'Both sides are' : `The ${used[0]} side is`} taken by the ${g.sharesTitle}.</span>` : ''}
                </span>
            </div>`;
    } else if (g.type === 'flag') {
        const blocked = g.requires && !o[g.requires];
        body = `<div class="opt-grid">${optionCard({
            key: `${g.id}:on`, label: g.label, photo: optionPhoto(g.id), active: !!o[g.id],
            onclick: `toggleTempoOption('${g.id}')`, kind: 'check',
            note: blocked && g.requiresNote ? g.requiresNote : (o[g.id] ? 'Added' : 'Add to build'),
            extra: blocked ? 'disabled' : ''
        })}</div>`;
    }
    const hint = optionGroupHint(g);
    return `
        <div class="opt-group ${nested ? 'opt-group-nested' : ''}" role="group" aria-label="${g.title}">
            <div class="opt-group-head">
                <p class="opt-group-title">${g.title}</p>
                ${hint ? `<p class="opt-group-hint">${hint}</p>` : ''}
            </div>
            ${body}
        </div>`;
}

// What the build comes with: small cards, nothing to choose
function renderTempoIncluded(groups) {
    return `
        <div class="opt-included">
            ${groups.map(g => {
                const [name, detail] = splitOptionName(g.value);
                return `
                    <div class="opt-included-item">
                        ${optionMedia(optionPhoto(g.value) || optionPhoto(g.id), name)}
                        <span class="opt-card-body">
                            <span class="opt-card-detail">${g.title}</span>
                            <span class="opt-card-name">${name}</span>
                            ${detail ? `<span class="opt-card-detail">${detail}</span>` : ''}
                        </span>
                    </div>`;
            }).join('')}
        </div>`;
}

// The build's equipment: what's included first, then each section's choices as photo cards, with
// sub-choices (fenders, flip seat color) in a panel under their parent
function renderTempoOptions(product) {
    const i = detailLevelIndex(product);
    const o = detailBuild.options;
    const level = TEMPO_LINES[product.version].levels[i];
    const groups = getTempoOptionGroups(product, i);
    const subs = getTempoSubGroups(product, i, o);
    const sections = [...new Set(groups.map(g => g.section))];
    return `
        <p class="text-sm text-ink-2">Showing the <span class="text-ink font-medium">${buildTitle(product, level)}</span> build. <button type="button" onclick="scrollToDetailSection('build')" class="link">Change build</button></p>
        ${sections.map(section => {
            const inSection = groups.filter(g => g.section === section);
            return `
                <div class="opt-section">
                    <h3 class="opt-section-title">${section}</h3>
                    ${section === 'Included'
                        ? renderTempoIncluded(inSection)
                        : inSection.map(g => {
                            const children = subs.filter(s => s.parent === g.id);
                            return renderTempoGroup(g, o, false)
                                + (children.length ? `<div class="opt-subpanel">${children.map(s => renderTempoGroup(s, o, true)).join('')}</div>` : '');
                        }).join('')}
                </div>`;
        }).join('')}`;
}

// Splits a spec like "100 km per charge" into a big number, a unit, and a small trailing note
// for the Apple-style stat strip. Values that don't start with a number are shown whole.
function splitStatValue(value) {
    const match = String(value).match(/^([\d.]+(?:\s*[–-]\s*[\d.]+)?)\s*([A-Za-z\/]+)?\s*(.*)$/);
    if (!match) return { number: value, unit: '', note: '' };
    return { number: match[1], unit: (match[2] || '').toLowerCase(), note: match[3] || '' };
}

// Model tile: studio cutout on stone, the name set large, one line of specs. Used by the homepage range,
// related models and the cart list.
function renderModelTile(p, { eager = false } = {}) {
    const isVehicle = p.category !== 'Accessories';
    return `
        <a href="${routeHref('product-details', p.slug)}" data-route="product-details" data-slug="${p.slug}" class="group block h-full">
            <div class="media-zoom edge-light bg-stone aspect-[4/3] flex items-center justify-center p-6 lg:p-10">
                <img src="${p.image}" alt="${p.name}${isVehicle ? `, ${categoryLabel(p.category)}` : ''}" loading="${eager ? 'eager' : 'lazy'}" decoding="async" class="max-h-full w-auto object-contain mix-blend-multiply">
            </div>
            <div class="pt-5 pb-2 pr-4">
                <p class="${isVehicle ? 'type-lg' : 'type-md'} text-ink">${p.name}</p>
                <p class="text-sm text-mute mt-2">${isVehicle ? homeSpecLine(p) : (p.tagline || categoryLabel(p.category))}</p>
            </div>
        </a>`;
}

// Build comparison table (pillar pages): one column per build, inclusions as rows
function renderBuildCompareTable(buildSet) {
    const rowsMax = Math.max(...buildSet.builds.map(b => b.includes.length));
    return `
        <div class="overflow-x-auto border-y border-line">
            <table class="w-full min-w-[560px] text-left">
                <thead>
                    <tr class="border-b border-line">
                        ${buildSet.builds.map(b => `
                            <th scope="col" class="py-6 pr-6 align-top font-normal">
                                <p class="type-md text-ink">${b.name}</p>
                                <p class="text-sm text-mute mt-1">${b.tagline}</p>
                            </th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${Array.from({ length: rowsMax }, (_, r) => `
                        <tr class="border-b border-line">
                            ${buildSet.builds.map(b => `<td class="py-3 pr-6 text-[0.9375rem]">${b.includes[r] || ''}</td>`).join('')}
                        </tr>`).join('')}
                    <tr>
                        ${buildSet.builds.map(b => `<td class="py-4 pr-6 text-sm text-mute align-top">${b.note || ''}</td>`).join('')}
                    </tr>
                </tbody>
            </table>
        </div>`;
}

function renderBuildSection(product, buildSet) {
    return `
        <section id="build" class="detail-section rise scroll-mt-32 home-section max-w-site mx-auto px-5 sm:px-8 lg:px-12">
            <div class="grid lg:grid-cols-12 gap-8 lg:gap-12 items-end mb-12">
                <h2 class="type-xl text-ink lg:col-span-7">${buildSet.title}</h2>
                ${buildSet.note ? `<p class="measure lg:col-span-5">${buildSet.note}</p>` : ''}
            </div>

            <div class="grid grid-cols-1 md:grid-cols-${buildSet.builds.length} gap-4" role="radiogroup" aria-label="Build level">
                ${buildSet.builds.map(b => `
                    <button type="button" role="radio" aria-checked="${b.id === detailBuild.level}" onclick="selectBuildLevel('${b.id}')" data-build="${b.id}" class="build-card edge-light ${b.id === detailBuild.level ? 'build-card-active' : ''} text-left p-6 lg:p-8 flex flex-col gap-5">
                        ${product.buildPhotos && product.buildPhotos[b.id] ? `
                            <span class="build-card-photo"><img src="${product.buildPhotos[b.id]}" alt="${product.name} ${b.name} build" loading="lazy" decoding="async"></span>` : ''}
                        <span class="flex items-start justify-between gap-4">
                            <span>
                                <span class="block type-md text-ink">${b.name}</span>
                                <span class="block text-sm text-mute mt-1">${b.tagline}</span>
                            </span>
                            <span class="build-card-check" aria-hidden="true"></span>
                        </span>
                        <ul class="home-list text-[0.9375rem]">
                            ${b.includes.map(x => `<li>${x}</li>`).join('')}
                        </ul>
                        ${b.note ? `<span class="block text-sm text-mute mt-auto">${b.note}</span>` : ''}
                        ${b.proposed ? '<span class="block text-sm text-green-text font-medium">Proposed package, confirmed in your quote</span>' : ''}
                    </button>
                `).join('')}
            </div>

            ${isTempoVersion(product) ? `
                <!-- Tempo builds: the running summary is the side panel beside Equipment and upgrades -->
                <div class="mt-10 flex flex-wrap items-center justify-between gap-4">
                    <p class="text-sm text-ink-2 measure">Next, choose colors, then equipment and upgrades. Your build stays beside you as you go.</p>
                    <button type="button" onclick="scrollToDetailSection('colors')" class="btn btn-primary">Choose colors</button>
                </div>
            ` : `
                <div class="mt-16 bg-band text-on-band p-6 sm:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <p class="text-sm text-on-band-mute">Your build</p>
                        <p id="build-summary-line" class="type-md mt-2" aria-live="polite"></p>
                        <p class="text-sm text-on-band-mute mt-3 measure">Choose colors next, then send it to us. We confirm inclusions, pricing and availability in the quote.</p>
                    </div>
                    <div class="flex flex-wrap gap-3 flex-shrink-0">
                        <button type="button" onclick="scrollToDetailSection('colors')" class="btn btn-primary">Choose colors</button>
                        <button type="button" onclick="requestQuoteInColor()" class="btn btn-on-dark">Get a quote</button>
                    </div>
                </div>
            `}
            ${buildSet.confirmed ? '' : '<p class="text-sm text-mute mt-4">Build names and package contents are proposed and may change.</p>'}
        </section>
    `;
}

// "Scratch 2", "Pro 2+2": a golfer build named with its model's seat layout
function buildViewName(product, level) {
    return `${level.name} ${product.name.replace(/^Golfer /, '')}`;
}

// Header thumbnail for a build: its photo, name and description, and the builder below starts on that build
function showDetailBuildView(button, index) {
    const product = currentDetailProduct();
    const buildSet = product && getProductBuildSet(product);
    const level = buildSet && buildSet.builds.find(b => b.id === product.galleryLevels[index]);
    if (!level) return;
    showDetailImage(button, product.gallery[index]);
    const img = document.getElementById('detail-main-img');
    if (img) img.alt = `${buildViewName(product, level)} build`;
    const title = document.getElementById('detail-title');
    if (title) title.textContent = buildViewName(product, level);
    const tagline = document.getElementById('detail-tagline');
    // The Golfer build is the model's default view, so it keeps the model's own description
    if (tagline) tagline.textContent = index === 0 ? product.tagline : (level.blurb || level.tagline);
    const cta = document.getElementById('detail-build-cta');
    if (cta) cta.textContent = `Build your ${buildViewName(product, level)}`;
    if (detailBuild.level !== level.id) selectBuildLevel(level.id);
}

function showDetailImage(button, src) {
    const img = document.getElementById('detail-main-img');
    if (img) img.src = src;
    document.querySelectorAll('.gallery-thumb').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
}

// Text for an HTML attribute value (option names can contain quotes, e.g. 80" GC Canopy)
function attrText(value) {
    return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

// Body, seat and canopy pickers on the model page, for the current choices (and, on a Tempo, its build)
function renderDetailColorPickers(product) {
    const groups = getProductBodyGroups(product, detailLevelArg(product));
    const bodyColors = groups.flatMap(g => g.colors);
    const activeIdx = bodyColors.findIndex(c => c.name === detailBuild.body);
    const family = COLOR_FAMILIES[product.colorFamily];
    const seatGroups = getDetailSeatGroups(product);
    const canopyOptions = getDetailCanopyOptions(product);
    let idx = 0;
    return `
        <div class="space-y-5">
            ${bodyColors.length ? `
                <p class="text-lg text-ink">Body color: <span id="detail-color-name" class="font-semibold">${detailBuild.body || ''}</span></p>
                ${groups.map(group => `
                    <div class="space-y-3">
                        <p class="text-sm text-mute">${group.tier}</p>
                        <div class="flex flex-wrap gap-3" role="radiogroup" aria-label="${group.tier}">
                            ${group.colors.map(c => {
                                const i = idx++;
                                return `<button type="button" role="radio" aria-checked="${i === activeIdx}" onclick="selectDetailColor(${i}, true)" title="${attrText(c.name)}" aria-label="${attrText(c.name)}" class="detail-swatch ${i === activeIdx ? 'detail-swatch-active' : ''}" style="background:${c.hex}"></button>`;
                            }).join('')}
                        </div>
                    </div>
                `).join('')}
                <p class="text-sm text-mute">Swatches are approximate screen colors. We confirm the final finish with you.</p>
            ` : `
                <p class="text-lg text-ink">Body color</p>
                <p class="measure">Body colors for the ${product.name} are confirmed per order. Ask for a quote and we'll send the current options.</p>
            `}
        </div>

        ${[
            { type: 'seat', title: 'Seat color', groups: seatGroups },
            { type: 'canopy', title: 'Canopy', groups: canopyOptions.length ? [{ tier: null, options: canopyOptions }] : [] }
        ].filter(t => t.groups.length).map(t => `
            <div class="space-y-4 border-t border-line pt-8">
                <p class="text-lg text-ink">${t.title}: <span id="detail-${t.type}-name" class="font-semibold">${detailBuild[t.type] || 'Standard'}</span></p>
                ${t.groups.map(group => `
                    <div class="space-y-3">
                        ${group.tier && t.groups.length > 1 ? `<p class="text-sm text-mute">${group.tier}</p>` : ''}
                        <div class="flex flex-wrap gap-2" role="group" aria-label="${group.tier || t.title}">
                            ${group.options.map(opt => {
                                const active = detailBuild[t.type] === opt;
                                return `
                                <button type="button" onclick="selectDetailTrim(this.dataset.type, this.dataset.value, true)" data-type="${t.type}" data-value="${attrText(opt)}" aria-pressed="${active}" class="detail-trim ${active ? 'detail-trim-active' : ''}">
                                    <span class="detail-trim-dot" style="background:${getTrimHex(t.type, opt) || '#D6D6CE'}"></span>${opt}
                                </button>`;
                            }).join('')}
                        </div>
                    </div>
                `).join('')}
                ${t.type === 'seat' && family && family.seatGroups === CLUB_CAR_SEAT_GROUPS ? `
                    <div id="detail-seat-photo" class="seat-photo-panel hidden" aria-live="polite">
                        <p class="text-sm text-mute">Seat photo: <span class="seat-photo-name text-ink"></span></p>
                        <div class="seat-photo-grid"></div>
                    </div>
                ` : ''}
            </div>
        `).join('')}

        ${seatGroups.length || canopyOptions.length ? `
            <p class="text-sm text-ink-2 border-l-2 border-green pl-4">${isTempoVersion(product)
                ? 'Colors shown are the ones offered with the build you chose. We confirm them in your quote.'
                : "Seat and canopy combinations vary by model. Choose your preferred options and we'll confirm them in your quote."}</p>
        ` : ''}`;
}

function renderProductDetailsPage() {
    const product = PRODUCTS_DATA.find(p => p.slug === currentSlug) || PRODUCTS_DATA[0];
    const isVehicle = product.category !== 'Accessories';
    const safeName = product.slug; // quote buttons pass the slug (names repeat across pillars)
    const buildSet = getProductBuildSet(product);
    const tempo = isTempoVersion(product);
    // A Tempo starts on its first build, or on the first build offering the color chosen on the homepage
    let levelIdx = 0;
    if (tempo && pendingBodyColor) levelIdx = Math.max(0, TEMPO_MATRIX.body.findIndex(list => list.includes(pendingBodyColor)));
    const bodyColors = getProductBodyColors(product, tempo ? levelIdx : undefined);
    // Start on the color chosen on the homepage, else on a color we have a photo for
    const pendingIdx = pendingBodyColor ? bodyColors.findIndex(c => c.name === pendingBodyColor) : -1;
    pendingBodyColor = null;
    const startColorIdx = pendingIdx >= 0 ? pendingIdx : Math.max(0, bodyColors.findIndex(c => c.image));
    const startColor = bodyColors[startColorIdx];
    // Seat and canopy start as "Standard" (as photographed) until the visitor picks a color
    detailBuild = {
        body: startColor ? startColor.name : null, seat: null, canopy: null,
        level: buildSet ? buildSet.builds[levelIdx].id : null,
        options: tempo ? defaultTempoOptions(product, levelIdx) : {}
    };
    if (tempo) fixTempoSubChoices(product, levelIdx, detailBuild.options);
    if (tempo && pendingIdx < 0) applyBuildLook(product);
    const canopyOptions = getDetailCanopyOptions(product);
    setTimeout(updateDetailBuildSummary, 0);
    setTimeout(updateBuildSummaryLine, 0);
    const specGroups = getDetailSpecGroups(product);
    const related = PRODUCTS_DATA.filter(p => p.category === product.category && p.slug !== product.slug).slice(0, 3);
    const accessoryCount = getCompatibleAccessoryGroups(product.slug).reduce((n, g) => n + g.items.length, 0);

    // The four figures buyers compare first
    const stats = [
        { label: 'Seating', value: product.seating },
        { label: 'Range', value: product.range },
        { label: 'Top speed', value: product.speed },
        { label: 'Charging time', value: product.chargingTime }
    ].filter(s => isVehicle && isMeaningful(s.value)).map(s => ({ ...s, ...splitStatValue(s.value) }));

    const tabs = [
        { id: 'overview', label: 'Overview' },
        ...(buildSet ? [{ id: 'build', label: 'Build' }] : []),
        ...(isVehicle ? [{ id: 'colors', label: 'Colors' }] : []),
        ...(tempo ? [{ id: 'options', label: 'Equipment' }] : []),
        { id: 'features', label: 'Highlights' },
        { id: 'specifications', label: 'Specifications' }
    ];

    setTimeout(initDetailTabs, 50);

    return `
        <!-- Section bar: model name, section links and the quote action -->
        <nav class="model-subnav" aria-label="${product.name} sections">
            <div class="max-w-site mx-auto px-5 sm:px-8 lg:px-12 flex items-center justify-between gap-6">
                <span class="hidden md:block font-display text-xl text-ink whitespace-nowrap">${product.name}</span>
                <div class="flex items-center -ml-3 md:ml-0 overflow-x-auto scrollbar-none">
                    ${tabs.map((t, i) => `<button type="button" onclick="scrollToDetailSection('${t.id}')" data-target="${t.id}" class="detail-tab ${i === 0 ? 'detail-tab-active' : ''}">${t.label}</button>`).join('')}
                </div>
                <button type="button" onclick="openQuoteModal('${safeName}')" class="hidden sm:inline-flex btn btn-primary min-h-[2.5rem] px-5 text-sm flex-shrink-0">Get a quote</button>
            </div>
        </nav>

        <!-- Hero: the model name set large beside a big studio shot -->
        <section id="overview" class="detail-section scroll-mt-32 bg-stone">
            <div class="max-w-site mx-auto px-5 sm:px-8 lg:px-12 pt-8 pb-12 lg:pb-16 grid lg:grid-cols-12 gap-8 lg:gap-12 items-end">
                <div class="lg:col-span-5 lg:pb-10 space-y-6 order-2 lg:order-1">
                    <a href="${routeHref('products')}" data-route="products" class="text-sm text-ink-2 hover:text-ink">All carts</a>
                    <p class="text-sm text-ink-2">${categoryLabel(product.category)}${product.heroProduct ? ' · our bestseller' : ''}</p>
                    <h1 id="detail-title" class="type-hero text-ink">${product.name}</h1>
                    <p id="detail-tagline" class="text-xl text-ink-2 measure">${product.tagline}</p>
                    <p class="text-sm text-ink-2">${product.priceLabel === 'Inquire for Price' || !product.priceLabel ? 'Price on request' : product.priceLabel}</p>
                    <div class="flex flex-wrap items-center gap-4 pt-2">
                        ${buildSet
                            ? `<button type="button" id="detail-build-cta" onclick="scrollToDetailSection('build')" class="btn btn-primary">Build your ${product.name}</button>
                               <button type="button" onclick="openQuoteModal('${safeName}')" class="btn btn-outline">Get a quote</button>`
                            : `<button type="button" onclick="openQuoteModal('${safeName}')" class="btn btn-primary">Get a quote</button>`}
                    </div>
                </div>
                <div class="lg:col-span-7 order-1 lg:order-2">
                    <div class="aspect-[4/3] overflow-hidden flex items-center justify-center">
                        <img id="detail-main-img" src="${product.image}" alt="${product.name}" fetchpriority="high" class="max-h-full w-auto object-contain mix-blend-multiply">
                    </div>
                    ${product.gallery.length > 1 ? `
                        <div class="flex gap-2 justify-end" role="group" aria-label="Views">
                            ${product.gallery.map((img, i) => {
                                const level = product.galleryLevels && buildSet && buildSet.builds.find(b => b.id === product.galleryLevels[i]);
                                // The page opens on the first photo: for Golfer 2 / 2+2 that is the Golfer build, the default
                                const pressed = i === 0;
                                return `
                                <button type="button" onclick="${level ? `showDetailBuildView(this, ${i})` : `showDetailImage(this, '${img}')`}" aria-pressed="${pressed}" aria-label="${level ? `${buildViewName(product, level)} build` : `View ${i + 1} of ${product.gallery.length}`}" class="gallery-thumb">
                                    <img src="${img}" alt="" loading="lazy" class="w-full h-full object-contain mix-blend-multiply">
                                </button>`;
                            }).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        </section>

        <div class="max-w-site mx-auto px-5 sm:px-8 lg:px-12">
            ${stats.length ? `
                <dl class="stat-strip" style="--stat-cols:${stats.length}">
                    ${stats.map(s => `
                        <div>
                            <dt class="text-sm text-mute">${s.label}</dt>
                            <dd class="mt-3 text-ink font-display leading-none"><span class="text-[clamp(2.5rem,1.8rem+2.4vw,4.5rem)] tracking-[-0.03em]">${s.number}</span>${s.unit ? `<span class="text-xl ml-1">${s.unit}</span>` : ''}</dd>
                            ${s.note ? `<dd class="text-sm text-mute mt-2">${s.note}</dd>` : ''}
                        </div>
                    `).join('')}
                </dl>
            ` : ''}

            <div class="rise home-section grid lg:grid-cols-12 gap-10 lg:gap-12">
                <p class="lg:col-span-8 type-lg text-mute"><span class="text-ink">${product.name}.</span> ${product.description}</p>
                ${isVehicle ? `
                    <dl class="lg:col-span-4 space-y-6 lg:pt-3">
                        ${[{ label: 'Powertrain', value: product.powertrain }, { label: 'Battery', value: product.battery }]
                            .filter(h => isMeaningful(h.value)).map(h => `
                            <div class="border-t border-line pt-4">
                                <dt class="text-sm text-mute">${h.label}</dt>
                                <dd class="text-lg text-ink mt-1">${h.value}</dd>
                            </div>
                        `).join('')}
                    </dl>
                ` : (product.gallery[1] ? `
                    <div class="lg:col-span-4 bg-stone aspect-square flex items-center justify-center p-8">
                        <img src="${product.gallery[1]}" alt="${product.name}, another view" loading="lazy" class="max-h-full object-contain">
                    </div>` : '')}
            </div>
        </div>

        ${buildSet ? `<div class="border-t border-line">${renderBuildSection(product, buildSet)}</div>` : ''}

        ${isVehicle ? `
        <!-- Colors: the preview stays pinned on desktop while the pickers scroll past it -->
        <section id="colors" class="detail-section rise scroll-mt-32 home-section border-t border-line">
            <div class="max-w-site mx-auto px-5 sm:px-8 lg:px-12">
                <h2 class="type-xl text-ink mb-12">${bodyColors.length ? 'Your color. Your seat.' : 'Make it yours.'}</h2>
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
                    <div class="lg:col-span-7 lg:sticky lg:top-36">
                        <div class="relative bg-stone px-4 sm:px-8 py-8">
                            <div class="relative aspect-[4/3] overflow-hidden flex items-center justify-center">
                                <img id="detail-color-img" src="${startColor && startColor.image ? startColor.image : (hasLiveColorPreview(detailPreviewKey(product)) ? COLOR_PREVIEW[detailPreviewKey(product)].base : product.image)}" alt="${product.name} color preview" class="w-full h-full object-contain mix-blend-multiply">
                            </div>
                            <p id="detail-color-photo-note" class="${startColor && !startColor.image ? '' : 'hidden'} text-sm text-ink-2 mt-2">Photo shows a standard finish</p>
                            <!-- Live summary of the selected body / seat / canopy colors -->
                            <div id="detail-build-summary" class="flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4 mt-4" aria-live="polite"></div>
                        </div>
                    </div>

                    <div class="lg:col-span-5 space-y-10">
                        <div id="detail-color-pickers" class="space-y-10">${renderDetailColorPickers(product)}</div>

                        <div class="flex flex-wrap gap-3">
                            ${tempo ? `<button type="button" onclick="scrollToDetailSection('options')" class="btn btn-primary">Choose equipment</button>` : ''}
                            <button type="button" id="detail-color-quote" onclick="requestQuoteInColor()" class="btn ${tempo ? 'btn-outline' : 'btn-primary'}">${bodyColors.length || canopyOptions.length ? 'Get a quote for this build' : 'Get a quote'}</button>
                            ${accessoryCount && !tempo ? `<button type="button" onclick="addAccessoriesFromDetail()" class="btn btn-outline">Add accessories <span class="font-normal text-mute">(${accessoryCount})</span></button>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </section>
        ` : ''}

        ${tempo ? `
        <!-- Equipment and upgrades: what the chosen build includes and what can be added (the "Versions" document) -->
        <section id="options" class="detail-section rise scroll-mt-32 home-section border-t border-line">
            <div class="max-w-site mx-auto px-5 sm:px-8 lg:px-12 grid lg:grid-cols-12 gap-10 lg:gap-12 items-start">
                <!-- Your build: stays in view beside the choices on desktop -->
                <aside class="lg:col-span-4 lg:self-stretch space-y-8" aria-label="Your build">
                    <div>
                        <h2 class="type-xl text-ink">Equipment and upgrades.</h2>
                        <p class="measure mt-4">What your build includes, and what you can add to it. The choices change with the build level.</p>
                    </div>
                    <div id="detail-build-panel" class="build-panel lg:sticky lg:top-36" aria-live="polite">${renderBuildPanel(product)}</div>
                </aside>
                <div class="lg:col-span-8">
                    <div id="detail-options">${renderTempoOptions(product)}</div>
                    <div class="mt-12 flex flex-wrap gap-3">
                        <button type="button" onclick="requestQuoteInColor()" class="btn btn-primary">Get a quote for this build</button>
                        ${accessoryCount ? `<button type="button" onclick="addAccessoriesFromDetail()" class="btn btn-outline">More accessories <span class="font-normal text-mute">(${accessoryCount})</span></button>` : ''}
                    </div>
                </div>
            </div>
        </section>
        ` : ''}

        <section id="features" class="detail-section rise scroll-mt-32 home-section border-t border-line">
            <div class="max-w-site mx-auto px-5 sm:px-8 lg:px-12 grid lg:grid-cols-12 gap-10 lg:gap-12">
                <h2 class="type-xl text-ink lg:col-span-4">Highlights.</h2>
                <ol class="lg:col-span-8 border-b border-line">
                    ${product.features.map((f, i) => `
                        <li class="grid grid-cols-[3rem_1fr] gap-4 py-6 border-t border-line">
                            <span class="text-sm text-mute pt-1.5">0${i + 1}</span>
                            <span class="type-md text-ink">${f}</span>
                        </li>
                    `).join('')}
                </ol>
            </div>
        </section>

        <section id="specifications" class="detail-section rise scroll-mt-32 home-section border-t border-line">
            <div class="max-w-site mx-auto px-5 sm:px-8 lg:px-12">
                <h2 class="type-xl text-ink mb-12">Specifications.</h2>
                <div class="border-b border-line">
                    ${specGroups.map(g => `
                        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-12 py-8 border-t border-line">
                            <h3 class="lg:col-span-4 type-md text-ink">${g.title}</h3>
                            <dl class="lg:col-span-8">
                                ${g.rows.map(([k, v]) => `
                                    <div class="grid grid-cols-2 gap-6 py-3 border-b border-line last:border-0">
                                        <dt class="text-mute">${k}</dt>
                                        <dd class="text-ink">${v}</dd>
                                    </div>
                                `).join('')}
                            </dl>
                        </div>
                    `).join('')}
                </div>
                <p class="text-sm text-mute mt-6">Specifications may change without notice. Actual range varies with load, terrain and driving.</p>
            </div>
        </section>

        <section class="rise bg-band text-on-band">
            <div class="max-w-site mx-auto px-5 sm:px-8 lg:px-12 py-12 lg:py-[4.5rem] grid lg:grid-cols-12 gap-8 items-end">
                <h2 class="type-xl lg:col-span-7">Make it yours.</h2>
                <div class="lg:col-span-5 space-y-6">
                    <p class="text-on-band-mute measure">Pricing, lead times and customization for the ${product.name}, from your nearest branch.</p>
                    <div class="flex flex-wrap gap-3">
                        <button type="button" onclick="openQuoteModal('${safeName}')" class="btn btn-primary">Get a quote</button>
                        <button type="button" onclick="goToHomeSection('home-branches')" class="btn btn-on-dark">Find a branch</button>
                    </div>
                </div>
            </div>
        </section>

        ${related.length ? `
        <section class="home-section">
            <div class="max-w-site mx-auto px-5 sm:px-8 lg:px-12">
                <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <h2 class="type-lg text-ink">More from ${categoryLabel(product.category)}.</h2>
                    <a href="${routeHref('products')}" onclick="event.preventDefault(); setCategoryAndNavigate('${product.category}')" class="link self-start md:self-auto">See all</a>
                </div>
                <ul class="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12">
                    ${related.map(p => `<li>${renderModelTile(p)}</li>`).join('')}
                </ul>
            </div>
        </section>
        ` : ''}
    `;
}

function renderSegmentModelCard(segmentId, subId, modelKey) {
    const model = VEHICLE_MODELS[modelKey];
    const product = model.slug ? PRODUCTS_DATA.find(p => p.slug === model.slug) : null;
    const quoteRef = (product ? product.slug : model.name).replace(/'/g, "\\'");
    const isReman = segmentId === 'remanufactured';

    return `
        <div id="${modelAnchorId(segmentId, subId, modelKey)}" class="flex flex-col scroll-mt-40">
            <div class="${product ? 'media-zoom edge-light' : ''} relative overflow-hidden bg-stone aspect-[4/3] flex items-center justify-center p-6">
                ${model.image
                    ? `<img src="${model.image}" alt="${model.name}" loading="lazy" decoding="async" class="max-h-full w-auto object-contain">`
                    : '<span class="text-sm text-ink-2">Photo to follow</span>'}
            </div>
            <div class="pt-5 flex flex-col gap-2 flex-1">
                <h3 class="type-md text-ink">${model.label || model.name}${model.badge ? ` <span class="font-sans text-sm text-green-text align-middle">${model.badge}</span>` : ''}</h3>
                ${model.label ? `<p class="text-sm text-mute -mt-1">${model.name}</p>` : ''}
                ${product ? `<p class="text-[0.9375rem]">${product.tagline}</p>` : ''}
                ${product && getProductBuildSet(product) ? `<p class="text-sm text-mute">${getProductBuildSet(product).builds.map(b => b.name).join(' · ')}</p>` : ''}
                ${isReman ? '<p class="text-sm text-mute">Ask for current units, rebuild scope and warranty.</p>' : ''}
                <div class="mt-auto pt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                    ${product ? `<a href="${routeHref('product-details', product.slug)}" data-route="product-details" data-slug="${product.slug}" class="link text-sm">${getProductBuildSet(product) ? 'Build and price' : 'See details'}</a>` : ''}
                    <button type="button" onclick="openQuoteModal('${quoteRef}')" class="link text-sm">${isReman ? 'Check availability' : 'Get a quote'}</button>
                </div>
            </div>
        </div>
    `;
}

// Business enquiry prompt (Guest Transportation, Fit-to-Task): leads to the fleet proposal form
function renderEnquiryPrompt(text) {
    return `
        <div class="bg-band text-on-band p-6 sm:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <p class="type-md max-w-2xl">${text}</p>
            <a href="${routeHref('solutions')}" data-route="solutions" class="btn btn-primary flex-shrink-0">Request a fleet proposal</a>
        </div>`;
}

function renderSegmentPage() {
    const segment = NAV_SEGMENTS.find(s => s.id === currentSlug) || NAV_SEGMENTS[0];
    const buildSet = segment.version ? tempoBuildSet(segment.version) : null;
    const photo = HOME_USES[segment.id];
    const jumpLinks = [
        ...(segment.subcategories.length > 1 ? segment.subcategories.map(sub => ({ label: sub.label, anchor: sub.id })) : []),
        ...(segment.links || []).map(l => ({ label: l.label, anchor: l.anchor }))
    ];

    return `
        <section class="max-w-site mx-auto px-5 sm:px-8 lg:px-12 pt-16 lg:pt-24">
            <p class="text-sm text-mute">${segment.label}</p>
            <div class="grid lg:grid-cols-12 gap-8 lg:gap-12 items-end mt-4">
                <h1 class="type-xl text-ink lg:col-span-7">${segment.tagline}</h1>
                <div class="lg:col-span-5 space-y-6">
                    <p class="measure">${segment.description}</p>
                    ${jumpLinks.length ? `<ul class="flex flex-wrap gap-x-6 gap-y-2">${jumpLinks.map(l => `<li><button type="button" onclick="openSegment('${segment.id}', '${segment.id}-${l.anchor}')" class="link text-sm">${l.label}</button></li>`).join('')}</ul>` : ''}
                </div>
            </div>
            <div class="mt-12 ${photo ? 'aspect-[16/9] md:aspect-[21/9] overflow-hidden' : 'bg-stone overflow-hidden aspect-[16/9] md:aspect-[21/9] flex items-center justify-center p-8'}">
                <img src="${photo ? photo.image : segment.image}" alt="${photo ? photo.alt : segment.label}" fetchpriority="high" class="${photo ? 'w-full h-full object-cover' : 'max-h-full w-auto object-contain'}">
            </div>
        </section>

        ${segment.subcategories.map(sub => `
            <section id="${segment.id}-${sub.id}" class="home-section scroll-mt-20 max-w-site mx-auto px-5 sm:px-8 lg:px-12">
                <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-line pb-6 mb-10">
                    <h2 class="type-lg text-ink">${sub.label}</h2>
                    ${sub.intro ? `<p class="measure md:text-right md:max-w-md">${sub.intro}</p>` : ''}
                </div>
                ${sub.groups.map(group => `
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
                        ${group.items.map(key => renderSegmentModelCard(segment.id, sub.id, key)).join('')}
                    </div>
                `).join('')}
                ${sub.enquiry ? `<div class="mt-14">${renderEnquiryPrompt(sub.enquiry)}</div>` : ''}
            </section>
        `).join('')}

        ${buildSet ? `
            <section id="${segment.id}-compare" class="home-section pt-0 scroll-mt-20 max-w-site mx-auto px-5 sm:px-8 lg:px-12">
                <div class="grid lg:grid-cols-12 gap-6 lg:gap-12 items-end mb-10">
                    <h2 class="type-lg text-ink lg:col-span-7">Compare ${buildSet.builds.map(b => b.name).join(', ')}.</h2>
                    <p class="measure lg:col-span-5">${segment.id === 'golfer'
                        ? 'Golfer, Scratch and Pro apply across Golfer 2, Golfer 2+2 and Tempo 4. Canopy, flip seat and enclosure choices depend on the model.'
                        : 'Essential, Signature and Elite apply across every lifestyle model. Canopy, flip seat and enclosure choices depend on the model.'}</p>
                </div>
                ${renderBuildCompareTable(buildSet)}
                ${buildSet.confirmed ? '' : '<p class="text-sm text-mute mt-4">Build names and package contents are proposed and may change.</p>'}
            </section>
        ` : ''}

        ${segment.id === 'lifestyle' ? `
            <section id="lifestyle-lifted" class="bg-stone scroll-mt-20">
                <div class="max-w-site mx-auto px-5 sm:px-8 lg:px-12 py-12 lg:py-[4.5rem] grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                    <div class="lg:col-span-5 space-y-6">
                        <p class="text-sm text-ink-2">Lifted package</p>
                        <h2 class="type-xl text-ink">Ready for rougher ground.</h2>
                        <p class="measure text-ink-2">A 3.5-inch GC lift kit with your choice of fenders, an optional brush guard and nerf bars, and 12- or 14-inch wheels with tires for the surface you drive on. Available on the Signature and Elite builds.</p>
                        <p class="text-sm text-ink-2">Offered only for approved model and component combinations. Private-use configurations are not approved for public roads.</p>
                        <a href="${routeHref('product-details', 'lifestyle-tempo-2-2')}" data-route="product-details" data-slug="lifestyle-tempo-2-2" class="btn btn-primary">Build a lifted Tempo 2+2</a>
                    </div>
                    <div class="lg:col-span-7">
                        <img src="image/Products/Tempo 2+2 - Lifted.png" alt="Tempo 2+2 with the lifted package" loading="lazy" class="w-full aspect-[4/3] object-contain">
                    </div>
                </div>
            </section>
        ` : ''}
    `;
}

// FLEET SOLUTIONS: separate enquiry route for golf-course and commercial buyers (blueprint 07)
function handleFleetProposalSubmit(e) {
    e.preventDefault();
    e.target.reset();
    showToast("Request sent. Our fleet team will contact you to prepare your proposal.");
}

function renderSolutionsPage() {
    const services = [
        { title: 'Fleet selection', text: 'Models and quantities chosen around your utilization, routes and operating hours.' },
        { title: 'Service planning', text: 'Preventive maintenance, parts and charging plans that keep the fleet running.' },
        { title: 'Replacement planning', text: 'Renewals and trade-ins scheduled before downtime reaches your operation.' }
    ];

    return `
        <section class="max-w-site mx-auto px-5 sm:px-8 lg:px-12 pt-16 lg:pt-24">
            <p class="text-sm text-mute">Fleet solutions</p>
            <div class="grid lg:grid-cols-12 gap-8 lg:gap-12 items-end mt-4">
                <h1 class="type-xl text-ink lg:col-span-7">Fleets for courses, resorts and sites.</h1>
                <p class="measure lg:col-span-5">Tell us how your operation runs. We'll recommend the vehicles, the service plan and the replacement schedule.</p>
            </div>
            <div class="mt-12 aspect-[16/9] md:aspect-[21/9] overflow-hidden">
                <img src="image/Banners/industrial.jpg" alt="Utility carts at an industrial site" fetchpriority="high" class="w-full h-full object-cover">
            </div>
        </section>

        <section class="home-section max-w-site mx-auto px-5 sm:px-8 lg:px-12">
            <ol class="grid md:grid-cols-3 gap-x-8 border-t border-line">
                ${services.map((s, i) => `
                    <li class="pt-6 pb-10 border-b border-line md:border-b-0 space-y-3">
                        <p class="text-sm text-mute">0${i + 1}</p>
                        <h2 class="type-md text-ink">${s.title}</h2>
                        <p class="measure">${s.text}</p>
                    </li>
                `).join('')}
            </ol>
        </section>

        <section id="fleet-proposal" class="home-section bg-stone scroll-mt-20" aria-labelledby="fleet-proposal-title">
            <div class="max-w-site mx-auto px-5 sm:px-8 lg:px-12 grid lg:grid-cols-12 gap-12">
                <div class="lg:col-span-4 space-y-5">
                    <h2 id="fleet-proposal-title" class="type-xl text-ink">Request a fleet proposal.</h2>
                    <p class="measure text-ink-2">Share unit numbers, how the fleet will be used and what you need help with. We'll prepare a proposal for your property.</p>
                    <p class="text-sm text-ink-2">Financing or payment options are presented only when approved.</p>
                </div>
                <form onsubmit="handleFleetProposalSubmit(event)" class="lg:col-span-7 lg:col-start-6 grid sm:grid-cols-2 gap-x-6 gap-y-5">
                    <div class="field"><label for="fp-company">Company or property</label><input id="fp-company" required type="text" autocomplete="organization"></div>
                    <div class="field"><label for="fp-contact">Contact person and position</label><input id="fp-contact" required type="text" autocomplete="name"></div>
                    <div class="field"><label for="fp-email">Email</label><input id="fp-email" required type="email" autocomplete="email"></div>
                    <div class="field"><label for="fp-phone">Mobile number</label><input id="fp-phone" required type="tel" autocomplete="tel" placeholder="+63 900 000 0000"></div>
                    <div class="field"><label for="fp-type">Operation</label>
                        <select id="fp-type" required>
                            <option value="">Select one</option>
                            <option>Golf course</option>
                            <option>Resort or hotel</option>
                            <option>Commercial or industrial property</option>
                            <option>Township or estate</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div class="field"><label for="fp-units">Estimated units</label><input id="fp-units" type="number" min="1" placeholder="20"></div>
                    <fieldset class="sm:col-span-2">
                        <legend class="text-sm font-medium text-ink mb-3">I need help with</legend>
                        <div class="flex flex-wrap gap-2">
                            ${['Fleet selection', 'Service planning', 'Replacement planning', 'Fit-to-task builds'].map(o => `<label class="detail-trim cursor-pointer !pl-3"><input type="checkbox" class="w-4 h-4 accent-[#151714]"> ${o}</label>`).join('')}
                        </div>
                    </fieldset>
                    <div class="field sm:col-span-2"><label for="fp-notes">Passenger demand, routes, terrain and operating hours</label><textarea id="fp-notes" rows="4"></textarea></div>
                    <div class="sm:col-span-2"><button type="submit" class="btn btn-primary">Send request</button></div>
                </form>
            </div>
        </section>
    `;
}

function handleServiceRequestSubmit(e) {
    e.preventDefault();
    e.target.reset();
    showToast(`Request sent. Your reference is SRV-${Math.floor(1000 + Math.random() * 9000)}.`);
}

function renderServicePage() {
    const checks = [
        { title: 'Performance', desc: 'Overall power, responsiveness and efficiency.' },
        { title: 'Brakes', desc: 'Brake components inspected for safe, responsive stopping.' },
        { title: 'Suspension', desc: 'Shocks and struts checked for stability and a smooth ride.' },
        { title: 'Battery', desc: 'Charge, terminal connections and overall condition.' },
        { title: 'Wheel alignment', desc: 'Wheel angles set for straight tracking and even tire wear.' },
        { title: 'Tires and wheels', desc: 'Tread depth, tire condition and rim integrity.' },
        { title: 'Lubrication', desc: 'Drive components lubricated to reduce friction and wear.' }
    ];

    return `
        <section class="relative">
            <img src="image/Hero/hero-3.webp" alt="Golfcarts.ph technician working on a cart" fetchpriority="high" class="w-full aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9] object-cover">
        </section>

        <section class="max-w-site mx-auto px-5 sm:px-8 lg:px-12 pt-16 lg:pt-24">
                        <div class="grid lg:grid-cols-12 gap-8 lg:gap-12 items-end mt-4">
                <h1 class="type-xl text-ink lg:col-span-7">Service, parts and support.</h1>
                <div class="lg:col-span-5 space-y-6">
                    <p class="measure">Preventive maintenance, repairs, original parts and battery checks from our service team, at our branches or on site.</p>
                    <div class="flex flex-wrap gap-3">
                        <button type="button" onclick="scrollToDetailSection('service-request')" class="btn btn-primary">Book a service</button>
                        <button type="button" onclick="goToHomeSection('home-branches')" class="btn btn-outline">Find a branch</button>
                    </div>
                </div>
            </div>
        </section>

        <section class="home-section max-w-site mx-auto px-5 sm:px-8 lg:px-12 grid lg:grid-cols-12 gap-10 lg:gap-12">
            <div class="lg:col-span-4 space-y-4">
                <h2 class="type-lg text-ink">Seven-point preventive maintenance.</h2>
                <p class="measure">Every scheduled service covers the same seven checks, to keep carts and fleets on the road for longer.</p>
            </div>
            <ol class="lg:col-span-8 border-b border-line">
                ${checks.map((c, i) => `
                    <li class="grid grid-cols-[3rem_1fr] md:grid-cols-[3rem_14rem_1fr] gap-x-4 gap-y-1 py-6 border-t border-line">
                        <span class="text-sm text-mute pt-1">0${i + 1}</span>
                        <span class="type-md text-ink">${c.title}</span>
                        <span class="col-start-2 md:col-start-3 md:pt-1">${c.desc}</span>
                    </li>
                `).join('')}
            </ol>
        </section>

        <section id="service-request" class="home-section bg-stone scroll-mt-20" aria-labelledby="service-request-title">
            <div class="max-w-site mx-auto px-5 sm:px-8 lg:px-12 grid lg:grid-cols-12 gap-12">
                <div class="lg:col-span-4 space-y-5">
                    <h2 id="service-request-title" class="type-xl text-ink">Book a service.</h2>
                    <p class="measure text-ink-2">Tell us what the cart needs. We'll confirm a schedule with you.</p>
                </div>
                <form onsubmit="handleServiceRequestSubmit(event)" class="lg:col-span-7 lg:col-start-6 grid sm:grid-cols-2 gap-x-6 gap-y-5">
                    <div class="field"><label for="sr-name">Name</label><input id="sr-name" required type="text" autocomplete="name"></div>
                    <div class="field"><label for="sr-org">Club, resort or company</label><input id="sr-org" required type="text" autocomplete="organization"></div>
                    <div class="field"><label for="sr-phone">Mobile number</label><input id="sr-phone" required type="tel" autocomplete="tel" placeholder="+63 900 000 0000"></div>
                    <div class="field"><label for="sr-branch">Nearest branch</label>
                        <select id="sr-branch">${BRANCHES.map(b => `<option>${b.name}</option>`).join('')}</select>
                    </div>
                    <div class="field sm:col-span-2"><label for="sr-type">Service</label>
                        <select id="sr-type">
                            <option>Preventive maintenance (seven-point check)</option>
                            <option>On-site technician repair</option>
                            <option>Parts request</option>
                            <option>Lithium battery health check</option>
                            <option>Maintenance and charging advice</option>
                            <option>Warranty enquiry</option>
                        </select>
                    </div>
                    <div class="sm:col-span-2"><button type="submit" class="btn btn-primary">Send request</button></div>
                </form>
            </div>
        </section>
    `;
}

function renderBlogsPage() {
    const posts = [...BLOGS_DATA].sort((a, b) => new Date(b.date) - new Date(a.date));
    return `
        <section class="max-w-site mx-auto px-5 sm:px-8 lg:px-12 pt-16 lg:pt-24">
            <div class="grid lg:grid-cols-12 gap-8 lg:gap-12 items-end">
                <h1 class="type-xl text-ink lg:col-span-7">Notes from the fairway.</h1>
                <p class="measure lg:col-span-5">Buying guides, maintenance tips and stories about low-speed electric vehicles.</p>
            </div>
        </section>

        <section class="home-section max-w-site mx-auto px-5 sm:px-8 lg:px-12">
            <ul class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                ${posts.map(post => `
                    <li>
                        <a href="${routeHref('blog-details', post.slug)}" data-route="blog-details" data-slug="${post.slug}" class="group block">
                            <div class="media-zoom edge-light bg-stone aspect-[4/3] flex items-center justify-center p-6">
                                <img src="${post.image}" alt="" loading="lazy" decoding="async" class="max-h-full w-auto object-contain">
                            </div>
                            <p class="text-sm text-mute mt-5">${post.category} · <time datetime="${post.date}">${formatBlogDate(post.date)}</time></p>
                            <h2 class="type-md text-ink mt-2 group-hover:underline decoration-1 underline-offset-4">${post.title}</h2>
                            <p class="mt-3 measure">${post.excerpt}</p>
                        </a>
                    </li>
                `).join('')}
            </ul>
        </section>
    `;
}

function renderBlogDetailsPage() {
    const post = BLOGS_DATA.find(p => p.slug === currentSlug);
    if (!post) return renderBlogsPage();
    const more = BLOGS_DATA.filter(p => p.slug !== post.slug).slice(0, 2);

    return `
        <article class="max-w-site mx-auto px-5 sm:px-8 lg:px-12 pt-12 lg:pt-20">
            <a href="${routeHref('blogs')}" data-route="blogs" class="text-sm text-ink-2 hover:text-ink">Blog</a>
            <header class="mt-8 max-w-4xl">
                <p class="text-sm text-mute">${post.category} · <time datetime="${post.date}">${formatBlogDate(post.date)}</time></p>
                <h1 class="type-xl text-ink mt-4">${post.title}</h1>
            </header>
            <div class="mt-12 bg-stone overflow-hidden aspect-[16/9] md:aspect-[21/9] flex items-center justify-center p-8">
                <img src="${post.image}" alt="" fetchpriority="high" class="max-h-full w-auto object-contain">
            </div>
            <div class="measure mx-auto mt-16 space-y-6 text-lg leading-[1.7]">
                ${post.content.map(p => `<p>${p}</p>`).join('')}
            </div>
            <div class="measure mx-auto mt-16 border-t border-line pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p class="type-md text-ink">Looking for the right cart?</p>
                <button type="button" onclick="openQuoteModal()" class="btn btn-primary">Get a quote</button>
            </div>
        </article>

        ${more.length ? `
            <section class="home-section max-w-site mx-auto px-5 sm:px-8 lg:px-12">
                <h2 class="type-lg text-ink mb-10">Keep reading.</h2>
                <ul class="grid md:grid-cols-2 gap-x-8 gap-y-12 border-t border-line">
                    ${more.map(p => `
                        <li class="pt-6">
                            <a href="${routeHref('blog-details', p.slug)}" data-route="blog-details" data-slug="${p.slug}" class="group block">
                                <p class="text-sm text-mute">${p.category}</p>
                                <p class="type-md text-ink mt-2 group-hover:underline decoration-1 underline-offset-4">${p.title}</p>
                            </a>
                        </li>
                    `).join('')}
                </ul>
            </section>
        ` : ''}
    `;
}

function renderAboutPage() {
    const pillars = [
        { title: 'Who we are', text: 'Golfcarts.ph sells golf carts and electric utility vehicles across the Philippines, and goes further than most on customization and service, so your cart stands out.' },
        { title: 'What we do', text: 'We fit the right cart to the job, drawing on a range of suppliers whose products you can trust.' },
        { title: 'Why we do it', text: 'To take the golf cart beyond the course: out in the open with friends and family, on electric power, in the places you like best.' }
    ];
    return `
        <section class="max-w-site mx-auto px-5 sm:px-8 lg:px-12 pt-16 lg:pt-24">
            <p class="text-sm text-mute">About Golfcarts.ph</p>
            <div class="grid lg:grid-cols-12 gap-8 lg:gap-12 items-end mt-4">
                <h1 class="type-xl text-ink lg:col-span-7">Low-speed electric vehicles for private roads.</h1>
                <p class="measure lg:col-span-5">Golf courses, resorts, gated villages, estates and industrial sites. Sold, customized and serviced by SJK Guahan Inc.</p>
            </div>
            <div class="mt-12 aspect-[16/9] md:aspect-[21/9] overflow-hidden">
                <img src="image/4.png" alt="A fleet of green Tempo carts lined up at a golf course" width="1920" height="1080" fetchpriority="high" class="w-full h-full object-cover">
            </div>
        </section>

        <section class="home-section max-w-site mx-auto px-5 sm:px-8 lg:px-12 grid lg:grid-cols-12 gap-10 lg:gap-12">
            <h2 class="type-lg text-ink lg:col-span-4">Part of the SJK Guahan group.</h2>
            <div class="lg:col-span-7 lg:col-start-6 space-y-6 text-lg leading-[1.7] measure">
                <p>Golfcarts.ph is part of the SJK Guahan group, which focuses on service backed by durable, reliable products. The brand is rooted in the outdoors and the lifestyle that comes with it, and our mission is to make time outdoors more enjoyable with products you can afford and trust.</p>
                <p>SJK Guahan is a 50/50 joint venture between two groups, from the Philippines and Guam, that began by bringing Club Car golf carts into the country. As we grew into golf courses, we added mowers through a partnership with Textron's Jacobsen line.</p>
            </div>
        </section>

        <section class="max-w-site mx-auto px-5 sm:px-8 lg:px-12">
            <ul class="grid md:grid-cols-3 gap-x-8 border-t border-line">
                ${pillars.map(p => `
                    <li class="pt-6 pb-10 border-b border-line md:border-b-0 space-y-3">
                        <h3 class="type-md text-ink">${p.title}</h3>
                        <p class="measure">${p.text}</p>
                    </li>
                `).join('')}
            </ul>
        </section>

        <section class="home-section bg-stone mt-12 lg:mt-[4.5rem]" aria-labelledby="about-voices-title">
            <div class="max-w-site mx-auto px-5 sm:px-8 lg:px-12">
                <h2 id="about-voices-title" class="type-lg text-ink mb-12">From our customers.</h2>
                <div class="grid md:grid-cols-2 gap-x-12 gap-y-12">
                    ${TESTIMONIALS_DATA.map(t => `
                        <figure class="border-t border-ink pt-6">
                            <blockquote class="type-md text-ink">“${t.quote}”</blockquote>
                            <figcaption class="mt-5 text-sm text-ink-2">${t.author}</figcaption>
                        </figure>
                    `).join('')}
                </div>
            </div>
        </section>

        <section class="home-section max-w-site mx-auto px-5 sm:px-8 lg:px-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h2 class="type-xl text-ink">Come and drive one.</h2>
            <div class="flex flex-wrap gap-3">
                <a href="${routeHref('contact')}" data-route="contact" class="btn btn-primary">Visit a branch</a>
                <a href="${routeHref('products')}" data-route="products" class="btn btn-outline">See every cart</a>
            </div>
        </section>
    `;
}

function handleContactSubmit(e) {
    e.preventDefault();
    e.target.reset();
    showToast(`Message sent. Your reference is QT-${Math.floor(100000 + Math.random() * 900000)}.`);
}

function renderContactPage() {
    return `
        <section class="max-w-site mx-auto px-5 sm:px-8 lg:px-12 pt-16 lg:pt-24">
            <p class="text-sm text-mute">Contact</p>
            <div class="grid lg:grid-cols-12 gap-8 lg:gap-12 items-end mt-4">
                <h1 class="type-xl text-ink lg:col-span-7">Talk to us.</h1>
                <div class="lg:col-span-5 space-y-2">
                    <p class="measure">Individual purchases, fleets, service or dealer partnerships.</p>
                    <p><a href="mailto:info@golfcarts.ph" class="link">info@golfcarts.ph</a> · <a href="tel:+63277455089" class="link">(02) 7745-5089</a></p>
                </div>
            </div>
        </section>

        <section class="home-section max-w-site mx-auto px-5 sm:px-8 lg:px-12 grid lg:grid-cols-12 gap-12" aria-labelledby="contact-form-title">
            <h2 id="contact-form-title" class="type-lg text-ink lg:col-span-4">Send a message.</h2>
            <form onsubmit="handleContactSubmit(event)" class="lg:col-span-7 lg:col-start-6 grid sm:grid-cols-2 gap-x-6 gap-y-5">
                <div class="field"><label for="ct-name">Full name</label><input id="ct-name" required type="text" autocomplete="name"></div>
                <div class="field"><label for="ct-company">Company (optional)</label><input id="ct-company" type="text" autocomplete="organization"></div>
                <div class="field"><label for="ct-email">Email</label><input id="ct-email" required type="email" autocomplete="email"></div>
                <div class="field"><label for="ct-phone">Phone</label><input id="ct-phone" required type="tel" autocomplete="tel" placeholder="+63 900 000 0000"></div>
                <div class="field sm:col-span-2"><label for="ct-model">Model (optional)</label>
                    <select id="ct-model">
                        <option value="">No model in mind yet</option>
                        ${PRODUCTS_DATA.filter(p => p.category !== 'Accessories').map(p => `<option value="${p.slug}">${p.name} (${categoryLabel(p.category)})</option>`).join('')}
                    </select>
                </div>
                <div class="field sm:col-span-2"><label for="ct-message">Message</label><textarea id="ct-message" rows="5" placeholder="Colors, accessories, fleet size, delivery location"></textarea></div>
                <div class="sm:col-span-2"><button type="submit" class="btn btn-primary">Send message</button></div>
            </form>
        </section>

        ${renderBranchMap('contact-branches')}
    `;
}
