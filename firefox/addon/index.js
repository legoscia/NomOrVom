var pageMod = require("sdk/page-mod");
var self = require("sdk/self");

pageMod.PageMod({
    include: ["http://www.just-eat.co.uk/area/*", "http://just-eat.co.uk/area/*", "https://www.just-eat.co.uk/area/*", "https://just-eat.co.uk/area/*"],
 	contentStyleFile: [self.data.url("jquery-ui-1.11.4/jquery-ui.min.css"), self.data.url("nomorvom.css")],
    contentScriptOptions: {prefixDataURI: self.data.url("")},
	contentScriptFile: [self.data.url("jquery-2.1.4/jquery-2.1.4.min.js"), self.data.url("jquery-ui-1.11.4/jquery-ui.min.js"), self.data.url("api.js")],
	contentScriptWhen: "ready",
	onAttach: startListening
});

function startListening(worker) {
	worker.port.on("queryRestaurant", function(restaurant) {
		//console.log(restaurant);
		
		var url = "http://api.ratings.food.gov.uk/Establishments?name=" + encodeURIComponent(restaurant.name) + "&address=" + encodeURIComponent(restaurant.address); 
		var rating = 0;

		var Request = require("sdk/request").Request;
		var foodLookupRequest = Request({
  			url: url,
  			headers: {'x-api-version':2, 'Content-Type':'application/json', 'Accept':'application/json'},
			onComplete: function (response) {	
				if (response.json != null) {
					if (response.json.establishments.length > 0) {
						rating = response.json.establishments[0].RatingValue;
					} 
					else {
						rating = -1;
					}
				}
				worker.port.emit("restaurantScore", {id:restaurant.id, rating:rating});
			}
		}).get();
	});	
}