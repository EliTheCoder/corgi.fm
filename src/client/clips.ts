import {List} from 'immutable'
import {logger} from '../common/logger'
import {makeMidiClip} from './note-scheduler'

export const postalClipA = makeMidiClip({
	length: 200,
	loop: true,
	events: List([
		{
			startBeat: 261,
			note: 56,
		},
		{
			startBeat: 261,
			note: 41,
		},
		{
			startBeat: 17029,
			note: 60,
		},
		{
			startBeat: 17029,
			note: 46,
		},
		{
			startBeat: 17125,
			note: 61,
		},
		{
			startBeat: 17221,
			note: 60,
		},
		{
			startBeat: 17317,
			note: 46,
		},
		{
			startBeat: 17413,
			note: 55,
		},
		{
			startBeat: 17413,
			note: 40,
		},
		{
			startBeat: 17605,
			note: 55,
		},
		{
			startBeat: 17605,
			note: 40,
		},
		{
			startBeat: 34565,
			note: 65,
		},
		{
			startBeat: 34565,
			note: 41,
		},
		{
			startBeat: 34661,
			note: 48,
		},
		{
			startBeat: 34757,
			note: 53,
		},
		{
			startBeat: 34853,
			note: 46,
		},
		{
			startBeat: 34949,
			note: 58,
		},
		{
			startBeat: 34949,
			note: 48,
		},
		{
			startBeat: 35141,
			note: 58,
		},
		{
			startBeat: 35141,
			note: 48,
		},
		{
			startBeat: 52005,
			note: 53,
		},
		{
			startBeat: 52053,
			note: 56,
		},
		{
			startBeat: 52101,
			note: 63,
		},
		{
			startBeat: 52101,
			note: 49,
		},
		{
			startBeat: 68677,
			note: 61,
		},
		{
			startBeat: 85253,
			note: 60,
		},
		{
			startBeat: 85253,
			note: 48,
		},
		{
			startBeat: 85349,
			note: 61,
		},
		{
			startBeat: 85445,
			note: 60,
		},
		{
			startBeat: 85541,
			note: 48,
		},
		{
			startBeat: 85637,
			note: 56,
		},
		{
			startBeat: 85637,
			note: 41,
		},
		{
			startBeat: 85829,
			note: 56,
		},
		{
			startBeat: 85829,
			note: 41,
		},
		{
			startBeat: 102597,
			note: 60,
		},
		{
			startBeat: 102597,
			note: 46,
		},
		{
			startBeat: 102693,
			note: 61,
		},
		{
			startBeat: 102789,
			note: 60,
		},
		{
			startBeat: 102885,
			note: 46,
		},
		{
			startBeat: 102981,
			note: 55,
		},
		{
			startBeat: 102981,
			note: 40,
		},
		{
			startBeat: 103173,
			note: 55,
		},
		{
			startBeat: 103173,
			note: 40,
		},
	])
		.map(x => ({...x, startBeat: x.startBeat / 261})),
})

// console.log('postalClipA: ', postalClipA.toJS())

export const shortDemoMidiClip = makeMidiClip({
	length: 2,
	loop: true,
	events: List([
		{
			startBeat: 0,
			note: 60,
		},
		{
			startBeat: 0,
			note: 48,
		},
		{
			startBeat: 1 / 4,
			note: 64,
		},
		{
			startBeat: 2 / 4,
			note: 67,
		},
		{
			startBeat: 3 / 4,
			note: 71,
		},
		{
			startBeat: 4 / 4,
			note: 72,
		},
		{
			startBeat: 5 / 4,
			note: 71,
		},
		{
			startBeat: 6 / 4,
			note: 67,
		},
		{
			startBeat: 7 / 4,
			note: 64,
		},
	]),
})

export const longDemoMidiClip = makeMidiClip({
	length: 8,
	loop: true,
	events: List([
		{
			startBeat: 0,
			note: 60,
		},
		{
			startBeat: 1 / 4,
			note: 64,
		},
		{
			startBeat: 2 / 4,
			note: 67,
		},
		{
			startBeat: 3 / 4,
			note: 71,
		},
		{
			startBeat: 4 / 4,
			note: 72,
		},
		{
			startBeat: 5 / 4,
			note: 71,
		},
		{
			startBeat: 6 / 4,
			note: 67,
		},
		{
			startBeat: 7 / 4,
			note: 64,
		},
		{
			startBeat: 0 + 2,
			note: 60,
		},
		{
			startBeat: 1 / 8 + 2,
			note: 64,
		},
		{
			startBeat: 2 / 8 + 2,
			note: 67,
		},
		{
			startBeat: 3 / 8 + 2,
			note: 71,
		},
		{
			startBeat: 4 / 8 + 2,
			note: 72,
		},
		{
			startBeat: 5 / 8 + 2,
			note: 71,
		},
		{
			startBeat: 6 / 8 + 2,
			note: 67,
		},
		{
			startBeat: 7 / 8 + 2,
			note: 64,
		},
		{
			startBeat: 0 + 3,
			note: 60,
		},
		{
			startBeat: 1 / 8 + 3,
			note: 64,
		},
		{
			startBeat: 2 / 8 + 3,
			note: 67,
		},
		{
			startBeat: 3 / 8 + 3,
			note: 71,
		},
		{
			startBeat: 4 / 8 + 3,
			note: 72,
		},
		{
			startBeat: 5 / 8 + 3,
			note: 71,
		},
		{
			startBeat: 6 / 8 + 3,
			note: 67,
		},
		{
			startBeat: 7 / 8 + 3,
			note: 64,
		},
		{
			startBeat: 0 / 16 + 4,
			note: 60,
		},
		{
			startBeat: 1 / 16 + 4,
			note: 64,
		},
		{
			startBeat: 2 / 16 + 4,
			note: 67,
		},
		{
			startBeat: 3 / 16 + 4,
			note: 71,
		},
		{
			startBeat: 4 / 16 + 4,
			note: 72,
		},
		{
			startBeat: 5 / 16 + 4,
			note: 71,
		},
		{
			startBeat: 6 / 16 + 4,
			note: 67,
		},
		{
			startBeat: 7 / 16 + 4,
			note: 64,
		},
		{
			startBeat: 8 / 16 + 4,
			note: 60,
		},
		{
			startBeat: 9 / 16 + 4,
			note: 64,
		},
		{
			startBeat: 10 / 16 + 4,
			note: 67,
		},
		{
			startBeat: 11 / 16 + 4,
			note: 71,
		},
		{
			startBeat: 12 / 16 + 4,
			note: 72,
		},
		{
			startBeat: 13 / 16 + 4,
			note: 71,
		},
		{
			startBeat: 14 / 16 + 4,
			note: 67,
		},
		{
			startBeat: 15 / 16 + 4,
			note: 64,
		},

		{
			startBeat: 0 / 3 + 6,
			note: 71,
		},
		{
			startBeat: 0 / 3 + 6,
			note: 67,
		},
		{
			startBeat: 0 / 3 + 6,
			note: 64,
		},

		{
			startBeat: 1 / 3 + 6,
			note: 71,
		},
		{
			startBeat: 1 / 3 + 6,
			note: 67,
		},
		{
			startBeat: 1 / 3 + 6,
			note: 64,
		},

		{
			startBeat: 2 / 3 + 6,
			note: 71,
		},
		{
			startBeat: 2 / 3 + 6,
			note: 67,
		},
		{
			startBeat: 2 / 3 + 6,
			note: 64,
		},

		{
			startBeat: 0 / 3 + 7,
			note: 74,
		},
		{
			startBeat: 0 / 3 + 7,
			note: 70,
		},
		{
			startBeat: 0 / 3 + 7,
			note: 67,
		},
	]),
})

export const postalClipB = makeMidiClip({
	length: 200,
	loop: true,
	events: List([
		{startBeat: 181441, note: 72},
		{startBeat: 197953, note: 74},
		{startBeat: 214593, note: 67},
		{startBeat: 231105, note: 66},
		{startBeat: 231233, note: 67},
		{startBeat: 247873, note: 79},
		{startBeat: 264513, note: 62},
		{startBeat: 264513, note: 69},
		{startBeat: 264513, note: 78},
		{startBeat: 281153, note: 76},
		{startBeat: 297665, note: 78},
		{startBeat: 314177, note: 74},
		{startBeat: 330817, note: 69},
		{startBeat: 347329, note: 71},
		{startBeat: 363841, note: 72},
		{startBeat: 380481, note: 66},
		{startBeat: 396993, note: 64},
		{startBeat: 413505, note: 66},
		{startBeat: 430145, note: 74},
		{startBeat: 446785, note: 55},
		{startBeat: 446785, note: 62},
		{startBeat: 446785, note: 72},
		{startBeat: 463297, note: 71},
		{startBeat: 463425, note: 69},
		{startBeat: 463553, note: 71},
		{startBeat: 463681, note: 67},
		{startBeat: 480321, note: 79},
		{startBeat: 496833, note: 78},
		{startBeat: 496961, note: 76},
		{startBeat: 513473, note: 78},
		{startBeat: 513601, note: 79},
		{startBeat: 513729, note: 74},
		{startBeat: 530241, note: 73},
		{startBeat: 546753, note: 78},
		{startBeat: 546881, note: 79},
		{startBeat: 547009, note: 71},
		{startBeat: 563521, note: 69},
		{startBeat: 580033, note: 78},
		{startBeat: 580161, note: 79},
		{startBeat: 580289, note: 67},
		{startBeat: 596801, note: 66},
		{startBeat: 613313, note: 69},
		{startBeat: 629825, note: 73},
		{startBeat: 646337, note: 76},
		{startBeat: 662849, note: 81},
		{startBeat: 679489, note: 78},
		{startBeat: 696001, note: 74},
		{startBeat: 712513, note: 69},
		{startBeat: 729153, note: 73},
		{startBeat: 745793, note: 74},
		{startBeat: 762433, note: 69},
		{startBeat: 779073, note: 62},
		{startBeat: 795713, note: 71},
		{startBeat: 812225, note: 72},
		{startBeat: 828737, note: 74},
		{startBeat: 845377, note: 67},
		{startBeat: 861889, note: 66},
		{startBeat: 862017, note: 67},
		{startBeat: 878657, note: 79},
		{startBeat: 895297, note: 62},
		{startBeat: 895297, note: 69},
		{startBeat: 895297, note: 78},
		{startBeat: 911937, note: 76},
		{startBeat: 928449, note: 78},
		{startBeat: 944961, note: 74},
		{startBeat: 961601, note: 69},
		{startBeat: 978113, note: 71},
		{startBeat: 994625, note: 72},
		{startBeat: 1011265, note: 66},
		{startBeat: 1027777, note: 64},
		{startBeat: 1044289, note: 66},
		{startBeat: 1060929, note: 74},
		{startBeat: 1077569, note: 55},
		{startBeat: 1077569, note: 62},
		{startBeat: 1077569, note: 72},
		{startBeat: 1094081, note: 71},
		{startBeat: 1094209, note: 69},
		{startBeat: 1094337, note: 71},
		{startBeat: 1094465, note: 67},
		{startBeat: 1111105, note: 79},
		{startBeat: 1127617, note: 78},
		{startBeat: 1127745, note: 76},
		{startBeat: 1144257, note: 78},
		{startBeat: 1144385, note: 79},
		{startBeat: 1144513, note: 74},
		{startBeat: 1161025, note: 73},
		{startBeat: 1177537, note: 78},
		{startBeat: 1177665, note: 79},
		{startBeat: 1177793, note: 71},
		{startBeat: 1194305, note: 69},
		{startBeat: 1210817, note: 78},
		{startBeat: 1210945, note: 79},
		{startBeat: 1211073, note: 67},
		{startBeat: 1227585, note: 66},
		{startBeat: 1244097, note: 69},
		{startBeat: 1260609, note: 73},
		{startBeat: 1277121, note: 76},
		{startBeat: 1293633, note: 81},
		{startBeat: 1310273, note: 78},
		{startBeat: 1326785, note: 74},
		{startBeat: 1343297, note: 69},
		{startBeat: 1359937, note: 73},
		{startBeat: 1376577, note: 74},
		{startBeat: 1393217, note: 69},
		{startBeat: 1409857, note: 62},
		{startBeat: 1426497, note: 78},
		{startBeat: 1443009, note: 79},
		{startBeat: 1459521, note: 81},
		{startBeat: 1476161, note: 78},
		{startBeat: 1492673, note: 74},
		{startBeat: 1509185, note: 72},
		{startBeat: 1525825, note: 78},
		{startBeat: 1542465, note: 71},
		{startBeat: 1558977, note: 74},
		{startBeat: 1559105, note: 79},
		{startBeat: 1559233, note: 81},
		{startBeat: 1575745, note: 83},
		{startBeat: 1592385, note: 79},
		{startBeat: 1608897, note: 75},
		{startBeat: 1625409, note: 76},
		{startBeat: 1642049, note: 72},
		{startBeat: 1658561, note: 76},
		{startBeat: 1675073, note: 69},
		{startBeat: 1691585, note: 79},
		{startBeat: 1708097, note: 78},
		{startBeat: 1708225, note: 76},
		{startBeat: 1708353, note: 71},
		{startBeat: 1724865, note: 76},
		{startBeat: 1741377, note: 75},
		{startBeat: 1757889, note: 73},
		{startBeat: 1774401, note: 71},
		{startBeat: 1791041, note: 78},
		{startBeat: 1807553, note: 71},
		{startBeat: 1807681, note: 79},
		{startBeat: 1824193, note: 76},
		{startBeat: 1840705, note: 75},
		{startBeat: 1840833, note: 76},
		{startBeat: 1840961, note: 78},
		{startBeat: 1857473, note: 71},
		{startBeat: 1857601, note: 79},
		{startBeat: 1874113, note: 71},
		{startBeat: 1874241, note: 81},
		{startBeat: 1890753, note: 78},
		{startBeat: 1907265, note: 76},
		{startBeat: 1907393, note: 78},
		{startBeat: 1907521, note: 79},
		{startBeat: 1924033, note: 71},
		{startBeat: 1924161, note: 81},
		{startBeat: 1940673, note: 69},
		{startBeat: 1940801, note: 67},
		{startBeat: 1957313, note: 83},
		{startBeat: 1973825, note: 78},
		{startBeat: 1990337, note: 79},
		{startBeat: 2006849, note: 71},
		{startBeat: 2023489, note: 76},
		{startBeat: 2040001, note: 75},
		{startBeat: 2040129, note: 76},
		{startBeat: 2056769, note: 71},
		{startBeat: 2073409, note: 64},
		{startBeat: 2090049, note: 76},
		{startBeat: 2106561, note: 78},
		{startBeat: 2123073, note: 79},
		{startBeat: 2139713, note: 73},
		{startBeat: 2156225, note: 71},
		{startBeat: 2156353, note: 73},
		{startBeat: 2172993, note: 69},
		{startBeat: 2189633, note: 62},
		{startBeat: 2206145, note: 69},
		{startBeat: 2206273, note: 79},
		{startBeat: 2206401, note: 76},
		{startBeat: 2222913, note: 78},
		{startBeat: 2239553, note: 74},
		{startBeat: 2256065, note: 72},
		{startBeat: 2272577, note: 71},
		{startBeat: 2289089, note: 74},
		{startBeat: 2305601, note: 79},
		{startBeat: 2322113, note: 71},
		{startBeat: 2338625, note: 69},
		{startBeat: 2355137, note: 84},
		{startBeat: 2371649, note: 83},
		{startBeat: 2388161, note: 79},
		{startBeat: 2404673, note: 81},
		{startBeat: 2421185, note: 79},
		{startBeat: 2437697, note: 78},
		{startBeat: 2454209, note: 76},
		{startBeat: 2470721, note: 74},
		{startBeat: 2487361, note: 78},
		{startBeat: 2503873, note: 79},
		{startBeat: 2520385, note: 81},
		{startBeat: 2536897, note: 78},
		{startBeat: 2537025, note: 74},
		{startBeat: 2537153, note: 76},
		{startBeat: 2553665, note: 78},
		{startBeat: 2570177, note: 74},
		{startBeat: 2570305, note: 69},
		{startBeat: 2570433, note: 71},
		{startBeat: 2586945, note: 72},
		{startBeat: 2603457, note: 69},
		{startBeat: 2603585, note: 66},
		{startBeat: 2603713, note: 67},
		{startBeat: 2620225, note: 69},
		{startBeat: 2636737, note: 66},
		{startBeat: 2636865, note: 62},
		{startBeat: 2636993, note: 72},
		{startBeat: 2653505, note: 71},
		{startBeat: 2670017, note: 67},
		{startBeat: 2670145, note: 62},
		{startBeat: 2670273, note: 74},
		{startBeat: 2686785, note: 71},
		{startBeat: 2703297, note: 67},
		{startBeat: 2703425, note: 62},
		{startBeat: 2703553, note: 79},
		{startBeat: 2720065, note: 74},
		{startBeat: 2736577, note: 71},
		{startBeat: 2736705, note: 72},
		{startBeat: 2753217, note: 69},
		{startBeat: 2753345, note: 71},
		{startBeat: 2769857, note: 67},
		{startBeat: 2769985, note: 62},
		{startBeat: 2786497, note: 71},
		{startBeat: 2803009, note: 69},
		{startBeat: 2819521, note: 71},
		{startBeat: 2819649, note: 72},
		{startBeat: 2819777, note: 67},
		{startBeat: 2836289, note: 66},
		{startBeat: 2852801, note: 71},
		{startBeat: 2852929, note: 72},
		{startBeat: 2853057, note: 64},
		{startBeat: 2869569, note: 62},
		{startBeat: 2886081, note: 71},
		{startBeat: 2886209, note: 72},
		{startBeat: 2886337, note: 60},
		{startBeat: 2902849, note: 59},
		{startBeat: 2919361, note: 62},
		{startBeat: 2935873, note: 66},
		{startBeat: 2952385, note: 69},
		{startBeat: 2968897, note: 74},
		{startBeat: 2985537, note: 71},
		{startBeat: 3002049, note: 67},
		{startBeat: 3018561, note: 62},
		{startBeat: 3035201, note: 66},
		{startBeat: 3051841, note: 55},
		{startBeat: 3051841, note: 67},
		{startBeat: 3085633, note: 71},
		{startBeat: 3102145, note: 72},
		{startBeat: 3118657, note: 74},
		{startBeat: 3135297, note: 67},
		{startBeat: 3151809, note: 66},
		{startBeat: 3151937, note: 67},
		{startBeat: 3168577, note: 79},
		{startBeat: 3185217, note: 62},
		{startBeat: 3185217, note: 69},
		{startBeat: 3185217, note: 78},
		{startBeat: 3201857, note: 76},
		{startBeat: 3218369, note: 78},
		{startBeat: 3234881, note: 74},
		{startBeat: 3251521, note: 69},
		{startBeat: 3268033, note: 71},
		{startBeat: 3284545, note: 72},
		{startBeat: 3301185, note: 66},
		{startBeat: 3317697, note: 64},
		{startBeat: 3334209, note: 66},
		{startBeat: 3350849, note: 74},
		{startBeat: 3367489, note: 55},
		{startBeat: 3367489, note: 62},
		{startBeat: 3367489, note: 72},
		{startBeat: 3384001, note: 71},
		{startBeat: 3384129, note: 69},
		{startBeat: 3384257, note: 71},
		{startBeat: 3384385, note: 67},
		{startBeat: 3401025, note: 79},
		{startBeat: 3417537, note: 78},
		{startBeat: 3417665, note: 76},
		{startBeat: 3434177, note: 78},
		{startBeat: 3434305, note: 79},
		{startBeat: 3434433, note: 74},
		{startBeat: 3450945, note: 73},
		{startBeat: 3467457, note: 78},
		{startBeat: 3467585, note: 79},
		{startBeat: 3467713, note: 71},
		{startBeat: 3484225, note: 69},
		{startBeat: 3500737, note: 78},
		{startBeat: 3500865, note: 79},
		{startBeat: 3500993, note: 67},
		{startBeat: 3517505, note: 66},
		{startBeat: 3534017, note: 69},
		{startBeat: 3550529, note: 73},
		{startBeat: 3567041, note: 76},
		{startBeat: 3583553, note: 81},
		{startBeat: 3600193, note: 78},
		{startBeat: 3616705, note: 74},
		{startBeat: 3633217, note: 69},
		{startBeat: 3649857, note: 73},
		{startBeat: 3666497, note: 74},
		{startBeat: 3683137, note: 69},
		{startBeat: 3699777, note: 62},
		{startBeat: 3716417, note: 78},
		{startBeat: 3732929, note: 79},
		{startBeat: 3749441, note: 81},
		{startBeat: 3766081, note: 78},
		{startBeat: 3782593, note: 74},
		{startBeat: 3799105, note: 72},
		{startBeat: 3815745, note: 78},
		{startBeat: 3832385, note: 71},
		{startBeat: 3848897, note: 74},
		{startBeat: 3849025, note: 79},
		{startBeat: 3849153, note: 81},
		{startBeat: 3865665, note: 83},
		{startBeat: 3882305, note: 79},
		{startBeat: 3898817, note: 75},
		{startBeat: 3915329, note: 76},
		{startBeat: 3931969, note: 72},
		{startBeat: 3948481, note: 76},
		{startBeat: 3964993, note: 69},
		{startBeat: 3981505, note: 79},
		{startBeat: 3998017, note: 78},
		{startBeat: 3998145, note: 76},
		{startBeat: 3998273, note: 71},
		{startBeat: 4014785, note: 76},
		{startBeat: 4031297, note: 75},
		{startBeat: 4047809, note: 73},
		{startBeat: 4064321, note: 71},
		{startBeat: 4080961, note: 78},
		{startBeat: 4097473, note: 71},
		{startBeat: 4097601, note: 79},
		{startBeat: 4114113, note: 76},
		{startBeat: 4130625, note: 75},
		{startBeat: 4130753, note: 76},
		{startBeat: 4130881, note: 78},
		{startBeat: 4147393, note: 71},
		{startBeat: 4147521, note: 79},
		{startBeat: 4164033, note: 71},
		{startBeat: 4164161, note: 81},
		{startBeat: 4180673, note: 78},
		{startBeat: 4197185, note: 76},
		{startBeat: 4197313, note: 78},
		{startBeat: 4197441, note: 79},
		{startBeat: 4213953, note: 71},
		{startBeat: 4214081, note: 81},
		{startBeat: 4230593, note: 69},
		{startBeat: 4230721, note: 67},
		{startBeat: 4247233, note: 83},
		{startBeat: 4263745, note: 78},
		{startBeat: 4280257, note: 79},
		{startBeat: 4296769, note: 71},
		{startBeat: 4313409, note: 76},
		{startBeat: 4329921, note: 75},
		{startBeat: 4330049, note: 76},
		{startBeat: 4346689, note: 71},
		{startBeat: 4363329, note: 64},
		{startBeat: 4379969, note: 76},
		{startBeat: 4396481, note: 78},
		{startBeat: 4412993, note: 79},
		{startBeat: 4429633, note: 73},
		{startBeat: 4446145, note: 71},
		{startBeat: 4446273, note: 73},
		{startBeat: 4462913, note: 69},
		{startBeat: 4479553, note: 62},
		{startBeat: 4496065, note: 69},
		{startBeat: 4496193, note: 79},
		{startBeat: 4496321, note: 76},
		{startBeat: 4512833, note: 78},
		{startBeat: 4529473, note: 74},
		{startBeat: 4545985, note: 72},
		{startBeat: 4562497, note: 71},
		{startBeat: 4579009, note: 74},
		{startBeat: 4595521, note: 79},
		{startBeat: 4612033, note: 71},
		{startBeat: 4628545, note: 69},
		{startBeat: 4645057, note: 84},
		{startBeat: 4661569, note: 83},
		{startBeat: 4678081, note: 79},
		{startBeat: 4694593, note: 81},
		{startBeat: 4711105, note: 79},
		{startBeat: 4727617, note: 78},
		{startBeat: 4744129, note: 76},
		{startBeat: 4760641, note: 74},
		{startBeat: 4777281, note: 78},
		{startBeat: 4793793, note: 79},
		{startBeat: 4810305, note: 81},
		{startBeat: 4826817, note: 78},
		{startBeat: 4826945, note: 74},
		{startBeat: 4827073, note: 76},
		{startBeat: 4843585, note: 78},
		{startBeat: 4860097, note: 74},
		{startBeat: 4860225, note: 69},
		{startBeat: 4860353, note: 71},
		{startBeat: 4876865, note: 72},
		{startBeat: 4893377, note: 69},
		{startBeat: 4893505, note: 66},
		{startBeat: 4893633, note: 67},
		{startBeat: 4910145, note: 69},
		{startBeat: 4926657, note: 66},
		{startBeat: 4926785, note: 62},
		{startBeat: 4926913, note: 72},
		{startBeat: 4943425, note: 71},
		{startBeat: 4959937, note: 67},
		{startBeat: 4960065, note: 62},
		{startBeat: 4960193, note: 74},
		{startBeat: 4976705, note: 71},
		{startBeat: 4993217, note: 67},
		{startBeat: 4993345, note: 62},
		{startBeat: 4993473, note: 79},
		{startBeat: 5009985, note: 74},
		{startBeat: 5026497, note: 71},
		{startBeat: 5026625, note: 72},
		{startBeat: 5043137, note: 69},
		{startBeat: 5043265, note: 71},
		{startBeat: 5059777, note: 67},
		{startBeat: 5059905, note: 62},
		{startBeat: 5076417, note: 71},
		{startBeat: 5092929, note: 69},
		{startBeat: 5109441, note: 71},
		{startBeat: 5109569, note: 72},
		{startBeat: 5109697, note: 67},
		{startBeat: 5126209, note: 66},
		{startBeat: 5142721, note: 71},
		{startBeat: 5142849, note: 72},
		{startBeat: 5142977, note: 64},
		{startBeat: 5159489, note: 62},
		{startBeat: 5176001, note: 71},
		{startBeat: 5176129, note: 72},
		{startBeat: 5176257, note: 60},
		{startBeat: 5192769, note: 59},
		{startBeat: 5209281, note: 62},
		{startBeat: 5225793, note: 66},
		{startBeat: 5242305, note: 69},
		{startBeat: 5258817, note: 74},
		{startBeat: 5275457, note: 71},
		{startBeat: 5291969, note: 67},
		{startBeat: 5308481, note: 62},
		{startBeat: 5325121, note: 66},
		{startBeat: 5341761, note: 55},
		{startBeat: 5341761, note: 67},
	]).map(x => ({...x, startBeat: x.startBeat / 181441})),
})

// logger.log('postalClipB: ', postalClipB.toJS())
