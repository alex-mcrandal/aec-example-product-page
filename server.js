//======== Import Statements =======
const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');



//======== External Data ========
/**
Product Information
Stored as data in JSON (or any other means)
*/
const blankData = require('./items/t-shirt1234.json');

/**
Information required for the ML model to function
*/
const config = require('./config.json');

/**
The ML model stored as data in a file

Easily read by the ConvNet library to create a ML Object
*/
const itemModel = require('./item-model.json');



//======== Global Variables ========

/**
Directory for active stores information
*/
var storeData = path.join(__dirname, 'stores', 'ure');




//======== Express Setup ========
const app = express();
const port = 8080;

app.use(express.static('./pub'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));




//======== Request Handlers ========


/**
Get the home page
*/
app.get('/', async (req, res) => {
	res.sendFile(path.join(__dirname, 'pub', 'index.html'));
});


/**
Retrieve image SRCs for blank product images
*/
app.post('/blanks', async (req, res) => {
	console.log('Received blank request');
	res.json({imgSrcs: blankData.blanks});
});


/**
Retrieve the ML model in data form as well as its configuration
data
*/
app.post('/item-model', async (req, res) => {
	console.log('Received request for item prediction model');
	res.json({
		model: itemModel,
		config: config
	});
});


/**
Retrieve the product's custom position data
*/
app.post('/logo-position', async (req, res) => {
	console.log('Received logo position request');
	res.json({
		useCustomPositioning: blankData.useCustomPositioning,
		width: blankData.logoWidth,
		top: blankData.logoTop,
		left: blankData.logoLeft,
		rotation: blankData.logoRotation
	});
});


/**
Retrieve the image SRCs for the logo selector
*/
app.post('/logo-selector', async (req, res) => {
	console.log('Received logo selector request');
	let storeLogoSelectors = require(path.join(storeData, 'logo-selectors.json'));
	res.json({logoSrcs: storeLogoSelectors[blankData.productionType]});
});


/**
Retrieve the company's preference data
*/
app.post('/preference-data', async (req, res) => {
	console.log('Received request for company preferences');
	let companyPreferences = require(path.join(storeData, 'preference-sheet.json'));
	res.json(companyPreferences);
});


/**
Request the production method for the active product
*/
app.post('/production-type', async (req, res) => {
	console.log('Received request for item production type');
	res.json({type: blankData.productionType});
});




//======== Start the App ========
app.listen(port, () => {
	console.log(`Web app (http) listening on port ${port}`);
});
