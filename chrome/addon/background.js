var parseHTML = function(str) {
	var tmp = document.implementation.createHTMLDocument();
	tmp.body.innerHTML = str;
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
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4)
				{
	//				console.log(xhr.responseText);
					var pageDoc = parseHTML(xhr.responseText);
					var addressELement = pageDoc.querySelector('span.address');
					console.log(addressELement);
				}
			};
			xhr.open("GET", restaurant.fullPageUri, true);
			xhr.send();
	  	});
  	}
});