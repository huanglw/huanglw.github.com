$(document).ready(function(){
	getDate();
	setInterval("getDate()",1000);
});
function getDate(){
	var localDate = new Date();
	//$("#date").innerHTML = localDate.toLocaleDateString();
	//document.getElementById("date").innerHTML = localDate.toDateString();
	document.getElementById("date").innerHTML = localDate.toDateString(); 
}