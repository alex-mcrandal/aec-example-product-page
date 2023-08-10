//======== DOM Elements ========
/**
Img element for the product
*/
var clothingImg;

/**
Img element for the logo
*/
var itemLogo;

/**
Container used to provide a pivot point for the
logo to rotate
*/
var itemRotate;

/**
Left arrow used to cycle product images
*/
var leftArrow;

/**
Container for each logo in the logo selection box
*/
var logos;

/**
Logo selection box
*/
var logoSelectorBox;

/**
Right arrow used to cycle through product images
*/
var rightArrow;

/**
Button to open logo selector
*/
var selectLogoBtn;

/**
Button to confirm logo choice
*/
var submitLogoBtn;



//======== Global Variables ========

/**
SRCs for product images
*/
var blankSrcs = [];

/**
Index of the active product image
*/
var blankSrcIndex = 0;

/**
Which logo the client as recently selected
*/
var selectedLogoName = '';

/**
Product's custom position data
*/
var logoPosition;

/**
Company's preference data
*/
var preferenceData;

/**
Production Method used on active product
*/
var productionType;


/**
ML Object (see item-prediction.js)
*/
var itemModel;

/**
Config data for ML model
*/
var config;


/**
Request pruduct images from server
*/
function buildClothingImgs() {
	$.ajax({
		url: 'blanks',
		type: 'post',
		data: '',
		dataType: 'json',
		contentType: false,
		processData: false,
		success: function (res) {
			for (let src of res.imgSrcs){
				blankSrcs.push(src);
			}
			//console.log(blankSrcs);
			clothingImg.attr('src', blankSrcs[blankSrcIndex]);
		},
		error: function (jqXHR, textStatus, errorThrown) {
			console.log('Error sending data :(');
		}
	});
}


/**
Request logo selector for company and product production type
from server
*/
function buildLogoSelector() {
	$.ajax({
		url: 'logo-selector',
		type: 'post',
		data: '',
		dataType: 'json',
		contentType: false,
		processData: false,
		success: function (res) {
			for (let logo of res.logoSrcs) {
				//console.log(logo);
				logos.append(`<div class="logoSelectImg"><img src="${logo + '.jpg'}" class="selectorImg" name="${logo}"></div>`);
			}
			let selectors = $('.logoSelectImg');
			selectors.click(onLogoSelect);
		},
		error: function (jqXHR, textStatus, errorThrown) {
			console.log('Error building logo selector :(');
		}
	});
}


/**
Display product image to the left (minus index)
*/
function clickedLeft() {
	blankSrcIndex = Math.max(0, blankSrcIndex - 1);
	clothingImg.attr('src', blankSrcs[blankSrcIndex]);
	if (selectedLogoName != '') submitLogo();
}


/**
Display product image to the right (plus index)
*/
function clickedRight() {
	blankSrcIndex = Math.min(blankSrcs.length - 1, blankSrcIndex + 1);
	clothingImg.attr('src', blankSrcs[blankSrcIndex]);
	if (selectedLogoName != '') submitLogo();
}


/**
Determine the mean squared error between two RGB pixels
*/
function colorError(pixel1, pixel2) {
	let rErr = Math.abs(pixel1[0] - pixel2[0]);
	let gErr = Math.abs(pixel1[1] - pixel2[1]);
	let bErr = Math.abs(pixel1[2] - pixel2[2]);

	return Math.pow( (rErr + gErr + bErr) / 3, 2);
}


/**
Request custom logo position for active product from server
*/
function getLogoData() {
	$.ajax({
		url: 'logo-position',
		type: 'post',
		data: '',
		dataType: 'json',
		contentType: false,
		processData: false,
		success: function(res) {
			//console.log(res);
			logoPosition = res;
		},
		error: function (jqXHR, textStatus, errorThrown) {
			console.log('Error asking for logo position :(');
		}
	});
}


/**
Request ML JSON data from server
*/
function getPredictionModel() {
	$.ajax({
		url: 'item-model',
		type: 'post',
		data: '',
		dataType: 'json',
		contentType: false,
		processData: false,
		success: function(res) {
			//console.log(res);
			config = res.config;
			itemModel = new ItemModel(res.model, res.config.itemClasses);
			//console.log('Finished creating model');
		},
		error: function (jqXHR, textStatus, errorThrown) {
			console.log('Error getting item model :(');
		}
	});
}

/**
Request company preference data from server
*/
function getPreferenceData() {
	$.ajax({
		url: 'preference-data',
		type: 'post',
		data: '',
		dataType: 'json',
		contentType: false,
		processData: false,
		success: function (res) {
			preferenceData = res;
			for (let logoObj in preferenceData) {
				for (let key in preferenceData[logoObj]) {
					preferenceData[logoObj][key] = new Map(Object.entries(preferenceData[logoObj][key]));
				}
			}
		},
		error: function (jqXHR, textStatus, errorThrown) {
			console.log('Error asking for preference data :(');
		}
	});
}


/**
Request the proudction method (embroidery, heat, etc) of product from server
*/
function getProductionType() {
	$.ajax({
		url: 'production-type',
		type: 'post',
		data: '',
		dataType: 'json',
		contentType: false,
		processData: false,
		success: function(res) {
			productionType = res.type;
		},
		error: function (jqXHR, textStatus, errorThrown) {
			console.log('Error asking for productionType :(');
		}
	});
}


/**
Hide the logo selector box/container
*/
function hideLogoSelectorBox() {
	logoSelectorBox.hide();
}


/**
Show the logo selector box/container
*/
function showLogoSelectorBox() {
	logoSelectorBox.show();
}


/**
Event when the client submits their logo decision or a new product
image is displayed
*/
async function submitLogo() {
	hideLogoSelectorBox();
	//console.log(selectedLogoName);

	if (selectedLogoName == '') return;

	let itemImg = await IJS.Image.load(clothingImg[0].src);

	//console.log('Loaded item image');

	let backgroundColor;
	let width;
	let top;
	let left;
	let rotation;
	
	if (logoPosition.useCustomPositioning) {
		width = logoPosition.width;
		top = logoPosition.top;
		left = logoPosition.left;
		rotation = logoPosition.rotation;


		backgroundColor = itemImg.getPixelXY( Math.floor(itemImg.width * left / 100), Math.floor(itemImg.height * top / 100) );
	}
	else {
		let modelResult = itemModel.activate(itemImg);

		width = config[modelResult].width;
		top = config[modelResult].top;
		left = config[modelResult].left;
		rotation = 0;


		backgroundColor = itemImg.getPixelXY( Math.floor(itemImg.width * left / 100), Math.floor(itemImg.height * top / 100) );
	}

	//console.log('Found logo dimensions');

	//console.log(backgroundColor);
	//console.log(`${width}, ${top}, ${left}, ${rotation}`);

	let logoSrc;
	let bestColorKey = 'REPLACE_THIS';
	let bestColorError = Number.MAX_VALUE;

	//console.log(preferenceData[selectedLogoName][productionType]);

	for (const key of preferenceData[selectedLogoName][productionType].keys()) {
		//console.log(`Key: ${key}, Background: ${backgroundColor}`);
		let colorKey = key.split(',');
		for (let i = 0; i < colorKey.length; i++) {
			colorKey[i] = Number(colorKey[i]);
		}

		let cErr = colorError(backgroundColor, colorKey);
		if (cErr < bestColorError) {
			bestColorError = cErr;
			bestColorKey = key;
		}
	}
	//console.log(bestColorKey);

	logoSrc = preferenceData[selectedLogoName][productionType].get(bestColorKey);
	itemLogo.attr('src', logoSrc);
	itemLogo.attr('style', `transform: rotateY(${rotation}deg);`);
	itemRotate.attr('style', `width: ${width}px; top: ${top}%; left: ${left}%;`);
}


/**
Click event when client chooses a logo
*/
function onLogoSelect() {
	selectedLogoName = this.children[0].name;
	//console.log(selectedLogoName);
}


/**
Add event listeners to DOM elements
*/
function addEventListeners() {
	selectLogoBtn.click(showLogoSelectorBox);
	submitLogoBtn.click(submitLogo)
	leftArrow.click(clickedLeft);
	rightArrow.click(clickedRight);
}


/**
Initialize the webpage's functionality and request data
*/
function init() {
	clothingImg = $('#item');
	itemLogo = $('#logo');
	itemRotate = $('#image-rotate');
	leftArrow = $('#image-left');
	logos = $('#logos');
	logoSelectorBox = $('#logo-selector');
	rightArrow = $('#image-right');
	selectLogoBtn = $('#select-logo');
	submitLogoBtn = $('#submit-logo');

	hideLogoSelectorBox();

	addEventListeners();

	buildClothingImgs();
	buildLogoSelector();
	getLogoData();
	getPredictionModel();
	getPreferenceData();
	getProductionType();
}


//When window is loaded, initialize
$( window ).on('load', init);
