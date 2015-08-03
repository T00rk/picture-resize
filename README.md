# picture-resize
Twitter-like picture resizer.

### Updates

| Date				| Author			| Description											 |
| ----------------- | ----------------- | ------------------------------------------------------ |
| 2015-08-03		| T00rk				| Original commit										 |

	
### Prerequisites

jquery [http://jquery.com/download/](http://jquery.com/download/)

JavaScript-Canvas-to-Blob [https://github.com/blueimp/JavaScript-Canvas-to-Blob](https://github.com/blueimp/JavaScript-Canvas-to-Blob)


### Live Example

Click [here](http://t00rk.github.io/picture-resize) to see

### Usage

	$('div').pictureResize();

### bower

	**Not yet available**
	
### Parameters

| Name				| Type							| Description									|
| ----------------- | ----------------------------- | --------------------------------------------- |
| **width**			| Integer						| Width of the result thumbnail					|
| **height**		| Integer						| Height of the result thumbnail				|
| **size**			| Double						| Maximum size of the original picture (MB)		|


### Methods

    $('div').pictureResize('getResult', function(file, blob)
	{
		console.log(file);
		console.log(blob);
	});

| Name				| Parameter					| Description										  |
| ----------------- | ------------------------- | --------------------------------------------------- |
| **getResult**		| Callback(file, blob)		| Returns the original file and the created thumbnail |

	
