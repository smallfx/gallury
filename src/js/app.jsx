import React from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux';

// Loaded with sass-loader
require('../sass/style.scss');


// Redux state setup
//
function state_reducer(old_state, action) {
	switch (action.type) {
		case 'more_images':
			let new_page_number = old_state.page_number + 1;
			let new_array = old_state.image_URLs.concat(action.new_URLs);
			return Object.assign({}, old_state, {page_number: new_page_number, image_URLs: new_array});
			break;
		case 'new_query':
			if (action.query == old_state.search_query) return old_state;
			return {search_query: action.query, page_number: 0, image_URLs: []};
			break;
		default:
			return old_state;
			break;
	}
}

let initial_app_state = {
	search_query: 'pikachu',
	page_number: 0,
	image_URLs: []
};

let state_store = createStore(state_reducer, initial_app_state);


// React components

let BufferedImage = React.createClass({
	getInitialState: function() {
		return {loaded: false};
	},

	imageLoaded: function() {
		this.setState({loaded: true});
	},

	render: function() {
		let containerClass = 'image-container';
		if(this.state.loaded) containerClass += ' loaded';

		return (
			<div className={containerClass}>
				<div style={{backgroundImage:'url('+this.props.src+')'}} className='image-background'>
					<img ref='img' onLoad={this.imageLoaded} src={this.props.src} />
				</div>
			</div>
		);
	}
});


let BufferedImageList = React.createClass({
	bufferedImageInstances: {},

	componentWillReceiveProps: function(newProps) {
		// If search results get blanked out, it's safe to get rid of our cached instances
		if(newProps.imageURLs.length < this.props.imageURLs.length) this.bufferedImageInstances = {};
	},

	render: function() {
		let elements = this.props.imageURLs.map((url, idx) => {
			if(!this.bufferedImageInstances[idx]) {
				this.bufferedImageInstances[idx] = (<BufferedImage key={idx} src={url} />);
			}
			return	this.bufferedImageInstances[idx];
		});

		return (<div id='imagelist-container'>{elements}</div>);
	}
});


let SearchBar = React.createClass({
	getInitialState: function() {
		return {value: state_store.getState().search_query};
	},

	handleChange: function(e) {
		this.setState({value: e.target.value});
	},

	handleKeyPress: function(e) {
		if(e.key === 'Enter') {
			this.submitSearch();
		}
	},

	submitSearch: function() {
		state_store.dispatch({type: 'new_query', query: this.state.value});
	},

	render: function() {
		return (
			<div id='search-container'>
				<label>Search:</label>
				<input type='text' value={this.state.value} onChange={this.handleChange} onKeyPress={this.handleKeyPress} />
				<button onClick={this.submitSearch}>→</button>
			</div>
		);
	}
});


let App = React.createClass({
	getInitialState: function() {
		return {loading: false};
	},

	getImagesFromGiphy: function(query, page_number, callback) {
		let offset = (page_number * 24);

		// Access Giphy search w/ public development key
		fetch('http://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=' + query + '&limit=24&offset=' + offset)
		.then((response) => {
			response.json().then((response_json) => {
				let image_URLs = response_json.data.map((d) => {
					return d.images.original.url;
				});
				callback(image_URLs);
			});
		});
	},

	loadNextImages: function() {
		this.setState({loading: true});
		let app_state = state_store.getState();

		this.getImagesFromGiphy(app_state.search_query, app_state.page_number, (URLs) => {
			this.setState({loading: false});
			state_store.dispatch({type: 'more_images', new_URLs: URLs});
		});
	},

	componentWillMount: function() {
		state_store.subscribe(() => {
			if(state_store.getState().image_URLs.length == 0) {
				this.loadNextImages();
			}
			this.forceUpdate();
		});

		this.loadNextImages();
	},

	render: function() {
		return (
			<div>
				<SearchBar />
				<div id='page-container'>
					<BufferedImageList imageURLs={state_store.getState().image_URLs} />
					<button disabled={this.state.loading} onClick={this.loadNextImages}>More Images</button>
				</div>
			</div>
		);
	}
});

ReactDOM.render(<App/>, document.getElementById('app'));
