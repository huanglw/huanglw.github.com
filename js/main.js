$(document).ready(function(){
	// $("#advertise").show();
	// setTimeout("ad_hide()",5000);
	swal({
		  title: "Sweet!",
		  text: "Here's a custom image.",
		  imageUrl: "images/thumbs-up.jpg"
		});
	setTimeout("ad_hide()",5000);
});

function ad_hide(){
	//$("#advertise").hide();
	swal.close();
}