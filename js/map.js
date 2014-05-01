//Query
var mouseCoordX,mourseCoordY;
var doc=document.documentElement, body=document.body;
document.onmousemove=getMouseXY;

function getMouseXY(e){
	// get offset of map from document
    var o = $("#map-container").offset();
    var oX = o.left;
    var oY = o.top;

	// get position of mouse cursor
    var mX = e.pageX;
    var mY = e.pageY;

	// set tooltip
    $("#hover-tooltip").css("left", (mX - oX + 10) + "px");
    $("#hover-tooltip").css("top", (mY - oY + 5) + "px");

    return true;
}

$("#hover-tooltip").fadeOut(0);

//Basemap Layer
var map=L.map('map',{zoomControl:true}).setView([42.32,-71.0636],12);
var baseMapUrl='http://b.tile.cloudmade.com/fbbd382757c549ddaf790bb6035c0822/110806/256/{z}/{x}/{y}.png';
var baseMapAttrib='';
var baseMap=L.tileLayer(baseMapUrl,{
	attribution: baseMapAttrib,
	minZoom: 12,
	maxZoom: 16
});
baseMap.addTo(map);

//D3
var color=d3.scale.quantize()
    .domain([277,6890])
    .range(["rgb(254,235,226)","rgb(251,180,185)","rgb(247,104,161)","rgb(197,27,138)","rgb(121,1,119)"]);
var electionColor=d3.scale.quantize()
    .domain([0,1])
    .range(["rgb(254,235,226)","rgb(251,180,185)","rgb(247,104,161)","rgb(197,27,138)","rgb(121,1,119)"]);
    
var svg=d3.select(map.getPanes().overlayPane).append("svg");
var g=svg.append("g").attr("class","leaflet-zoom-hide");

var selectedElection=""

d3.json("data/precincts.json",function(data){
		
	function projectPoint(x, y) {
	  var point = map.latLngToLayerPoint(new L.LatLng(y, x));
	  this.stream.point(point.x, point.y);
	}
	
	var transform = d3.geo.transform({point: projectPoint}),
    	path = d3.geo.path().projection(transform),
		bounds=path.bounds(data);
	
	var feature=g.selectAll("path")
	  .data(data.features)
	  .enter().append("path")
	  .attr("id",function(d){
		  return "map-precinct-"+d.properties.WDPCT;
	  })
	  .style("fill",function(d){
	    var value=d.properties.wdpct_elip;
	    if (value) {
		return color(value);
	    }else{
		return "#ccc";
	    }
	  })
	  .on("mouseover",function(d){ highlightFeature(d);})
	  .on("mouseout",function(d){ resetFeature(d);});
	

	map.on("viewreset",reset);
	reset();
	
	function reset(){
	  var bounds=path.bounds(data),
		  topLeft=bounds[0],
		  bottomRight=bounds[1];
		  
	  svg.attr("width",bottomRight[0]-topLeft[0])
		  .attr("height",bottomRight[1]-topLeft[1])
		  .style("margin-left",topLeft[0]+"px")
		  .style("margin-top",topLeft[1]+"px");
	  
	  g.attr("transform","translate("+ -topLeft[0]+","+ -topLeft[1]+")");
	  
	  feature.attr("d",path);
	}
	
	function projectPoint(x, y) {
		var point = map.latLngToLayerPoint(new L.LatLng(y, x));
		this.stream.point(point.x, point.y);
	}
	
	function highlightFeature(feature){
		$('#hover-tooltip').stop();
		$('#hover-tooltip').show();
		$(".dialog-title").html("<div align='left'><span class='thin-tooltip-label'>Ward: </span>"+feature.properties.WDPCT.substring(0,2)+"<span class='thin-tooltip-label'>&nbsp&nbsp&nbsp Precinct: </span>"+feature.properties.WDPCT.substring(2,4)+
					"<p><span class='thin-tooltip-label'>Eligible Voter Population (Est): </span>"+feature.properties.wdpct_elip+"</p></div>");
		if (selectedElection!="") {
		    $(".dialog-title").append("<div align='left'><p><span class='thin-tooltip-label'>Ballots Cast: </span>"+eval('feature.properties.'+selectedElection)+"</p><hr>"+
					"<p><span class='thin-tooltip-label'>Eligible Voter Participation: </span>"+(eval('feature.properties.'+selectedElection)/feature.properties.wdpct_elip*100).toFixed(2)+"%</p>"+
					"</div>");
		}
		
	}
	
	function resetFeature(feature){
		$('#hover-tooltip').stop();
		$("#hover-tooltip").hide();
		$(feature).css("fill-opacity",".1");
	}
});

//GeoSearch
new L.Control.GeoSearch({
	provider:new L.GeoSearch.Provider.Google(),
	position: 'topright',
	showMarker: false
}).addTo(map);

//Sidebar
var sidebar=d3.select("div#map-container").append("div");
sidebar.attr("class","map-sidebar");

//Change Election
function changeElection(electionID){
    selectedElection=electionID;
    d3.selectAll("path")
	.transition()
	.duration(800)
	.style("fill",function(d){
	    var value=eval('d.properties.'+selectedElection)/d.properties.wdpct_elip;
	    if (value) {
		return electionColor(value);
	    }else{
		return "#ccc";
	    }
	  });
    var label=$("#"+selectedElection).text();
    $('.map-title-label').text(label);
}
