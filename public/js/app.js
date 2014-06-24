/*
 app.js
 */

(function( $ ) {

  var artists,
      geocoder,
      geoIp = {},
      initialStartDate = moment().format('MMMM Do'),
      jqueryMap = {
        $errorField : $('.error-msg').eq(0),
        $eventsBtn : $('button[name="getEventsBtn"]').eq(0),
        $events : $('.event-listings').eq(0),
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
      spinner = $('.csspinner'),
      startDate = moment().format('YYYY-MM-DD');

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
      appendError("We can't find your current location. Enter a city.");
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
        if ( marker ) {
          marker.setMap(null);
        } //clear previous marker if it exists
        marker = new google.maps.Circle(markerOptions);
      } else {
        appendError("We can't find this city. Try again");
      }
    });
  }

  function displayConcerts( concerts ) {
    var $eventDates = jqueryMap.$events.find('.search-dates').eq(0);
    var searchDate = 'For '
      + initialStartDate
      + ' - '
      + moment(startDate, 'YYYY-MM-DD').format('MMMM Do');

    $eventDates.empty()
      .append(searchDate);

    // Remove any listings which say event not found
    jqueryMap.$events.find('.empty-listings')
      .remove();

    jqueryMap.$events.removeClass('hide')
      .append(templatizer.event_listings({
        concerts : concerts
      }));
  }

  // Change map of displayed city
  function onChangeCity( event ) {
    event.preventDefault();
    var address = $('form.location').find('input[id="city"]').val();
    if ( validateForm(address) ) {
      geocodeMap(address);

      // Update UI if events were previously retrieved
      if ( !jqueryMap.$events.hasClass('hide') ) {
        startDate = moment().format('YYYY-MM-DD');
        jqueryMap.$eventsBtn
          .empty()
          .append('Show concerts');
        jqueryMap.$events
          .addClass('hide')
          .find('.event-wrapper')
          .remove();
      }
    }
  }

  // Get list of songkick metro ids
  function onGetEvents() {
    jqueryMap.$errorField
      .empty();

    if ( !hasUserLocation() ) {
      jqueryMap.$errorField
        .append('Please enter a city.');
      return;
    }

    toggleOverlay();

    $.ajax({
      url : '/events',
      data : {
        user_coordinates : geoIp,
        start_date : startDate
      }
    }).done(function( concerts ) {
      toggleOverlay();
      console.log('concerts received', concerts);
      incStartDate();
      jqueryMap.$eventsBtn
        .empty()
        .append('Check the next 7 days');
      formatConcerts(concerts);
      displayConcerts(concerts);
    });
  }

  function formatConcerts( concerts ) {
    var i, origTime;
    for ( i = 0; i < concerts.length; i++ ) {
      concerts[i].formatted_start_date = moment(concerts[i].start.date).format('MMM DD');
      if ( concerts[i].start.time == null ) {
        concerts[i].start.time = 'Unavailable';
      } else {
        origTime = moment(concerts[i].start.time, 'HH');
        concerts[i].start.time = origTime.format('hh:mmA');
      }
    }
    return concerts;
  }

  // Validate city input form and display error messages
  function validateForm( address ) {
    jqueryMap.$errorField.empty();

    var text = $.trim(address);
    if ( text == "" ) {
      appendError('Please enter a city.');
    } else {
      return text;
    }
  }

  // Get list of user's artists from their Rdio collection
  function getArtists() {
    $.ajax({
      url : '/users/new'
    }).fail(function( err ) {
      appendError('Error getting artist list. Please try again later.');
    }).done(function( concerts ) {
      artists = concerts;
      console.log('concerts returned', concerts);
    });
  }

  // toggle overlay and spinner
  function toggleOverlay() {
    jqueryMap.$overlay.toggleClass('hide');
    jqueryMap.$spinner.toggleClass('csspinner');
  }

  function hasUserLocation() {
    return geoIp.lat && geoIp.long;
  }

  function appendError( msg ) {
    jqueryMap.$errorField
      .empty()
      .append(msg);
  }

  function incStartDate() {
    startDate = moment(startDate, "YYYY-MM-DD").add('days', 7).format('YYYY-MM-DD');
  }

  // Initialize page
  function init() {
    getArtists();
    initializeMap();
  }

  // Event Handlers
  $('form.location').on('submit', onChangeCity);
  jqueryMap.$eventsBtn.on('click', onGetEvents );

  // Initialize the page
  init();

})(jQuery);