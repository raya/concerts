/*
 app.js
 */

(function( $ ) {

  var artists,
      geocoder,
      geoIp = {},
      jqueryMap = {
        $errorField : $( '.error-msg').eq(0),
        mapElem : $( '#map-canvas')[0]
      },
      map,
      mapOptions = {
        zoom : 8,
        mapTypeId : google.maps.MapTypeId.ROADMAP
      },
      marker,
      markerOptions = {
        strokeColor : '#FF0000',
        strokeOpacity : 0.8,
        strokeWeight : 2,
        fillColor : '#FF0000',
        fillOpacity : 0.35,
        radius : 60000 //TODO - this is not accurate
      };

  // Initialize Google Maps
  function initializeMap() {
    map = new google.maps.Map(jqueryMap.mapElem, mapOptions);

    if ( "geolocation" in navigator ) {
      navigator.geolocation.getCurrentPosition(function( position ) {
        setGeoIp( position.coords.latitude, position.coords.longitude );
        initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        map.setCenter(initialLocation);

        // Set marker radius
        markerOptions.map = map;
        markerOptions.center = initialLocation;
        marker = new google.maps.Circle(markerOptions);
      });
    } else {
      console.log('geolocation not supported');
    }
  }

  // Save lat/long coordinates
  function setGeoIp( lat, long ) {
    geoIp.lat = lat;
    geoIp.long = long;
  }

  // Create new map with geocoded location
  function geocodeMap( address ) {
    geocoder = geocoder || new google.maps.Geocoder();
    geocoder.geocode({ 'address' : address}, function( results, status ) {
      if ( status == google.maps.GeocoderStatus.OK ) {
        // save results
        var latitude = results[0].geometry.location.lat();
        var longitude = results[0].geometry.location.lng();
        setGeoIp( latitude, longitude );

        // change map
        map.setCenter(results[0].geometry.location);
        markerOptions.map = map;
        markerOptions.center = results[0].geometry.location;
        marker.setMap(null); //clear previous marker
        marker = new google.maps.Circle(markerOptions);
      } else {
        jqueryMap.$errorField
          .empty()
          .append('We can\'t find this city. Try again');
      }
    });
  }

  // Change map of displayed city
  function onChangeCity( event ) {
    event.preventDefault();
    var address = $('form.location').find('input[id="city"]').val();
    if ( validateForm(address) ) {
      geocodeMap(address);
    }
  }

  // Get list of songkick metro ids
  function onNextPage( event ) {
    event.preventDefault();
    $.ajax({
      url : '/events',
      data : {
        user_coordinates : geoIp
      }
    }).done( function( concerts ) {
      console.log('concerts received');
    });
  }

  // Validate city input form and display error messages
  function validateForm( address ) {
    var text = $.trim(address);
    if ( text == "" ) {
      jqueryMap.$errorField.empty()
        .append('Form cannot be blank');
    } else {
      return text;
    }
  }

  // Get list of user's artists from their Rdio collection
  function getArtists() {
    $.ajax({
      url : '/users/new'
    }).done(function( concerts ) {
      artists = concerts;
      console.log('concerts returned', concerts);
    })
  }

  // Initialize page
  function init() {
    getArtists();
    initializeMap();
  }

  // Event Handlers
  $('form.location').on('submit', onChangeCity);
  $('form.next-section').on('submit', onNextPage);

  // Initialize the page
  init();

})(jQuery);