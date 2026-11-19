-- Adds the "Shop now: our rebuilds" video as the last banner of the saved homepage carousel (2026-11-18).
-- The carousel saved in Admin -> Site content replaces the code's list, so a banner added in code only shows
-- once it is in the saved carousel too. Safe to run again: it adds the banner only if it isn't there yet.
update public.site_edits
set value = jsonb_set(
    value,
    '{slides}',
    coalesce(value -> 'slides', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
        'image', 'image/Hero/hero-rebuilds.jpg',
        'video', 'image/Hero/hero-rebuilds.mp4',
        'alt', 'Shop now: reman or your cart? Browse our reman golf carts and find the one that fits your game.',
        'cta', 'Shop Our Rebuilds',
        'route', 'segment',
        'slug', 'remanufactured'
    ))
)
where key = 'banners'
  and not coalesce(value -> 'slides', '[]'::jsonb) @> '[{"video": "image/Hero/hero-rebuilds.mp4"}]'::jsonb;

-- Check: the last banner should be the video
-- select jsonb_array_length(value -> 'slides') as banners, value -> 'slides' -> -1 ->> 'cta' as last from public.site_edits where key = 'banners';
