/*
 app.js
 */

(function( $ ) {

  var artists,
      geocoder,
      geoIp = {},
      jqueryMap = {
        $errorField : $('.error-msg').eq(0),
        $mainBox : $('.box').eq(0),
        mapElem : $('#map-canvas')[0],
        $overlay : $('.overlay').eq(0),
        $spinner : $('.spinner').eq(0)
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
      },
      spinner = $('.csspinner');

  // Initialize Google Maps
  function initializeMap() {
    map = new google.maps.Map(jqueryMap.mapElem, mapOptions);

    if ( "geolocation" in navigator ) {
      navigator.geolocation.getCurrentPosition(function( position ) {
        setGeoIp(position.coords.latitude, position.coords.longitude);
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
        setGeoIp(latitude, longitude);

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

  function displayConcerts( concerts ) {
    var $main = jqueryMap.$mainBox;

    // update heading
    $main.find('.box-header')
      .empty()
      .append('<h1>Events</h1>');

    var $events = $('.event-listings').eq(0);
    $events.removeClass('hide')
      .empty()
      .append(templatizer.event_listings({ concerts : concerts }));
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
  function onNextPage() {
    jqueryMap.$spinner.toggleClass('csspinner');
    jqueryMap.$overlay.toggleClass('hide');

    $.ajax({
      url : '/events',
      data : {
        user_coordinates : geoIp
      }
    }).done(function( concerts ) {
      jqueryMap.$overlay.toggleClass('hide');
      jqueryMap.$spinner.toggleClass('csspinner');
      console.log('concerts received', concerts);
      formatConcerts(concerts);
      displayConcerts(concerts);
    });
  }

  function formatConcerts( concerts ) {
    var i, origTime;
    for ( i = 0; i < concerts.length; i++ ) {
      concerts[i].formatted_start_date = moment(concerts[i].start.date).format('MMM DD');
      debugger;
      origTime = moment(concerts[i].start.time, 'HH');
      console.log('concerts[i].start.time', concerts[i].start.time );
      console.log('orig time:', origTime );
      concerts[i].start.time = origTime.format('hh:mmA');
    }
    return concerts;
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
  $('button[name="getEventsBtn"]').on('click', onNextPage);

  // Initialize the page
  init();

})(jQuery);