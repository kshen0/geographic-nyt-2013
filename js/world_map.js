var width = 754,
    height = 700;


var svg, projection, path;
var TRANSITION_TIME = 400; // ms

// map movement
var moveable = false;

// JSON
var world = null;
var countries = null;
var places = null;
var articlesByCountry = null;
var populations = null;

var mouseX, mouseY;

queue()
  .defer(d3.json, "data/subunits.json")
  .defer(d3.json, "data/articles_by_country.json")
  .defer(d3.json, "data/populations_2010.json")
  .await(cacheJSON);

function cacheJSON(error, w, a, pop) {
  if (error) {
    console.warn(error);
  }
  world = w;
  articlesByCountry = a;
  populations = pop;

  renderMap();
};

function renderMap() {
  if (!svg) {
    svg = d3.select("#svg-container").append("svg")
        .attr("width", width)
        .attr("height", height)
        .on("mousedown", mousedown);
  }
  // Choose a projection
  projection = d3.geo.orthographic()
    .scale(300)
    .translate([width / 2, height / 2])
    .clipAngle(90);

  path = d3.geo.path()
        .projection(projection);

  // Define a function to get radius
  var radius = d3.scale.sqrt()
      .domain([0, 1e6])
      .range([0, 10]);

  var opacityScale = d3.scale.sqrt()
      .domain([0, 1500])
      .range([0.2, 1]);

  var populationScale = d3.scale.log()
    .domain([0.0000001, 0.0087])
    .range([0.2, 1]);

  // Draw countries of the world
  /*
  svg.append("path")
    .attr("class", "subunit")
    .datum(topojson.object(world, world.objects.subunits_litest))
    .attr("d", path);
  */


  var svgc = $("#svg-container");
  $(svgc).mousemove(function(e) {
    mouseX = e.pageX;
    mouseY = e.pageY;
    $("#tooltip").css({
        "margin-top": mouseY,
        "margin-left": mouseX
    });
  });

  svg.selectAll(".subunit")
    .data(topojson.feature(world, world.objects.subunits_litest).features)
    .enter().append("path")
    .attr("class", function(d) { 
      var id = d.id.replace(' ', '-');
      return "subunit " + id; 
    })
    .attr("d", path)
    .attr("opacity", function(d) {
      var countryName = d.id.replace('-', ' ');
      if (countryName in articlesByCountry) {
        if (!(countryName in populations)) {
          console.log('could not find ' + d.id + ' in populations');
          return 0.1;
        }
        else {
          var articleCount = articlesByCountry[countryName];
          var pop = populations[countryName];
          var articlesPerCapita = articleCount / pop;
          /*
          console.log('\n' + countryName);
          console.log('Population: ' + pop);
          console.log('Artices: ' + articleCount);
          console.log('Articles per capita: ' + articlesPerCapita);
          */
          /*
          if (articlesPerCapita > maxCapita) {
            maxCapita = articlesPerCapita;
          }
          */
          //return opacityScale(articlesByCountry[countryName]['article_count']);
          //console.log(populationScale(articlesPerCapita));
          return populationScale(articlesPerCapita);
        }
      }
      else {
        //console.log('could not find ' + countryName + ' in countries');
        return 0.1;
      }
    })
    //.on("mouseenter", function(d) {
    .on("mouseover", function(d) {
      $("#tooltip").css({"display": "block"});
      /*
      $("#tooltip").css({
        "display": "block",
        "margin-top": mouseY,
        "margin-left": mouseX
      });
      */
      var articleCount = articlesByCountry[d.id];
      var pop = populations[d.id];
      var articlesPerCapita = articleCount / (pop / 1000000);
      articlesPerCapita = Number(articlesPerCapita).toFixed(2);
      var description = "<p>" + d.id + ": " + articleCount + " total articles, " + articlesPerCapita + " articles per capita</p>";
      $("#country-name").html(d.id);
      $("#total-articles").html("Total articles: " + articleCount);
      $("#population").html("Population: " + pop);
      $("#apc").html("Articles per 1 million capita: " + articlesPerCapita);
    })
    .on("mouseout", function(d) {
      $("#tooltip").css({"display": "none"});
    });
    d3.select("svg")
    .call(d3.geo.zoom().projection(projection)
            .on("zoom.redraw", function() {
              d3.event.sourceEvent.preventDefault();
              svg.selectAll("path").attr("d", path);
            }));

    //var selection = d3.select("svg")[0];
    //var selection = d3.select("svg");
    //console.log(selection);
    //d3.geo.zoom().projection(projection);
    //z(selection);

/*
    .on("click", function(d) {
      //launchRandomUrl(d.id);
      console.log(d.id);
    }); 
*/

  // Draw boundaries
  /*
  svg.append("path")
      .datum(topojson.mesh(world, world.objects.subunits_litest, function(a, b) { return a !== b; }))
      .attr("d", path)
      .attr("class", "subunit-boundary")
      .attr("opacity", 0);
    */

  // Draw dots for countries
  /*
  svg.selectAll(".country-dot")
    .data(countries.features)
  .enter().append("path")
    .attr("class", "country-dot")
    .attr("d", path.pointRadius(1));
  */

  // Draw dots for non-country places 
  /*
  svg.selectAll(".place-dot")
    .data(places.features)
  .enter().append("path")
    .attr("class", "place-dot")
    .attr("d", path.pointRadius(1))
    .attr("opacity", 0);
  */

  /*
  // Hacky fix for only part of background changing color
  svg.append("rect")
    .attr("x", -1)
    .attr("y", -1)
    .attr("width", 1)
    .attr("height", 1);
  svg.append("rect")
    .attr("x", 754)
    .attr("y", 700)
    .attr("width", 1)
    .attr("height", 1);
  */

  /*
  appendButtons(function() { blackout(); }, "LIGHTS", 
          "blackout-button");
  */

  svg.transition().style("opacity", "1.0");

};

// Enable rotation
/*
d3.select(window)
    .on("mousemove", mousemove)
    .on("mouseup", mouseup);
    */

var m0, dx, dy;
var mousePrev = [width / 2, height / 2];

var λ = d3.scale.linear()
    .domain([0, width])
    .range([-180, 180]);

var φ = d3.scale.linear()
    .domain([0, height])
    .range([90, -90]);

function mousedown() {
  // Calculate distance between this mouse click and previous mouse up
  dx = d3.event.pageX - mousePrev[0];
  dy = d3.event.pageY - mousePrev[1];
  d3.event.preventDefault();
  moveable = true;
};

function mousemove() {
  if (moveable) {
    // Set mouse event relative to previous mouse up to avoid twitchy rotation
    var m1 = [d3.event.pageX - dx, d3.event.pageY - dy];
    // Rotate the globe
  projection.rotate([λ(m1[0]), φ(m1[1])]);
  svg.selectAll("path").attr("d", path);
  }
};

function mouseup() {
  mousemove();
  mousePrev = [d3.event.pageX - dx, d3.event.pageY - dy];
  moveable = false;
};

function appendButtons(action, txt, id) {
  var button = svg.append("g")
    .attr("id", id)
    .on("click", action);

  var w = 60, h = 25;
  x = width / 2 - w /2;
  y = height - h - 10;

  button.append("rect")
      .attr("x", x)
      .attr("y", y)
      .attr("width", w)
      .attr("height", h)
      .attr("fill", "#333333");
  button.append("text")
      .attr("x", x)
      .attr("y", y)
      .attr("dx", 6)
      .attr("dy", "1.3em")
      .attr("fill", "#666666")
      .text(txt);
};

/*
function lightsOn() {
  // Background to light blue
  d3.select("body")
    .transition()
    .duration(TRANSITION_TIME)
    .style("background", "url(../img/textured_paper.png) repeat");

  // Header to dark grey
  d3.select("h1")
    .transition()
    .duration(TRANSITION_TIME)
    .style("color", "#141414");


  // Redraw the svg
  d3.select("svg").remove();
  svg = null;
  renderMap();
};

function blackout() {
  var dotOpacityScale = d3.scale.sqrt()
      .domain([0, 400])
      .range([0.3, 1]);

  d3.select("#blackout-button")
    .remove();

  appendButtons(function() { lightsOn() }, "LIGHTS", 
          "blackout-button");

  d3.selectAll(".subunit")
    .transition()
    .duration(TRANSITION_TIME)
    .style({"fill": "#1F1F1F",
        "opacity": "1.0"});

  d3.selectAll(".place-dot")
    .transition()
    .duration(TRANSITION_TIME)
    .style({"opacity": function(d) {
        return dotOpacityScale(d.properties.article_count);
      } 
    });

  // Page background to dark grey
  d3.select("body")
    .transition()
    .duration(TRANSITION_TIME)
    .style("background", "#141414");

  // Header text color to cobalt 
  d3.select("h1")
    .transition()
    .duration(TRANSITION_TIME)
    .style("color", "#273C5A");
};

function launchRandomUrl(country) {
  if (!articlesByCountry) {
    return console.warn("articles not cached");
  }
  if (country in articlesByCountry) {
    var articles = articlesByCountry[country]['articles'];
    var i = Math.floor(Math.random() * articles.length);
    var url = articles[i];
    var win = window.open(url, '_blank');
  }
}
*/

