var webpack = require('webpack');
var path = require('path');

var express = require('express'),
	server = express();

var PUBLIC_DIR = path.resolve(__dirname, 'public');
var JS_DIR = path.resolve(__dirname, 'src/js');
var SASS_DIR = path.resolve(__dirname, 'src/sass');
var BUILD_DIR = PUBLIC_DIR + '/build';

var webpack_config = {
	entry: ['whatwg-fetch', (JS_DIR + '/app.jsx')],
	output: {
		path: BUILD_DIR,
		filename: 'bundle.js'
	},
	module: {
		loaders: [
			{
				test: /\.jsx?/,
				include: JS_DIR,
				loader: 'babel',
				query: { presets: ['es2015', 'react'] }
			},
			{
				test: /\.scss$/,
				include: SASS_DIR,
				loaders: ['style','css','autoprefixer','sass']
			}
		]
	},
	plugins: [
		new webpack.optimize.UglifyJsPlugin({minimize: true}),
		new webpack.DefinePlugin({
			'process.env': {
				// This has effect on the react lib size
				'NODE_ENV': JSON.stringify('production'),
			}
		})
	]
};

/* watch for source code changes and build them */
var compiler = webpack(webpack_config);
compiler.watch({},function(err, stats){
	if(err) {
		console.log('Webpack fatal error:');
		console.error(err);
	} else {
		var json_stats = stats.toJson();
		if(json_stats.errors.length > 0) {
			json_stats.errors.forEach(function(e) {
				console.log('Webpack compiler error:');
				console.error(e);
			});
		} else {
			console.log('Successfully recompiled');
		}
	}
});

/* serve bundle on webpage at port 3000 */
server.use(express.static(PUBLIC_DIR));
server.get('/', function(req ,res) {
	res.sendfile(PUBLIC_DIR + '/index.html');
});
server.listen(3000);
