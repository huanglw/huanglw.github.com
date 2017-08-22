(function() {

	document.write("<style>.not-yet {opacity:0}\
					.come-in {transform: translateY(10px);opacity:0;animation: come-in 0.8s ease forwards;}\
			 		.come-in:nth-child(odd) {animation-duration: 1s;}\
			 		@keyframes come-in {to { transform: translateY(0); opacity:1}}</style>");

	var isVisible = function(el) {
		var bottom_of_object = $(el).offset().top + ($(el).outerHeight() / 2);
		var bottom_of_window = $(window).scrollTop() +  window.innerHeight;
		bottom_of_window = bottom_of_window;  
		return( bottom_of_window > bottom_of_object );
	}

	var win = $(window);
	var allMods = $("img, .card");

	allMods.each(function(i, el) {
	  var el = $(el);
	  if (!isVisible(el))
	    el.addClass("not-yet"); 
	});

	win.scroll(function(event) {
	  allMods.each(function(i, el) {
	    var el = $(el);
	    if (isVisible(el)) {
	      	el.addClass("come-in"); 
	  		el.removeClass("not-yet"); 
	    } 
	  });
	});

})();
    


