process.env.NODE_ENV = 'production'

const Bundler = require('parcel-bundler')
const parcelWrapper = require('parcel-plugin-wrapper')

const entryFiles = [
	'packages/client/index.html',
	'packages/client/WebAudio/AudioWorklets/Processors/*.ts',
	'packages/client/WebWorkers/Workers/*.ts',
]

/** @typedef {import('parcel-bundler').ParcelOptions} ParcelOptions */

/** @type {ParcelOptions} */
const options = {
	outDir: 'built/packages/public', // The out directory to put the build files in, defaults to dist
	// outFile: 'index.html', // The name of the outputFile
	// publicUrl: './', // The url to serve on, defaults to '/'
	// watch: true, // Whether to watch the files and rebuild them on change, defaults to process.env.NODE_ENV !== 'production'
	// cache: true, // Enabled or disables caching, defaults to true
	// cacheDir: '.cache', // The directory cache gets put in, defaults to .cache
	// contentHash: false, // Disable content hash from being included on the filename
	// global: 'moduleName', // Expose modules as UMD under this name, disabled by default
	// minify: false, // Minify files, enabled if process.env.NODE_ENV === 'production'
	// scopeHoist: false, // Turn on experimental scope hoisting/tree shaking flag, for smaller production bundles
	// target: 'browser', // Browser/node/electron, defaults to browser
	// bundleNodeModules: false, // By default, package.json dependencies are not included when using 'node' or 'electron' with 'target' option above. Set to true to adds them to the bundle, false by default
	// https: { // Define a custom {key, cert} pair, use true to generate one or false to use http
	// 	cert: './ssl/c.crt', // Path to custom certificate
	// 	key: './ssl/k.key' // Path to custom key
	// },
	// logLevel: 3, // 5 = save everything to a file, 4 = like 3, but with timestamps and additionally log http requests to dev server, 3 = log info, warnings & errors, 2 = log warnings & errors, 1 = log errors
	// hmr: true, // Enable or disable HMR while watching
	// hmrPort: 0, // The port the HMR socket runs on, defaults to a random free port (0 in node.js resolves to a random free port)
	sourceMaps: false, // Enable or disable sourcemaps, defaults to enabled (minified builds currently always create sourcemaps)
	// hmrHostname: '', // A hostname for hot module reload, default to ''
	// detailedReport: false, // Prints a detailed report of the bundles, assets, file sizes and times, defaults to false, reports are only printed if watch is disabled
	// autoInstall: true, // Enable or disable auto install of missing dependencies found during bundling
};

{
	(async function () {
		// Initializes a bundler using the entry point location and options provided
		const bundler = new Bundler(entryFiles, options);

		parcelWrapper(bundler);

		// Run the bundler, this returns the main bundle
		// Use the events if you're using watch mode as this promise will only trigger once and not for every rebuild
		const bundle = await bundler.bundle();
	})();
}