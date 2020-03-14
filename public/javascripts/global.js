// Userlist data array for filling in info box
var filmListData = [];
var filmPage=0;

// DOM Ready =============================================================
$(document).ready(function() {
  // Populate the user table on initial page load
  populateTable('');

  // Username link click
  $('#filmList table tbody').on('click', 'td a.linkshowfilm', showFilmInfo);
  // Add User button click
  $('#btnAddRequest').on('click', addResquest);
  // Search Film  button click
  $('#btnSearchFilm').on('click', searchFilm );

  $('#btnNext').on('click', searchFilmNext );
  $('#btnPrev').on('click', searchFilmPrev );

  // Delete User link click
  $('#filmList table tbody').on('click', 'td a.linkDetailfilm', detailFilm);

  $('#filmList table tbody').on('click', 'td a.linkshowRequestForm', showRequestForm);



});

//=== POPUP de de saisie d'un detail d'une demande de film
function showRequestForm(){
//== Position de ma Modal
  modal2.style.display = "block";
  modal2.style.position= "fixed";
  modal2.style.bottom= 10;
  modal2.style.right= 10;
  modal2.style.width= "400px";

  //== Reccuperation de l'id du Film
  // Prevent Link from Firing
  event.preventDefault();
  // Retrieve username from link rel attribute
  var this_id = $(this).attr('rel');
  //alert('thisOriginal_title:'+thisOriginal_title);
  // Get Index of object based on id value
  var arrayPosition = filmListData.map(function(arrayItem) {
     return arrayItem._id;
   }).indexOf(this_id);

  var thisFilmObject = filmListData[arrayPosition];
  $('#XRequestfilmInfoTitle').text(thisFilmObject.original_title+' ('+thisFilmObject.title+')');
  $('#XRequestRICO_file').text(thisFilmObject.RICO.file);
  $('#XRequestRICO_size').text(thisFilmObject.RICO.size);

  //alert(thisFilmObject.id);
  document.getElementById('inputId').value=thisFilmObject.id;
  document.getElementById('inputTitle').value=thisFilmObject.title;
  document.getElementById('inputRICO_file').value=thisFilmObject.RICO.file;
  document.getElementById('inputRICO_size').value=thisFilmObject.RICO.size;
  document.getElementById('inputRICO_fileDate').value=thisFilmObject.RICO.fileDate;
  //alert('inputId'+document.getElementById('inputId').value);


}

// Functions =============================================================
function populateTable(filmName) {
  //On indique la chaine de recherche si on relance automatiqement une recherche
  var inputFilm = document.getElementById('inputFilm');
  inputFilm.value=filmName;

  populateTablePage(filmName,0);
  populateCount(filmName);
}


function populateCount(filmName) {
  $.getJSON( '/films/list?filmname='+filmName+'&infocount=O', function( data ) {

      // For each item in our JSON, add a table row and cells to the content string
      //$.each(data, function(){
      //  console.log('count='+this.count)
     //});
     console.log('count='+data.count);
     $('#liste_resultat').text('Résultats ('+data.count+')');

  });
}

// Fill table with data
function populateTablePage(filmName,page) {
  //alert('populateTable userName:'+filmName);
  // Empty content string
  var tableContent = '';

  // jQuery AJAX call for JSON
  $.getJSON( '/films/list?filmname='+filmName+'&skip='+page, function( data ) {

    // Stick our user data array into a userlist variable in the global object
    filmListData = data;
    nb_film=Object.keys(data).length;
    console.log(nb_film);
    //liste_resultat

    // For each item in our JSON, add a table row and cells to the content string
    $.each(data, function(){
      tableContent += '<tr>';
      if (this.original_title!=this.title) {
        _titre= this.original_title + ' ('+this.title+') ';
      } else {
        _titre= this.original_title ;
      }

      if(this.RICO.StatusFichier=='OK') {
        StatusFichierImg='<A href="#" class=linkshowRequestForm rel="' + this._id + '" title="Reserver le film"><img width="10" src="../images/ok.png"></img></A>'
      } else  {
        StatusFichierImg='<A href="#" class=linkshowRequestForm><img width="10" src="../images/ko.png"></img></a>'
      }
      tableContent += '<td>'+StatusFichierImg+'<a href="#" class="linkshowfilm" rel="' + this._id + '" title="Show Details">' + _titre+' </a></td>';
      tableContent += '<td>' + this.release_date + '</td>';
      tableContent += '<td><a href="#" class="linkDetailfilm" rel="' + this._id + '">detail</a></td>';
      tableContent += '</tr>';
    });

    // Inject the whole content string into our existing HTML table
    $('#filmList table tbody').html(tableContent);
  });
};

function detailFilm(event) {
  // Prevent Link from Firing
  event.preventDefault();
  // Retrieve username from link rel attribute
  var this_id = $(this).attr('rel');
  //alert('thisOriginal_title:'+thisOriginal_title);
  // Get Index of object based on id value
  var arrayPosition = filmListData.map(function(arrayItem) {
     return arrayItem._id;
   }).indexOf(this_id);
  // Get our User Object
  detailFilmObjet(arrayPosition);
}

// == Popup Detail FILM
function detailFilmObjet(arrayPosition) {
    //alert('detailFilmObjet');
    var thisFilmObject = filmListData[arrayPosition];
    //======================detail rapide===============
    $('#filmInfoOriginal_title').text(thisFilmObject.original_title);
    $('#filmInfoRelease_date').text(thisFilmObject.release_date);
    $('#filmInfoOverview').text(thisFilmObject.overview);
    $('#filmInfoPopularity').text(thisFilmObject.popularity);
    $("#filmInfoPoster_path").attr("src","https://image.tmdb.org/t/p/original/"+thisFilmObject.poster_path);
    modal.style.display = "block";

    //=====================detail complet ==================
    $('#XfilmInfoOriginal_title').text(thisFilmObject.original_title+ ' ('+thisFilmObject.release_date+')');
    $('#XfilmInfoTitle').text(thisFilmObject.title);
    //alert(' '+thisFilmObject.credits.crew[0].name)
    $('#XfilmInfoCrew_Name0').text(thisFilmObject.credits.crew[0].name);
    $('#XfilmInfoCrew_Name0').attr("onclick","modal.style.display='none';populateTable('"+thisFilmObject.credits.crew[0].name+"');");
    $('#XfilmInfoOverview').text(thisFilmObject.overview);
    $('#XfilmInfoPopularity').text(thisFilmObject.popularity);
    $("#XfilmInfoPoster_path").attr("src","https://image.tmdb.org/t/p/original/"+thisFilmObject.poster_path);
    $('#XfilmInfoRICO_path').text(thisFilmObject.RICO.path + ' ('+thisFilmObject.RICO.size/1000000+' Mo) '+thisFilmObject.RICO.file);

    $('#XNextFilm').attr("onclick","detailFilmObjet("+(arrayPosition+1)+");");
    $('#XPrevFilm').attr("onclick","detailFilmObjet("+(arrayPosition-1)+");");

    //GENRE
    _genre='';
    for (var i=0; i<thisFilmObject.genres.length; i++) {
      var genre = thisFilmObject.genres[i];
      if (i>0)
        _genre=_genre + ','+genre.name;
      else {
        _genre=genre.name;
      }
    }
    $('#XfilmInfoGenre').text(_genre);

    //Country
    _production_country='';
    for (var i=0; i<thisFilmObject.production_countries.length; i++) {
      var production_country = thisFilmObject.production_countries[i];
      if (i>0)
        _production_country=_production_country + ','+production_country.name;
      else {
        _production_country=production_country.name;
      }
    }
    $('#XfilmInfoProduction_country').text(_production_country);

/*
    for (var i=0; i<thisFilmObject.credits.cast.length; i++) {
      $('#XfilmInfoCredits_Cast_name'+i).text(thisFilmObject.credits.cast[i].name);
      $('#XfilmInfoCredits_Cast_character'+i).text(thisFilmObject.credits.cast[i].character);
      $('#XfilmInfoCredits_Cast_profile_path'+i).attr("src","https://image.tmdb.org/t/p/original/"+thisFilmObject.credits.cast[i].profile_path);
      $('#XfilmInfoCredits_Cast_name'+i).attr("onclick","modal.style.display='none';populateTable('"+thisFilmObject.credits.cast[i].name+"');");
    }
*/
    //CASTING
    tableCastContent='<TR>';
    nb_cast= Math.min(thisFilmObject.credits.cast.length,10);
    for (var i=0; i<nb_cast; i++) {
      profile_path = thisFilmObject.credits.cast[i].profile_path;
      if(profile_path!=null) {
        tableCastContent +='<td><img  width="80" src="https://image.tmdb.org/t/p/original/'+thisFilmObject.credits.cast[i].profile_path+'"></td> )';
      }else {
        tableCastContent +='<td></td> )';
      }
    }
    tableCastContent += '</TR><TR>';
    for (var i=0; i<nb_cast; i++) {
      tableCastContent += '<td><a href="#" class="linkshowfilm" onclick="modal.style.display=\'none\';populateTable(\''+thisFilmObject.credits.cast[i].name+'\')" rel="' + thisFilmObject.credits.cast[i].name + '" title="Show Details">' +thisFilmObject.credits.cast[i].name + '</a>';
      tableCastContent += '<BR><span>' +thisFilmObject.credits.cast[i].character + '</span></TD>';
    };
    tableCastContent += '</TR>';

    // Inject the whole content string into our existing HTML table
    $('#filmCastList table tbody').html(tableCastContent);
    $(window).scrollTop(0);
}

// Show Film  Info [Partie gauchede la fenetre]
function showFilmInfo(event) {
  //alert('showFilmInfo');
  // Prevent Link from Firing
  event.preventDefault();
  // Retrieve username from link rel attribute
  var this_id = $(this).attr('rel');
  //alert('thisUserName:'+thisUserName);
  // Get Index of object based on id value
  var arrayPosition = filmListData.map(function(arrayItem) {
     return arrayItem._id; }
   ).indexOf(this_id);
  // Get our User Object
  var thisFilmObject = filmListData[arrayPosition];
  //Populate Info Box
  $('#filmInfoOriginal_title').text(thisFilmObject.original_title);
  $('#filmInfoRelease_date').text(thisFilmObject.release_date);
  $('#filmInfo_Rico_fileDate').text(thisFilmObject.RICO.fileDate.slice(0,10));
  if(thisFilmObject.RICO.StatusFichier=='OK') {
    $("#filmInfo_Rico_StatusFichier").attr("src","../images/ok.png");
  } else  {
    $("#filmInfo_Rico_StatusFichier").attr("src","../images/ko.png");
  }
  $('#filmInfoOverview').text(thisFilmObject.overview);
  $('#filmInfoPopularity').text(thisFilmObject.popularity);
  $("#filmInfoPoster_path").attr("src","https://image.tmdb.org/t/p/original/"+thisFilmObject.poster_path);
};

// Search User
function searchFilm(event) {
  filmPage=0;
  event.preventDefault();
  filmName=$('#searchFilm fieldset input#inputFilm').val();
  //alert('searchFilm:'+filmName);
  populateTable(filmName)
}

function searchFilmNext(event) {
  filmPage=filmPage+20;
  event.preventDefault();
  filmName=$('#searchFilm fieldset input#inputFilm').val();
  //alert('searchFilm:'+filmName);
  populateTablePage(filmName,filmPage);
}

function searchFilmPrev(event) {
  filmPage=filmPage-20;
  event.preventDefault();
  filmName=$('#searchFilm fieldset input#inputFilm').val();
  //alert('searchFilm:'+filmName);
  populateTablePage(filmName,filmPage);
}

// Add User
function addResquest(event) {
  alert('hoho');
  event.preventDefault();

  // Super basic validation - increase errorCount variable if any fields are blank
  var errorCount = 0;
  $('#addRequest input').each(function(index, val) {
    if($(this).val() === '') { errorCount++; }
  });

alert($('#addRequest fieldset input#inputId').val())
alert($('#addRequest fieldset input#inputUserName').val())
  // Check and make sure errorCount's still at zero
  if(errorCount === 0) {

    // If it is, compile all user info into one object
    var newUser = {
      'username': $('#addUser fieldset input#inputUserName').val(),
      'id': $('#addUser fieldset input#inputId').val(),
      'fullname': $('#addUser fieldset input#inputUserFullname').val(),
      'age': $('#addUser fieldset input#inputUserAge').val(),
      'location': $('#addUser fieldset input#inputUserLocation').val(),
      'gender': $('#addUser fieldset input#inputUserGender').val()
    }

    // Use AJAX to post the object to our adduser service
    $.ajax({
      type: 'POST',
      data: newUser,
      url: '/users/adduser',
      dataType: 'JSON'
    }).done(function( response ) {

      // Check for successful (blank) response
      if (response.msg === '') {

        // Clear the form inputs
        $('#addUser fieldset input').val('');

        // Update the table
        populateTable();

      }
      else {

        // If something goes wrong, alert the error message that our service returned
        alert('Error: ' + response.msg);

      }
    });
  }
  else {
    // If errorCount is more than 0, error out
    alert('Please fill in all fields');
    return false;
  }
};

// Delete User
function deleteUser(event) {

  event.preventDefault();

  // Pop up a confirmation dialog
  var confirmation = confirm('Are you sure you want to delete this user?');

  // Check and make sure the user confirmed
  if (confirmation === true) {

    // If they did, do our delete
    $.ajax({
      type: 'DELETE',
      url: '/users/deleteuser/' + $(this).attr('rel')
    }).done(function( response ) {

      // Check for a successful (blank) response
      if (response.msg === '') {
      }
      else {
        alert('Error: ' + response.msg);
      }

      // Update the table
      populateTable();

    });

  }
  else {

    // If they said no to the confirm, do nothing
    return false;

  }

};


//===============Gestion Modale ======================
// Get the modal Detail =====Film=====
var modal = document.getElementById('myModal');
// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];
// When the user clicks on <span> (x), close the modal
span.onclick = function() {
	//alert('span.onclick');
  modal.style.display = "none";
}


// Get the modal Detail request ===Request===
var modal2 = document.getElementById('myModal2');
// Get the <span> element that closes the modal
var span2 = document.getElementsByClassName("close2")[0];
// When the user clicks on <span> (x), close the modal
span2.onclick = function() {
	//alert('span.onclick');
  modal2.style.display = "none";
}


// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
	//alert('windows.onclick:'+event.target);
  //alert('modal:'+modal);
  if (event.target == modal) {
      //alert('=> Display= None');
      modal.style.display = "none";
  } else {
      //alert('=>  None');
      //modal.style.display = "none";
  }

}

  //Init de la viiblité et de la possition du détail
  modal.style.display = "none";
  modal2.style.display = "none";
  var domElement = document.getElementById('myModal');// don't go to to DOM every time you need it. Instead store in a variable and manipulate.
  domElement.style.position = "absolute";
  domElement.style.top = 0; //or whatever



  //domElement.style.left = 0; /
