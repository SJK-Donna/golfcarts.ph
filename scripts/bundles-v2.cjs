// One-time conversion (2026-11-18): the Bundles sheet into the admin's own bundles (supabase/schema.sql,
// bundle_items / bundle_builds / bundle_options / bundle_option_items).
//   node scripts/bundles-v2.cjs <Bundles.xlsx>
// Writes supabase/private/bundles-v2-data.sql (costs: private, git ignores the folder) and prints a review list. It
// never prints an amount. Safe to run again: rows already in the database are left as they are (the admin is the
// place bundles are kept now), so a second run only adds what's missing.
//
// The sheet: Product, Config, Type, Part, Option, Description, SKU, Qty, USD, and "Pesos" beside the amount for a
// local part (its amount is in pesos). Competitor rows are price references, not builds: left out.
// Defaults (what a build includes when nothing else is chosen; the admin can change any):
//   - Unit, 2+2 kit, Stretch kit: always (the first option when there are several)
//   - Body, Seat, Canopy, Wheels, Windshield, Bag cover, Light: the sheet's first option
//   - Battery: lithium on Pro and Elite, lead-acid (FLA) on the rest
//   - Speed code: on Pro and Elite (the Versions PDF includes it there)
//   - Everything else is an upgrade: no default, only when chosen
const fs = require('fs');
const path = require('path');
const ExcelJS = require(path.join(process.cwd(), 'node_modules/exceljs'));

const txt = v => v == null ? '' : v.richText ? v.richText.map(t => t.text).join('') : typeof v === 'object' ? String(v.result ?? '') : String(v);
const num = v => typeof v === 'number' ? v : v && typeof v.result === 'number' ? v.result : null;
const lit = v => v == null ? 'null' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`;
const clean = s => String(s || '').replace(/\s+/g, ' ').trim();

const ALWAYS = new Set(['unit', '2+2 kit', 'stretch kit']);
const FIRST = new Set(['body', 'seat', 'canopy', 'wheel', 'windshield', 'bag cover', 'light']);
const TOP = new Set(['pro', 'elite']);
const COLOURS = ['white', 'black', 'beige', 'gray', 'camello', 'green', 'platinum', 'sapphire', 'sangria', 'cashmere', 'blue', 'red', 'brown', 'honey', 'silver', 'tan', 'violet'];
const colourWords = s => new Set(String(s).toLowerCase().replace(/grey/g, 'gray').split(/[^a-z]+/).filter(w => COLOURS.includes(w)));

(async () => {
    const file = process.argv[2];
    if (!file) { console.error('usage: node scripts/bundles-v2.cjs <Bundles.xlsx>'); process.exit(1); }
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(file);
    const sheet = wb.getWorksheet('Bundles');
    const items = new Map();   // key -> { sku, description, costs: Map(cost -> count), peso }
    const builds = new Map();  // product|config|type -> { product, config, type, sort, slots: Map(slot -> Map(option -> Map(itemKey -> qty))) }
    let competitor = 0, lines = 0, noCost = 0;
    sheet.eachRow((row, r) => {
        if (r === 1) return;
        const [product, config, type, part, option, description] = [1, 2, 3, 4, 5, 6].map(n => clean(txt(row.getCell(n).value)));
        if (!description) return;
        if (/^competitor$/i.test(product)) { competitor++; return; }
        if (!product || !config || !type || !part) return;
        lines++;
        let sku = clean(txt(row.getCell(7).value));
        if (sku === '-' || /^#N\/A$/i.test(sku)) sku = '';
        const qty = num(row.getCell(8).value) || 1;
        const cost = num(row.getCell(9).value);
        const peso = /pesos?/i.test(txt(row.getCell(10).value));
        if (cost == null) noCost++;
        const key = `${sku}|${description}`;
        if (!items.has(key)) items.set(key, { sku, description, costs: new Map(), peso: false });
        const it = items.get(key);
        if (cost != null) it.costs.set(cost, (it.costs.get(cost) || 0) + 1);
        it.peso = it.peso || peso;
        const bk = `${product}|${config}|${type}`;
        if (!builds.has(bk)) builds.set(bk, { product, config, type, sort: r, slots: new Map() });
        const slots = builds.get(bk).slots;
        if (!slots.has(part)) slots.set(part, new Map());
        const opt = option || part;
        if (!slots.get(part).has(opt)) slots.get(part).set(opt, new Map());
        const its = slots.get(part).get(opt);
        its.set(key, (its.get(key) || 0) + qty);
    });

    // Two shapes the sheet uses that the builder can't (2026-11-18):
    //   - Wheels: "wheel cover" is its own option beside "8in", but it's part of the 8" steel rims: folded into it
    //   - Light: one option ("GC light") lists the light kits to pick one of: each kit becomes its own option
    for (const b of builds.values()) {
        for (const [slot, opts] of b.slots) {
            const s = slot.toLowerCase();
            if (s === 'wheel') {
                const cover = [...opts.keys()].find(n => /cover/i.test(n));
                const rims = [...opts.keys()].find(n => /^8\s*in/i.test(n));
                if (cover && rims) { opts.get(cover).forEach((q, k) => opts.get(rims).set(k, (opts.get(rims).get(k) || 0) + q)); opts.delete(cover); }
            }
            if (s === 'light') {
                const split = new Map();
                for (const [opt, its] of opts) {
                    if (its.size < 2) { split.set(opt, its); continue; }
                    for (const [k, q] of its) split.set(items.get(k).description, new Map([[k, q]]));
                }
                b.slots.set(slot, split);
            }
        }
    }

    const review = [];
    const out = [
        '-- The admin\'s own bundles, loaded once from the Bundles sheet (scripts/bundles-v2.cjs, 2026-11-18).',
        '-- Run after supabase/schema.sql. PRIVATE: holds costs. Do not commit or share. Safe to run again (adds only what is missing).',
        'begin;'
    ];
    // Items: the cost most of its lines have
    let costsDiffer = 0;
    for (const it of items.values()) {
        const ranked = [...it.costs].sort((a, b) => b[1] - a[1]);
        it.cost = ranked.length ? ranked[0][0] : null;
        if (ranked.length > 1) { costsDiffer++; review.push(`Item "${it.description}"${it.sku ? ` (${it.sku})` : ''}: ${ranked.length} different costs across builds; the most common was used`); }
        if (!it.sku) review.push(`Item "${it.description}": no SKU`);
        out.push(`insert into public.bundle_items (sku, description, cost, currency) values (${lit(it.sku)}, ${lit(it.description)}, ${lit(it.cost)}, '${it.peso ? 'PHP' : 'USD'}') on conflict (sku, description) do nothing;`);
    }
    let options = 0, links = 0;
    for (const b of builds.values()) {
        out.push(`insert into public.bundle_builds (product, config, type, sort) values (${lit(b.product)}, ${lit(b.config)}, ${lit(b.type)}, ${b.sort}) on conflict (product, config, type) do nothing;`);
        const name = `${b.product} / ${b.config} / ${b.type}`;
        const top = TOP.has(b.type.toLowerCase());
        let slotSort = 0;
        if (top && ![...b.slots.keys()].some(s => /light/i.test(s))) review.push(`${name}: no Light slot, though ${b.type} includes lights (Club Car Tempo Deluxe Light Kit)`);
        for (const [slot, opts] of b.slots) {
            const s = slot.toLowerCase();
            const names = [...opts.keys()];
            let def = null;
            if (ALWAYS.has(s) || FIRST.has(s)) def = names[0];
            else if (s === 'battery') def = names.find(n => (top ? /lithium/i : /fla|lead/i).test(n)) || names[0];
            else if (s === 'speed code' && top) def = names[0];
            slotSort += 10;
            let optSort = 0;
            for (const [opt, its] of opts) {
                optSort += 10;
                options++;
                // A default only where the slot has none yet (a second run, or a slot changed in the admin, keeps its own)
                out.push(`insert into public.bundle_options (build_id, slot, option, is_default, sort) select b.id, ${lit(slot)}, ${lit(opt)}, ${opt === def ? `not exists (select 1 from public.bundle_options x where x.build_id = b.id and lower(x.slot) = lower(${lit(slot)}) and x.is_default)` : 'false'}, ${slotSort * 100 + optSort} from public.bundle_builds b where b.product = ${lit(b.product)} and b.config = ${lit(b.config)} and b.type = ${lit(b.type)} on conflict (build_id, slot, option) do nothing;`);
                let itemSort = 0;
                for (const [key, qty] of its) {
                    const it = items.get(key);
                    itemSort += 10;
                    links++;
                    out.push(`insert into public.bundle_option_items (option_id, item_id, qty, sort) select o.id, i.id, ${qty}, ${itemSort} from public.bundle_options o join public.bundle_builds b on b.id = o.build_id join public.bundle_items i on i.sku = ${lit(it.sku)} and i.description = ${lit(it.description)} where b.product = ${lit(b.product)} and b.config = ${lit(b.config)} and b.type = ${lit(b.type)} and o.slot = ${lit(slot)} and o.option = ${lit(opt)} on conflict (option_id, item_id) do nothing;`);
                    // A colour option bringing a part of another colour (Camello -> Seat Back White)
                    if (['body', 'seat', 'canopy'].includes(s)) {
                        const want = colourWords(opt);
                        const has = [...colourWords(it.description)].filter(w => !want.has(w));
                        if (want.size && has.length) review.push(`${name} / ${slot} / ${opt}: brings "${it.description}"${it.sku ? ` (${it.sku})` : ''}, a ${has.join('/')} part`);
                    }
                }
            }
        }
    }
    out.push('commit;', '');
    const target = path.join(process.cwd(), 'supabase/private/bundles-v2-data.sql');
    fs.writeFileSync(target, out.join('\n'));
    console.log(`Sheet lines ${lines} (competitor rows left out: ${competitor}; lines without a cost: ${noCost})`);
    console.log(`Items ${items.size} (local, in pesos: ${[...items.values()].filter(i => i.peso).length}); builds ${builds.size}; options ${options}; option parts ${links}`);
    console.log(`Wrote ${path.relative(process.cwd(), target)}`);
    console.log(`\nREVIEW (${review.length}):`);
    review.forEach(l => console.log('  - ' + l));
    // Defaults per build, for the person checking
    console.log('\nDEFAULTS:');
    for (const b of builds.values()) {
        const top = TOP.has(b.type.toLowerCase());
        const defs = [];
        for (const [slot, opts] of b.slots) {
            const s = slot.toLowerCase(), names = [...opts.keys()];
            const def = ALWAYS.has(s) || FIRST.has(s) ? names[0] : s === 'battery' ? names.find(n => (top ? /lithium/i : /fla|lead/i).test(n)) || names[0] : s === 'speed code' && top ? names[0] : null;
            if (def) defs.push(`${slot}: ${def}`);
        }
        console.log(`  ${b.product} / ${b.config} / ${b.type}: ${defs.join('; ')}`);
    }
})();
