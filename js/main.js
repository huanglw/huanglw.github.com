$(document).ready(function(){
	// $("#advertise").show();
	// setTimeout("ad_hide()",5000);
	swal({
		  title: "Sweet!",
		  text: "Here's an advertisement.等待15秒",
		  imageUrl: "images/thumbs-up.jpg"
		});
	setTimeout("ad_hide()",15000);
});

function ad_hide(){
	//$("#advertise").hide();
	swal.close();
}