// toilet-paper-icon_32 from Rokey (http://www.iconarchive.com/show/smooth-icons-by-rokey/toilet-paper-icon.html)
// 48-fork-and-knife-icon by Glyphish (http://glyphish.com/)
// test 
// jpm run --binary-args http://www.just-eat.co.uk/area/nn1-northampton

function ShowElement(element) {
	element.style.display = '';
}

function HideElement(element) {
	element.style.display = 'none';
}

function RemoveElement(elementSelector, parentElement) {
	parentElement = typeof parentElement !== 'undefined' ? parentElement : document;
	var el = parentElement.querySelector(elementSelector);
	el.parentNode.removeChild(el);
}

function AppendImg(element, filename) {
    var img = document.createElement('img');
    img.src = self.options.prefixDataURI + filename;
    element.appendChild(img);
}

function ApplyFilter(ratingFilterRange, restaurantEntries, excludeNoData) {
	excludeNoData = typeof excludeNoData !== 'undefined' ? excludeNoData : false;
	Array.prototype.forEach.call(restaurantEntries, function (el, i) {
		var ratingElement = el.querySelectorAll('div#nomorvom[data-rating]');
		if (ratingElement.length) {
			var rating = Number(ratingElement[0].getAttribute('data-rating'));
			if ( (rating < 0 && excludeNoData == false) || (rating >= Number(ratingFilterRange[0]) && rating <= Number(ratingFilterRange[1])) ) { 
				ShowElement(el); 
			}
			else { HideElement(el); }
		}
		else { HideElement(el); }
	});
}

var restaurantEntries = document.querySelectorAll('div.restaurant:not(.offlineRestaurant)');

var config = document.createElement('div');
config.id = "nomorvom_config"

var sliderLabel = document.createElement('p');
sliderLabel.id = "nomorvom_config_title";
sliderLabel.appendChild(document.createTextNode("Move the sliders to filter results by hygiene rating:"));
config.appendChild(sliderLabel);

/*
var scoreFilterSlider2 = document.createElement('div');
scoreFilterSlider2.id = "scoreFilter";

noUiSlider.create(scoreFilterSlider2, {
	start: [0, 5],
	orientation: 'vertical',
	connect: true,
	step: 1,
	height: '400px',
	pips: {
		mode: 'steps',
		orientation: 'horizontal'
	},
	range: {
		'min' : 0,
		'max' : 5
	}
});*/

var scoreFilterSlider = document.createElement('div');
scoreFilterSlider.id = "scoreFilterSlider";
$(scoreFilterSlider).slider({
	range: true,
	values: [0, 5],
	min: 0,
	max: 5,
	step: 1,
	slide: function( event, ui ) {
		ApplyFilter(ui.values, restaurantEntries, document.getElementById('nomorvom_config_excludeNoData_checkbox').checked);
	}
});

var vals = $(scoreFilterSlider).slider("option", "max") - $(scoreFilterSlider).slider("option", "min");

// Space out values
for (var i = 0; i <= vals; i++) {
	var el = $('<label>'+(i)+'</label>').css('left',(i/vals*100)+'%');

	$(scoreFilterSlider).append(el);
}

config.appendChild(scoreFilterSlider);

var excludeNoDataLabel = document.createElement('p');
excludeNoDataLabel.id = "nomorvom_config_excludeNoData";
excludeNoDataLabel.appendChild(document.createTextNode("Exclude 'No Result' Entries:"));

var excludeNoDataCheckbox = document.createElement('input');
excludeNoDataCheckbox.type = "checkbox"
excludeNoDataCheckbox.id = "nomorvom_config_excludeNoData_checkbox";
excludeNoDataCheckbox.checked = true;
excludeNoDataCheckbox.addEventListener('change', function() {
	ApplyFilter($(scoreFilterSlider).slider("values"), restaurantEntries, excludeNoDataCheckbox.checked);
});
excludeNoDataLabel.appendChild(excludeNoDataCheckbox);

config.appendChild(excludeNoDataLabel);

var restaurantsDiv = document.querySelector("div.restaurants");
restaurantsDiv.insertBefore(config, restaurantsDiv.firstChild);

// Set up the listener for the result returned from the addon script
self.port.on("restaurantScore", function(restaurantScore) {
	// find the score placeholder for the restaurant we've got a result for
	var restaurantScorePlaceholder = document.querySelector("div.restaurant[data-nomorvom-id='"+restaurantScore.id+"'] div#nomorvom");
	restaurantScorePlaceholder.setAttribute('data-rating', restaurantScore.rating);
	RemoveElement('p#nomorvom_loading', restaurantScorePlaceholder);
	RemoveElement('div#nomorvom_progressbar', restaurantScorePlaceholder);
	
	if (restaurantScore.rating > 0) {
		for (var i = 0; i < restaurantScore.rating; i++) {
			AppendImg(restaurantScorePlaceholder, '48-fork-and-knife-icon.png');
		}
		for (var i = 0; i < 5 - restaurantScore.rating; i++) {
			AppendImg(restaurantScorePlaceholder, 'toilet-paper-icon_32.png');
		}
	}

	var resultText = document.createElement('div');
	resultText.id = "nomorvom_hygieneScore"

	if (restaurantScore.rating == "AwaitingInspection") {
		resultText.textContent = "This takeaway is awaiting inspection";					
		restaurantScore.rating = 0;
	}	
	else {
		if (restaurantScore.rating == -1) {
			resultText.textContent = "Sorry, no food hygiene data found";
		}
		else {
			resultText.textContent = "Hygiene Score : " + restaurantScore.rating + "/5";
		}
		resultText.appendChild(document.createElement('br'));
		resultText.appendChild(document.createTextNode("Rated on " + restaurantScore.date.substring(0, 10)));
	}
	restaurantScorePlaceholder.appendChild(resultText);

	// Filter accordingly
	ApplyFilter($(scoreFilterSlider).slider("values"), restaurantEntries, document.getElementById('nomorvom_config_excludeNoData_checkbox').checked);
});

var restaurantId = 0;

Array.prototype.forEach.call(restaurantEntries, function (el, i) {

    var name = el.querySelector('h2.name').textContent.trim();
    var address = el.querySelector('p.address').childNodes[0].textContent.trim();

    self.port.emit("queryRestaurant", {id:restaurantId, name:name, address:address});

    var scorePlaceholder = document.createElement('div');
	scorePlaceholder.id = "nomorvom";
	
	var loadingText = document.createElement('p');
	loadingText.id = "nomorvom_loading";
	loadingText.textContent = "Loading food scores...";

    var loaderImg = document.createElement('div');
	loaderImg.id = "nomorvom_progressbar";

	var img = new Image();
	img.onload = function() {
  		loaderImg.appendChild(img);
	};

	img.src = self.options.prefixDataURI + 'loading.gif';
	
	scorePlaceholder.appendChild(loadingText);
	scorePlaceholder.appendChild(loaderImg);
	
	scorePlaceholder.setAttribute('data-rating', 0);

	el.setAttribute('data-nomorvom-id', restaurantId);

    el.appendChild(scorePlaceholder);
    
    restaurantId++;
});