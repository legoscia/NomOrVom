var parseHTML = function(str) {
	var tmp = document.implementation.createDocument();
	tmp.documentElement.appendChild(str)
	return tmp.body.children;
}

chrome.runtime.onConnect.addListener(function(port){
	if(port.name == "scorelookup") {
		port.onMessage.addListener(function(restaurant) {

	  		var url = "http://api.ratings.food.gov.uk/Establishments?name=" + encodeURIComponent(restaurant.name) + "&address=" + encodeURIComponent(restaurant.address); 

			var rating = 0;

			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4)
				{
					var resp = JSON.parse(xhr.responseText);
					if (resp.establishments.length > 0) {
						rating = resp.establishments[0].RatingValue;
					}
					else {
						rating = -1;
					}
					console.log(restaurant.id + " " + rating);
					port.postMessage({id:restaurant.id, rating:rating});
				}
			};
			xhr.open("GET", url, true);
			xhr.setRequestHeader('x-api-version', 2);
			xhr.setRequestHeader('Content-Type','application/json');
			xhr.setRequestHeader('Accept','application/json');
			xhr.send();
	  	});
	}
	if(port.name == "linkedPageScoreLookup") {
		port.onMessage.addListener(function(restaurant) {
			console.log(restaurant.name + " " + restaurant.fullPageUri);
			
			var xhr = new XMLHttpRequest();
			xhr.onload = function() {
				if (xhr.readyState == 4)
				{
					var pageDoc = xhr.responseXML;
					var addressElement = pageDoc.querySelector('span.address');
					//console.log(addressELement);

					var streetAddress = "";
					var streetAddressElement = addressElement.querySelector('span[itemprop="streetAddress"]');
					if (streetAddressElement) streetAddress = streetAddressElement.innerHTML.trim();

					var addressLocality = "";
					var addressLocalityElement = addressElement.querySelector('span[itemprop="addressLocality"]')
					if (addressLocalityElement) addressLocality = addressLocalityElement.innerHTML.trim(); 

					var postcode = "";
					var postcodeElement = addressElement.querySelector('span[itemprop="postalCode"]');
					if (postcodeElement) postcode = postcodeElement.innerHTML.trim();

					var restaurantAddress = streetAddress + " " + addressLocality + " " + postcode;
					
			  		var url = "http://api.ratings.food.gov.uk/Establishments?name=" + encodeURIComponent(restaurant.name) + "&address=" + encodeURIComponent(restaurantAddress); 

					var rating = 0;

					var xhrFood = new XMLHttpRequest();
					xhrFood.onreadystatechange = function() {
						if (xhrFood.readyState == 4)
						{
							var resp = JSON.parse(xhrFood.responseText);
							if (resp.establishments.length > 0) {
								rating = resp.establishments[0].RatingValue;
							}
							else {
								rating = -1;
							}
							console.log(restaurant.id + " " + rating);
							//port.postMessage({id:restaurant.id, rating:rating});
						}
					};
					xhrFood.open("GET", url, true);
					xhrFood.setRequestHeader('x-api-version', 2);
					xhrFood.setRequestHeader('Content-Type','application/json');
					xhrFood.setRequestHeader('Accept','application/json');
					xhrFood.send();
				}
			};
			xhr.open("GET", restaurant.fullPageUri);
			xhr.responseType = "document";
			xhr.send();
	  	});
  	}
});