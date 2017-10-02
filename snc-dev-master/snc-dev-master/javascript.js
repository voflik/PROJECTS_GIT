var http = createRequestObject();
var displayRating = '';
var currentId = '';

function createRequestObject() {
    var ro;
    var browser = navigator.appName;
    
    if(browser == "Microsoft Internet Explorer"){
        ro = new ActiveXObject("Microsoft.XMLHTTP");
    }
    else{
        ro = new XMLHttpRequest();
    }
    return ro;    
}



function updateRating(obj, rating) {
	var id = obj.title;
	var fullId = obj.id;
	var idName = fullId.substr(0, fullId.indexOf('_'));
	var totalRating = rating;
	currentId = idName;

    http.open('get', 'ajax.php?id='+id+'&idName='+idName);
    http.onreadystatechange = handleResponse;
    http.send(null);
}

function handleResponse() {
	if(http.readyState == 4){
        var response = http.responseText;
	
		if (response == 'ERROR'){
			alert("Sorry... Failed to update rating.");
		}
		else {
			alert("Thanks for your time.");
		}
       
        displayRating = response.substr(0, 4);
        document.getElementById(currentId+'_showrating').innerHTML = 'Rating: '+displayRating;
        totalRating = Math.ceil(response);   
        var obj = document.getElementById(currentId+'_'+totalRating);
        changeover(obj, totalRating);
		displayStars(rating, currentId);
    }
}

function changeover(obj, rating) {
	
	var imageName = obj.src;
	var id = obj.title;
	var index = imageName.lastIndexOf('/');
	var filename = imageName.substring(index+1);
	var fullId = obj.id;
	var idName = fullId.substr(0, fullId.indexOf('_'));
	var totalRating = rating;

	for(i=0; i<id; i++) {
		var num = i+1;
		
		if (num%2 == 0) {
			document.getElementById(idName+'_'+num).src = '_even1.jpg';			
		}
		else {
			document.getElementById(idName+'_'+num).src = '_odd1.jpg';
		}
	}

}

function changeout(obj, rating) {

	var imageName = obj.src;
	var id = obj.title;
	var index = imageName.lastIndexOf('/');
	var filename = imageName.substring(index+2);
	var fullId = obj.id;
	var idName = fullId.substr(0, fullId.indexOf('_'));
	var totalRating = rating;
	
	for(i=0; i<id; i++) {
		var num = i+1;
		
		if (num%2 == 0) {
			if(i < totalRating) {
				document.getElementById(idName+'_'+num).src = '__even1.jpg';			
			}
			else {
				document.getElementById(idName+'_'+num).src = 'even1.jpg';			
			}
		}
		else {
			if(i < totalRating) {
				document.getElementById(idName+'_'+num).src = '__odd1.jpg';			
			}
			else {
				document.getElementById(idName+'_'+num).src = 'odd1.jpg';			
			}
		}
	}
}

function displayStars(rating, idName) {

	document.write('<center>');
	
	for(i=0; i < 10; i++ ) {
		if(i%2 ==0) {
			if(i < rating) {
				document.write('<img src="__odd1.jpg" id="'+idName+'_'+(i+1)+'" title="'+(i+1)+'" onmouseout="changeout(this, '+rating+')" onmouseover="changeover(this, '+rating+')" onclick="updateRating(this, '+rating+')" />');
			}
			else {
				document.write('<img src="odd1.jpg" id="'+idName+'_'+(i+1)+'" title="'+(i+1)+'" onmouseout="changeout(this, '+rating+')" onmouseover="changeover(this, '+rating+')" onclick="updateRating(this, '+rating+')" />');
			}
		}
		else {
			if(i < rating) {
				document.write('<img src="__even1.jpg" id="'+idName+'_'+(i+1)+'" title="'+(i+1)+'" onmouseout="changeout(this, '+rating+')" onmouseover="changeover(this, '+rating+')" onclick="updateRating(this, '+rating+')" />');
			}
			else {
				document.write('<img src="even1.jpg" id="'+idName+'_'+(i+1)+'" title="'+(i+1)+'" onmouseout="changeout(this, '+rating+')" onmouseover="changeover(this, '+rating+')" onclick="updateRating(this, '+rating+')" />');
			}
		}
	}

	if (displayRating == '') {
		document.write('<br /><div class="ratingText" id="'+idName+'_showrating" >'+displayRating+'</div>');
	}
	else {
		document.write('<br /><div class="ratingText" id="'+idName+'_showrating" >'+totalRating+'</div>');
	}
	document.write('</center>');

}