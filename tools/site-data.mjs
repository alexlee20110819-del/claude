/* Content for the Thomson & Foley site. Edit here, then `npm run build:site`. */

export const BIZ = {
  name: 'Thomson & Foley Property Maintenance',
  short: 'Thomson & Foley',
  tagline: 'Property Maintenance',
  phone: '0468 373 784',
  phoneHref: 'tel:+61468373784',
  email: 'thomson.foley@outlook.com',
  facebook: 'https://www.facebook.com/thomsonandfoleypropertymaintenance',
  google: 'https://www.google.com/maps/place/?q=place_id:ChIJ_1pjLMphCEARb36NmRuNtzg',
  // Absolute base for canonical URLs, Open Graph and the sitemap. Change this
  // (and rebuild) the day a custom domain is pointed at the deployment —
  // leaving it wrong tells search engines the real page is somewhere else.
  origin: 'https://thomson-and-foley-property-maintenance.vercel.app',
  area: 'Bargara, Bundaberg and surrounding areas',
  rating: 5.0,
  reviewCount: 15,
  // Point this at your form handler (Formspree, a Worker, Netlify Forms, …).
  // Left empty the form opens a pre-filled email instead of silently failing.
  formEndpoint: '',
};

export const NAV = [
  { href: 'index.html', label: 'Home' },
  { href: 'about.html', label: 'About' },
  { href: 'services.html', label: 'Services' },
  { href: 'gallery.html', label: 'Work' },
  { href: 'reviews.html', label: 'Reviews' },
];

export const SERVICES = [
  { id: 'lawn-mowing', img: 'srv-mowing', tile: 'tile-mowing', n: '01',
    title: 'Lawn mowing & edging', short: 'Lawn mowing & edging',
    tileCopy: 'Regular mows or a one-off cut, edges run out and the paths blown down after.',
    alt: 'A wide back lawn mown in even stripes behind a home',
    tileAlt: 'A mown strip of lawn with a cut edge along a concrete path',
    lead: 'Regular mows on a schedule that suits you, or a one-off cut when it has got ahead of you. Edges run out along the paths and driveway, and the hard surfaces blown down before they leave.',
    ticks: ['Push and ride-on mowing to suit the block', 'Edges cut along paths, drives and beds', 'Clippings managed and paths blown down', 'Weekly, fortnightly or one-off'] },
  { id: 'garden-tidy-ups', img: 'srv-tidy', tile: 'tile-garden', n: '02',
    title: 'Full garden tidy-ups', short: 'Garden tidy-ups',
    tileCopy: 'Weeds out, beds cleared, mulch topped up and the whole yard brought back.',
    alt: 'A front garden of shaped shrubs and mulched beds beside a mown lawn',
    tileAlt: 'A garden bed of cordylines and palms beside a mown lawn',
    lead: 'The whole yard brought back in one go. Weeds pulled and treated, beds cleared out, overgrowth cut back and the mulch topped up so the garden looks planted rather than neglected.',
    ticks: ['Weeds removed by hand and treated', 'Beds cleared, raked and reshaped', 'Overgrowth cut back to a clean line', 'Good before an inspection or a sale'] },
  { id: 'tree-pruning', img: 'srv-pruning', tile: 'tile-tree', n: '03',
    title: 'Tree pruning', short: 'Tree pruning',
    tileCopy: 'Palms, hedges and overgrown branches cut back and cleared off the property.',
    alt: 'Cut branches carried across a yard toward a fence line',
    tileAlt: 'Palm trunks cut back beside a fence line',
    lead: 'Pruning for the trees and palms that have grown into the house, the fence or the view. Cut back safely, cut up on site, and carried off the property rather than stacked in a corner.',
    ticks: ['Palms, shrubs and small trees pruned back', 'Light tree removal where it makes sense', 'Cut up on site and loaded out', 'Storm damage and dropped branches cleared'] },
  { id: 'hedge-trimming', img: 'srv-hedge', n: '04',
    title: 'Hedge trimming', short: 'Hedge trimming',
    alt: 'A trimmed hedge running along a brick driveway in front of a home',
    lead: 'Hedges shaped back to an even line and a flat top, then the drop cleaned up off the lawn, the path and the garden bed underneath so nothing is left behind.',
    ticks: ['Shaped to a straight, even line', 'Screening hedges kept to height', 'Clippings raked and removed', 'One-off or on a regular round'] },
  { id: 'green-waste-removal', img: 'srv-waste', n: '05',
    title: 'Green waste removal', short: 'Green waste removal',
    alt: 'A tandem trailer loaded high with cut branches and garden waste',
    lead: 'The part most people care about. Prunings, clippings, cleared beds and old garden rubbish loaded onto the trailer and taken away, including the pile that has been sitting there a while.',
    ticks: ['Loaded and taken away the same visit', 'Dump runs for an existing pile', 'Clean-ups after storms or a big prune', 'Nothing left stacked in a corner'] },
  { id: 'mulch-installs', img: 'srv-mulch', n: '06',
    title: 'Mulch installs', short: 'Mulch installs',
    alt: 'A mulched garden bed with palms and tall plants against a fence',
    lead: 'Fresh mulch through the beds to finish a tidy-up, hold the moisture in through a hot Queensland summer and keep the weeds down for longer.',
    ticks: ['Beds prepared and edged first', 'Mulch spread to an even depth', 'Finishes a garden clean-up properly', 'Keeps weeds and watering down'] },
  { id: 'light-landscaping', img: 'srv-landscape', n: '07',
    title: 'Light landscaping', short: 'Light landscaping',
    alt: 'A front yard with pavers, a small tree and a planted bed beside the house',
    lead: 'The smaller shaping work that lifts a yard. Reworking a tired bed, planting out a bare patch, edging and tidying the lines so the garden reads as designed rather than grown.',
    ticks: ['Beds reshaped and re-edged', 'Planting out bare spots', 'Rock, bark and border work', 'Small jobs, no big project needed'] },
  { id: 'acreage-mowing', img: 'srv-acreage', tile: 'tile-acreage', n: '08',
    title: 'Vacant blocks & acreage', short: 'Blocks & acreage',
    tileCopy: 'Big open ground knocked down with the ride-on, however long it has been left.',
    alt: 'Long grass ahead of a mower cutting across a large open block',
    tileAlt: 'An open block of grass at first light with a fence line behind',
    lead: 'Big open ground knocked down with the ride-on. Vacant blocks, acreage and paddocks that have been left long enough that a push mower is not going to do it.',
    ticks: ['Vacant blocks cut and cleared', 'Acreage mowing on larger properties', 'Long grass taken back in one pass', 'Good for agents, owners and absent landlords'] },
];

export const REVIEWS = [
  { name: 'Kaylene Collins', src: 'Google review', stars: 5, feature: true,
    text: 'We can’t thank Leo &amp; Chantel enough for the hard work sorting out our palm trees for us. They had excellent communication prior &amp; during the job. Very prompt, professional &amp; friendly service. Also were very particular about the condition that they left the job area in on completion. Can’t recommend them enough for any yard maintenance requirements. Will definitely be calling on them again.' },
  { name: 'Andrew Milliken', src: 'Google review', stars: 5,
    text: 'Awesome work, very professional and punctual, 100% recommended' },
  { name: 'Danika Sandling', src: 'Google review', stars: 5,
    text: 'Great service, lovely people. Done an amazing job, managed to remove much more green waste then we expected. Extremely thankful' },
  { name: 'Lee-Anne Hammer', src: 'Facebook recommendation', stars: 0,
    text: 'Did a great job, professional service. Leo and Chantel are friendly and reliable, they left our yard spic and span. We would definitely get them back again.' },
  { name: 'Caitlin L', src: 'Google review', stars: 5,
    text: 'Great job! Listened to what I asked for and went above and beyond! Will contact for future jobs!' },
  { name: 'Callum Caple', src: 'Google review', stars: 5,
    text: 'Has the equipment and the know how to use it all at a reasonable price.' },
  { name: 'elena gibson', src: 'Google review', stars: 5,
    text: 'Leo has been amazing. Has gone out of his way many times when I’ve called on him last minute. Extremely hardworking and honest. Would highly recommend him' },
  { name: 'Ron Small', src: 'Google review', stars: 5,
    text: 'My name is Ron Small and i live in Bargara we had Thomson &amp; Foley Property Maintenance come and do some work for us,, we got them to prune Golden cane palms and various other trees and shrubs and Tiger grass plants in the back yard and also the front yard when they finished that i got them to put Cyprus pine bark in the garden beds to finish off,, i cannot say enough on how much of a great job they did for me the yard looks a million dollars i would highly recommend these two young people for future reference, nothing was a problem with them thank you very much' },
  { name: 'Dane Starr', src: 'Google review', stars: 5,
    text: 'Amazing service, fair pricing. Highly recommend... Leo and Chantel did a great job and they even let my 7yr old be their helper. Beautiful people and beautiful work, thank you both xoxo' },
  { name: 'Max Lamond', src: 'Google review', stars: 5,
    text: 'Highly recommend Leo very affordable, quick &amp; efficient and did a great job he even cut everything up to fit in the fire' },
  { name: 'Skye Hamblin', src: 'Google review', stars: 5,
    text: 'We got a reasonable quote from Thomson &amp; Foley to do some Lawn mowing &amp; weeds removal in the front garden. After removing the weeds by hand, he raked out all the sticks &amp; leafs from the under growth before applying his roundup mix. The front yard is very clean &amp; presentable now. Thanks guys' },
  { name: 'Hudson Murphy Beattie', src: 'Google review', stars: 5,
    text: 'Highly recommend Leo &amp; his partner at Thomson &amp; Foley Property maintenance for any gardening jobs. Very safe &amp; professional. We were quoted a great price for his tree pruning, palm tree removal &amp; lawn mowing services. The lawn is now looking clean, the edging looking sharp &amp; no more messy palm trees in the front yard.' },
  { name: 'Theresa Barry', src: 'Google review', stars: 5,
    text: 'What a pleasant, reliable and pleasant couple run this business. Unfortunately with the strong winds we had a branch snapped off and so much to get rid of. Messaged Thomson and Foley got a quick response and were here two days later. Also while here got them to cut down two palms which was dealt with with ease. Highly recommend if anyone needs plant removal or garden maintenance.' },
  { name: 'Ru Mackenzie', src: 'Google review', stars: 5,
    text: 'Highly recommend, super helpful, caring, and efficient. Appreciate the work above and beyond, will keep the contact for next time. Thanks' },
  { name: 'Mike Roberts', src: 'Facebook recommendation', stars: 0,
    text: 'Thanks guys!! Awesome job. Quick and reliable, highly recommended AAA+++' },
];

/* Gallery. `tags` drive the filter chips on the Work page. */
export const GALLERY = [
  ['w00', 'A ute and caged trailer parked at the kerb beside a freshly mown verge', 'clearing lawns'],
  ['w01', 'Long grass ahead of a mower being pushed across a block', 'lawns clearing'],
  ['w02', 'A person on a stand-on mower cutting a lawn beside a cordyline palm', 'lawns'],
  ['w03', 'A wide back lawn mown in even stripes behind a home', 'lawns'],
  ['w04', 'A mown lawn with a white flowering frangipani in the corner', 'lawns'],
  ['w05', 'A garden bed of cordylines and palms in front of a home', 'gardens'],
  ['w06', 'Curved concrete paths running through a mown front lawn', 'lawns'],
  ['w07', 'A mown nature strip running along a kerb toward the road', 'lawns'],
  ['w08', 'A front garden of shaped shrubs beside a mown lawn', 'gardens lawns'],
  ['w09', 'A shaped shrub bed topped with mulch beside a driveway', 'gardens'],
  ['w10', 'A round garden bed of shaped shrubs and mulch beside a rendered wall', 'gardens'],
  ['w11', 'A front yard with pavers, a small tree and a planted bed beside the house', 'gardens'],
  ['w12', 'A back lawn cut short with a garden bed along the fence', 'lawns'],
  ['w13', 'A mown nature strip beside a kerb and footpath', 'lawns'],
  ['w14', 'A mown strip of lawn with a cut edge along a concrete path', 'lawns'],
  ['w15', 'A hand holding a battery pruning tool in front of a lawn', 'pruning'],
  ['w16', 'Palm trunks cut back beside a fence line', 'pruning'],
  ['w17', 'A side yard of tropical planting beside a shed', 'gardens'],
  ['w18', 'A worker with a blower clearing beside a shed', 'clearing'],
  ['w19', 'A cleared side yard beside a timber fence with the bins moved back', 'clearing'],
  ['w20', 'A mown lawn either side of a concrete path', 'lawns'],
  ['w21', 'A driveway and garage in warm afternoon light beside a cut lawn', 'lawns'],
  ['w22', 'A timber fence line with the edge cut back along it', 'lawns clearing'],
  ['w23', 'A wide mown lawn in even stripes with palms along the back fence', 'lawns'],
  ['w24', 'A mulched garden bed with palms and tall plants against a fence', 'gardens'],
  ['w25', 'A mown lawn behind a white picket fence', 'lawns'],
  ['w26', 'A mown lawn with a white fence and a mower parked at the far side', 'lawns'],
  ['w27', 'A tandem trailer loaded high with cut branches and garden waste', 'clearing'],
  ['w28', 'Long grass ahead of a mower cutting across a large open block', 'lawns clearing'],
  ['w29', 'Cut branches carried across a yard toward a fence line', 'pruning clearing'],
];

export const GALLERY_FILTERS = [
  ['all', 'Everything'], ['lawns', 'Lawns & edges'], ['gardens', 'Garden beds'],
  ['pruning', 'Pruning & palms'], ['clearing', 'Clean-ups & waste'],
];

export const FAQ_HOME = [
  ['How much will it cost?', 'Every yard is different, so you get a free quote first and a price before anything starts. Send a photo or have them come and look. No obligation either way.'],
  ['Do you do regular visits or one-off jobs?', 'Both. Plenty of customers are on a regular mow, and just as many book a one-off tidy-up, a pruning job or a clean-up before an inspection.'],
  ['What areas do you cover?', 'Bargara, Bundaberg and surrounding areas. If you are close by and not sure, just ask.'],
  ['Do you take the green waste away?', 'Yes. Green waste removal is part of what they do, so the clippings, prunings and cleared beds go on the trailer and leave with them.'],
  ['Can you handle a block that has been left a while?', 'Yes. Vacant blocks and acreage are on the list, and long grass, overgrown beds and palms that have got away are normal work rather than a special case.'],
];

export const FAQ_SERVICES = [
  ['Can you do a mix of jobs in one visit?', 'Yes, and that is usually how it works. A mow, a prune and a bed clear-out get quoted together and done in the same visit.'],
  ['Do you mow acreage and vacant blocks?', 'Yes. Vacant block and acreage mowing is part of what they do, so a big block that has been left long is normal work.'],
  ['What happens to the green waste?', 'It goes on the trailer and leaves with them. Green waste removal is one of the listed services, including an existing pile you want gone.'],
  ['Do you work for landlords and agents?', 'Yes. Tidy-ups before an inspection, between tenants or ahead of a sale are common jobs, and photos can be sent through afterwards.'],
  ['How soon can you get out?', 'Usually within a few days, and sooner when something has come up. Call or text and you will hear back quickly with a time that works.'],
];

export const STEPS = [
  ['01', 'Tell them what you need', 'Call, text or send a photo of the yard. A rough idea of the block size helps.'],
  ['02', 'Get a price', 'A free quote, on site if it needs a look. You know the number before anything starts.'],
  ['03', 'They do the work', 'Mow, prune, clear, mulch. Whatever the job was quoted for gets finished in the visit.'],
  ['04', 'The mess leaves too', 'Green waste on the trailer, paths blown down, the area left the way you would want it.'],
];

export const AREAS = ['Bargara', 'Bundaberg', 'Innes Park', 'Coral Cove', 'Burnett Heads', 'Elliott Heads',
  'Moore Park Beach', 'Bundaberg North', 'Bundaberg East', 'Kalkie', 'Ashfield', 'Avoca', 'Branyan',
  'Qunaba', 'Windermere', 'and surrounding areas'];
