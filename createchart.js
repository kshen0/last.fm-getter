// Set async to false so we load all data before proceeding
$.ajaxSetup( {"async": false} );

// load streamgraph layer data
var layers = [];
$.getJSON('./listens.json', function(data) {
	layers = data;
});

// load mapping of songs to play
var songs = {};
$.getJSON('./songs.json', function(data) {
	songs = data;
});

// load mapping of stories to month and year
var stories = {};
$.getJSON('stories.json', function(data) {
	stories = data;
});

// finished loading

var visiblePopup;
var storyPopup;
var tooltipHeight = 20;
var tooltipWidth = 200;
var storyTooltipWidth = 200;
var storyTooltipHeight = 20;
var hoverOffset = 7; 
var clickedStream = null;
var hoveredStream = null;
var startYear = 2009;
var artistIndex = {};
var lastHoveredArtistName;
var activeDate = null;
var audioOn = true;
var activeAudio = $("#audioplayer1");
var inactiveAudio = $("#audioplayer2");

// compute artist ranks
for (var i = 0; i < layers.length; i++){ 
	var artist = layers[i]["name"];
	artistIndex[artist] = i;
}

var m = 49; // samples per layer
var width = 3500,
		height = 600,
		mx = m -1,
		my = 1500;

var color = d3.scale.linear()
		.range(["#aad", "#555"]);

var stack = d3.layout.stack()
		.offset("silhouette")
		.values(function(d) { return d.values; });

var area = d3.svg.area()
		.x(function(d) { 
				return d.x * width / mx; 
		})
		.y0(function(d) { 
				output = height - d.y0 * height / my; 
				return output;
		})
		.y1(function(d) { 
				output = height - (d.y + d.y0) * height / my;
				return output;
		})
		.interpolate("basis");

var vis = d3.select("#chart")
	.append("svg")
		.attr("width", width)
		.attr("height", height)

populateXAxis();

// insert title
vis.append('text')
	//.text("the musical associations of kevin shen")
	.text("the meaning of kevin shen's top 40")
	.attr("x", 5).attr("y", 25)
	.style('font-size', '18pt')


// populate graph
vis.selectAll("path")
	.data(stack(layers))
	.enter().append("path")
		.attr("d", function(d) { return area(d.values); })
		.style("fill", function() { return color(Math.random()); })
		.on("mouseover", pathMouseover)
		.on("mouseout", pathMouseOut)
		.on("click", onStreamClick);

var seekLine = vis.append('line')
	.attr("y1", height)
	.attr("y2", 0)
	.attr("stroke-width", 1)
	.attr("stroke", "#4557A3");
seek(25, 0);

$("svg").mousemove(function(event) {
	seek(event.pageX, event.pageY);

	//console.log(Number($(window).scrollLeft() - 9));
	if(event.pageX < (Number($(window).scrollLeft()))+ 50) {
		$(window).scrollLeft((Number($(window).scrollLeft()) - 9));
	}

	if(event.pageX > $(window).width() + (Number($(window).scrollLeft()))- 50) {
		//$(window).scrollLeft((Number($(window).scrollLeft())+600+'px'));
		$(window).scrollLeft((Number($(window).scrollLeft()) + 9));
	}
});


function seek(x, y) {
	seekLine
		.attr("x1", x - hoverOffset)	
		.attr("x2", x - hoverOffset);

	var monthAndYear = getMonthAndYear(x).toString();

/*
	// entered into new month; change the song
	if(monthAndYear != activeDate) {
		console.log('new month');
		// fade out old sound
//			activeAudio.animate({volume: 0}, 1000);
		activeDate = monthAndYear;

		// play sound
		var audio = songs[monthAndYear];
		if(audio != null && audioOn) {
			inactiveAudio.animate({volume: 100}, 3000);
			inactiveAudio.html("<source src='./music/" + audio[0] + "' type='audio/mpeg'/>");
			//activeAudio[0].play();
			var temp = inactiveAudio;
			inactiveAudio = activeAudio;
			activeAudio = temp;
		}
	}
	*/
	var story = stories[monthAndYear];

	storyPopup = d3.select("#storyTooltip")
		.html(story)
		.style("min-height", storyTooltipHeight + "px")
		.style("width", storyTooltipWidth + "px")

	var h = $("#storyTooltip").outerHeight();
	var w = $("#storyTooltip").outerWidth();
	var yOffset = storyTooltipHeight;
	var textAlign = "right";
	// flip horizontal if too close to edge
	if(x < w) {
		w = 0;
		textAlign = "left";
	}
	// flip vertical if too close to top
	/*
	if(y < h) {
		h = -h;
		yOffset = -yOffset;
	}
	*/

	storyPopup
		.style("margin-left", (x - w - hoverOffset)+"px") 
		.style("margin-top", (y - h - yOffset*3 - 1)+"px")
		.style("display", "block")
		.style("text-align", textAlign);

	// entered into new month; change the song
	if(monthAndYear != activeDate) {
		var audioplayer = $('#audioplayer1');
		var audio = songs[monthAndYear];

		if (audio.length == 0) {
			audioplayer[0].pause();
			return;
		}

		activeDate = monthAndYear;
		// play sound
		if(audioOn) {
			audioplayer.html("<source src='./music/" + audio[0] + "' type='audio/mpeg'/>");
			audioplayer[0].play();
		}
	}
}

function getMonthAndYear(x) {
	var monthWidth = width / m;
	var monthsSinceBeginning = parseInt(x / monthWidth);
	var year = startYear + parseInt(monthsSinceBeginning / 12);
	var month = parseInt(monthsSinceBeginning % 12);

	return [month, year];
}

function onStreamClick(d, i) {
	if(clickedStream == null) {
		clickedStream = d3.select(this);
		d3.selectAll("path").style('display', 'none');
		clickedStream.style('display', 'block');
		//d3.selectAll("path").transition().style('opacity', '0.0', "important");
		//clickedStream.style('opacity', '1.0');
	}
	else {
		d3.selectAll("path").style('display', 'block');
		//d3.selectAll("path").transition().style('opacity', '1.0');
		clickedStream = null;	
	}
}

$("path").mousemove(function(event) {
	var x = event.pageX; 
	var y = event.pageY; 

	renderArtistTooltip(x, y);
});

function pathMouseOut(d, i) {
	var color = d3.select(this).style('fill');
	var newColor = d3.rgb(color).darker(.3);
	d3.select(this).style("fill", newColor);
	visiblePopup.style("display", "none");
	hoveredStream = null;
}

function pathMouseover(d, i) {
	// highlight 
	var color = d3.select(this).style('fill');
	var newColor = d3.rgb(color).brighter(.3);
	hoveredStream = d3.select(this).style("fill", newColor);

	var x = d3.mouse(this)[0];
	var y = d3.mouse(this)[1];

	lastHoveredArtistName = d.name;

	renderArtistTooltip(x, y);
}

function renderArtistTooltip(x, y) {
	// get date for this month for this artist
	var date = getMonthAndYear(x); 
	var i = (date[1] - startYear) * 12 + date[0];
	var plays = layers[artistIndex[lastHoveredArtistName]]["values"][i]["y"];

	var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

	// insert html
	visiblePopup = d3.select("#artistTooltip")
		.html('<div class="artist">' + lastHoveredArtistName + '<br>' + plays + ' plays during ' + months[date[0]] + ' ' + date[1] + '.</div>')
		.style("min-height", tooltipHeight + "px")
		.style("min-width", tooltipWidth + "px");

	// adjust margins to position near cursor
	var h = $("#artistTooltip").outerHeight();
	var w = $("#artistTooltip").outerWidth();
	var yOffset = tooltipHeight;
	// flip if too close to left edge of page
	if(x < w) {
		w = 0;	
	}
	/*
	if(y < h) {
		h = -h;
		yOffset = -yOffset;
	}
	*/

	visiblePopup
		.style("margin-left", (x - w - hoverOffset) + "px") 
		.style("margin-top", (y - h - yOffset) + "px")
		.style("display", "block");

}

function populateXAxis() {
	var step = width / m;
	//var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	var months = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];

	var month = 0;
	var year = 2009;

	//var printMonth = true;
	var monthAxis = d3.select('#month-axis');

	for(var x = 0; x < width; x += step) {
		vis.append('line')
			.attr("x1", x)	
			.attr("x2", x)
			.attr("y1", height)
			.attr("y2", 0)
			.attr("stroke-width", .7)
			.attr("stroke", "#DBD5D7");

		monthAxis.append('div')
			.attr('class', 'date-div')
			.html(months[month])
			.style('width', step + 'px')
		month = (month + 1) % 12;
	}

	var yearStep = width / (49 / 12);  //width / number of years 
	var yearAxis = d3.select('#year-axis');
	for(year; year < 2013; year ++) {
		yearAxis.append('div')
			.html(year)
			.style('width', yearStep + 'px');
	}
}

function toggleSound() {
	if(audioOn) {
		$('#audioplayer1')[0].pause();
		$('#soundbutton').attr("src", "./img/nosound.png");
		audioOn = false;
	}
	else {
		$('#audioplayer1')[0].play();
		$('#soundbutton').attr("src", "./img/sound.png");
		audioOn = true;
	}
}