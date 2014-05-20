(function( $ ) {

  var init = function() {
    $.ajax({
      url : '/users/new'
    }).done( function( concerts ) {
      console.log( 'concerts returned', concerts );
    })
  };

  init();
})(jQuery);