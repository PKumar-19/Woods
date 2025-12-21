/*--------------------------------------------------
Function Contact Formular
---------------------------------------------------*/	
		
	function ContactForm() {	
	
		if( $('#contact-formular').length > 0 ){
			
			$('#contactform').submit(function(){
				var action = $(this).attr('action');
				$("#message").slideUp(750,function() {
					$('#message').hide();
					$('#submit').attr('disabled','disabled');		
					$.post(action, {
						name: $('#name').val(),
						email: $('#email').val(),
						comments: $('#comments').val(),
						verify: $('#verify').val()
					},
					function(data){
						document.getElementById('message').innerHTML = data;
						$('#message').slideDown('slow');
						$('#contactform img.loader').fadeOut('slow',function(){$(this).remove()});
						$('#submit').removeAttr('disabled');
						if(data.match('success') != null) $('#contactform').slideUp('slow');		
					}
				);		
				});		
				return false;		
			});		
		}
		

	}//End ContactForm	


/*--------------------------------------------------
Function Contact Map
---------------------------------------------------*/	
		
	function ContactMap() {

		/* Google Maps (JS) usage note:
		   - This site previously used the Google Maps JavaScript API to render a styled map in the
		     `#map_canvas` element.
		   - Console error: RefererNotAllowedMapError means the API key is restricted and the
		     current local testing origin (e.g., http://127.0.0.1:5500) is not listed in the
		     key's allowed HTTP referrers.

		   How to enable the JS API map later:
		   1. Open Google Cloud Console → APIs & Services → Credentials.
		   2. Select the API key used in the <script src="https://maps.googleapis.com/..."> tag.
		   3. Under 'Application restrictions' choose 'HTTP referrers (web sites)' and add:
		        http://127.0.0.1:5500/*
		        http://localhost:5500/*
		      (adjust host/port as needed; include the trailing /*)
		   4. (Optional) Under 'API restrictions', restrict the key to the 'Maps JavaScript API'.
		   5. Save and wait a few minutes for changes to propagate.
		   6. Remove the early return below and re-enable map initialization code.

		   Quick re-enable steps in code:
		   - Remove or comment out the `return false;` below.
		   - Ensure your page loads the Maps JS script with your API key, e.g.:
		       <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&sensor=false"></script>
		   - Confirm no console errors (RefererNotAllowedMapError, ApiKeyInvalid), then map should load.

		   For now we use an iframe fallback (embed) which does not require the JS API key.
		*/

		// Temporarily disable JS map initialization while the API key/referrers are configured.
		// To re-enable, remove the `return false;` above and follow the Cloud Console steps.
		return false;	
	
		if( jQuery('#map_canvas').length > 0 ){					
			var latlng = new google.maps.LatLng(30.894450065756008, 76.95501183068768);
			var settings = {
				zoom: 15,
				disableDefaultUI: true,
				center: new google.maps.LatLng(30.894450065756008, 76.95501183068768),
				mapTypeControl: false,
				scrollwheel: false,
				draggable: true,
				panControl:false,
				scaleControl: false,
				zoomControl: false,
				streetViewControl:false,
				navigationControl: false};			
				var newstyle = [];
			var mapOptions = {
				styles: newstyle,
				mapTypeControlOptions: {
					 mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'holver']
				}
			};
			// Create map with safer options and diagnostics
			try {
				var mapOptionsMerged = Object.assign({}, mapOptions, {
					zoom: settings.zoom,
					center: settings.center,
					disableDefaultUI: settings.disableDefaultUI,
					scrollwheel: settings.scrollwheel,
					draggable: settings.draggable
				});
				var map = new google.maps.Map(document.getElementById("map_canvas"), mapOptionsMerged);
				console.log('ContactMap: map created', map);
			} catch (err) {
				console.error('ContactMap: map creation failed', err);
				return false;
			}
			if (typeof map !== 'undefined' && map) {
				if (newstyle && newstyle.length) {
					var mapType = new google.maps.StyledMapType(newstyle, { name:"Grayscale" });
					map.mapTypes.set('holver', mapType);
					map.setMapTypeId('holver');
				}
				google.maps.event.addListenerOnce(map, 'tilesloaded', function(){
					console.log('ContactMap: tilesloaded event fired');
				});
				setTimeout(function(){
					try { google.maps.event.trigger(map, 'resize'); map.setCenter(settings.center); console.log('ContactMap: forced resize/center after init'); } catch(e) { console.warn('ContactMap: resize failed', e); }
				}, 300);
				google.maps.event.addDomListener(window, "resize", function() {
					var center = map.getCenter();
					google.maps.event.trigger(map, "resize");
					map.setCenter(center);
				});
			} else {
				console.warn('ContactMap: map variable not available to set styles/listeners');
			}
						
			

			var contentString = '<div id="content-map-marker" style="text-align:center; padding-top:10px; padding-left:10px">'+
				'<div id="siteNotice">'+
				'</div>'+
				'<h4 id="firstHeading" class="firstHeading" style="color:#000!important; font-weight:600; margin-bottom:0px;">Hello Friend!</h4>'+
				'<div id="bodyContent">'+
				'<p color:#999; font-size:14px; margin-bottom:10px">Here we are. Come to drink a coffee!</p>'+
				'</div>'+
				'</div>';
			var infowindow = new google.maps.InfoWindow({
				content: contentString
			});
			var companyImage = new google.maps.MarkerImage('images/marker.png',
				new google.maps.Size(58,63), // Width and height of the marker
				new google.maps.Point(0,0),
				new google.maps.Point(35,20) // Position of the marker
			);
			var companyPos = new google.maps.LatLng(43.270441,6.640888);	
			var companyMarker = new google.maps.Marker({
				position: companyPos,
				map: map,
				icon: companyImage,               
				title:"Our Office",
				zIndex: 3});	
			google.maps.event.addListener(companyMarker, 'click', function() {
				infowindow.open(map,companyMarker);
			});	
		}
		
		return false
	
	}//End ContactMap