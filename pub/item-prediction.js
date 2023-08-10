/**
ItemModel creates a useable ML Model Object

The object is created from a pre-trained model in the
form of a JSON file and configuration data associated
with the training of that model

Once created, utilize the 'activate' method to have the
model predict the type of product on screen
*/
class ItemModel {

	constructor(netJSON, itemClasses) {
		this.itemClasses = itemClasses;
		this.net = new convnetjs.Net();
		this.net.fromJSON(netJSON);
	}

	/**
	Determine the categorical class of a product image

	Params:
	imgObj (Image-JS): Object of product image displayed on the webpage

	Returns:
	(String): The highest probability class from 'itemClasses'
	*/
	activate(imgObj) {
		let newImg = imgObj.resize({width: 32, height: 32});
		let x = new convnetjs.Vol(32, 32, 1, 0.0);
		let shape = 32 * 32;
		
		for (let i = 0; i < shape; i++) {
			let pixel = newImg.getPixel(i);
			x.w[i] = (pixel[0] + pixel[1] + pixel[2]) / 765;
		}

		let score = this.net.forward(x);
		let results = score.w;

		let maxIndex = 0;
		for (let i = 1; i < results.length; i++) {
			if (results[i] > results[maxIndex]) {
				maxIndex = i;
			}
		}

		return this.itemClasses[maxIndex];
	}
}
