// Userlist data array for filling in info box
var filmListData = [];

// DOM Ready =============================================================
$(document).ready(function() {
  // Populate the user table on initial page load
  populateTable('');
  // Username link click
  $('#filmList table tbody').on('click', 'td a.linkshowfilm', showFilmInfo);
  // Add User button click
  //$('#btnAddUser').on('click', addUser);
  // Search User button click
  $('#btnSearchFilm').on('click', searchFilm );
  // Delete User link click
  $('#filmList table tbody').on('click', 'td a.linkDetailfilm', detailFilm);

});

// Functions =============================================================

// Fill table with data
function populateTable(filmName) {

  //alert('populateTable userName:'+filmName);
  // Empty content string
  var tableContent = '';

  // jQuery AJAX call for JSON
  $.getJSON( '/films/filmlist?filmname='+filmName, function( data ) {

    // Stick our user data array into a userlist variable in the global object
    filmListData = data;

    // For each item in our JSON, add a table row and cells to the content string
    $.each(data, function(){
      tableContent += '<tr>';
      tableContent += '<td><a href="#" class="linkshowfilm" rel="' + this.original_title + '" title="Show Details">' + this.original_title + '</a></td>';
      tableContent += '<td>' + this.release_date + '</td>';
      tableContent += '<td><a href="#" class="linkDetailfilm" rel="' + this.original_title + '">detail</a></td>';
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
    var thisOriginal_title = $(this).attr('rel');
    //alert('thisOriginal_title:'+thisOriginal_title);
    // Get Index of object based on id value
    var arrayPosition = filmListData.map(function(arrayItem) { return arrayItem.original_title; }).indexOf(thisOriginal_title);

    // Get our User Object
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
    $('#XfilmInfoOverview').text(thisFilmObject.overview);
    $('#XfilmInfoPopularity').text(thisFilmObject.popularity);
    $("#XfilmInfoPoster_path").attr("src","https://image.tmdb.org/t/p/original/"+thisFilmObject.poster_path);
    $('#XfilmInfoRICO_path').text(thisFilmObject.RICO.path + ' ('+thisFilmObject.RICO.size/1000000+' Mo)');

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

        $('#XfilmInfoCredits_Cast_name0').text(thisFilmObject.credits.cast[0].name);
        $('#XfilmInfoCredits_Cast_character0').text(thisFilmObject.credits.cast[0].character);
        $('#XfilmInfoCredits_Cast_profile_path0').attr("src","https://image.tmdb.org/t/p/original/"+thisFilmObject.credits.cast[0].profile_path);
        $('#XfilmInfoCredits_Cast_profile_path0').attr("onclick","modal.style.display='none';populateTable('"+thisFilmObject.credits.cast[0].name+"');");

        $('#XfilmInfoCredits_Cast_name1').text(thisFilmObject.credits.cast[1].name);
        $('#XfilmInfoCredits_Cast_character1').text(thisFilmObject.credits.cast[1].character);
        $('#XfilmInfoCredits_Cast_profile_path1').attr("src","https://image.tmdb.org/t/p/original/"+thisFilmObject.credits.cast[1].profile_path);
        $('#XfilmInfoCredits_Cast_profile_path1').attr("onclick","modal.style.display='none';populateTable('"+thisFilmObject.credits.cast[1].name+"');");

        $('#XfilmInfoCredits_Cast_name2').text(thisFilmObject.credits.cast[2].name);
        $('#XfilmInfoCredits_Cast_character2').text(thisFilmObject.credits.cast[2].character);
        $('#XfilmInfoCredits_Cast_profile_path2').attr("src","https://image.tmdb.org/t/p/original/"+thisFilmObject.credits.cast[2].profile_path);
        $('#XfilmInfoCredits_Cast_profile_path2').attr("onclick","modal.style.display='none';populateTable('"+thisFilmObject.credits.cast[2].name+"');");

        $(window).scrollTop(0);

}

// Show User Info
function showFilmInfo(event) {
  //alert('showFilmInfo');
  // Prevent Link from Firing
  event.preventDefault();

  // Retrieve username from link rel attribute
  var thisOriginal_title = $(this).attr('rel');
  //alert('thisUserName:'+thisUserName);
  // Get Index of object based on id value
  var arrayPosition = filmListData.map(function(arrayItem) { return arrayItem.original_title; }).indexOf(thisOriginal_title);

  // Get our User Object
  var thisFilmObject = filmListData[arrayPosition];

  //Populate Info Box
  $('#filmInfoOriginal_title').text(thisFilmObject.original_title);
  $('#filmInfoRelease_date').text(thisFilmObject.release_date);
  $('#filmInfoOverview').text(thisFilmObject.overview);
  $('#filmInfoPopularity').text(thisFilmObject.popularity);
  $("#filmInfoPoster_path").attr("src","https://image.tmdb.org/t/p/original/"+thisFilmObject.poster_path);
};

// Search User
function searchFilm(event) {
  event.preventDefault();
  filmName=$('#searchFilm fieldset input#inputFilm').val();
  //alert('searchFilm:'+filmName);
  populateTable(filmName)
}

// Add User
function addUser(event) {
  event.preventDefault();

  // Super basic validation - increase errorCount variable if any fields are blank
  var errorCount = 0;
  $('#addUser input').each(function(index, val) {
    if($(this).val() === '') { errorCount++; }
  });

  // Check and make sure errorCount's still at zero
  if(errorCount === 0) {

    // If it is, compile all user info into one object
    var newUser = {
      'username': $('#addUser fieldset input#inputUserName').val(),
      'email': $('#addUser fieldset input#inputUserEmail').val(),
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
// Get the modal
var modal = document.getElementById('myModal');

// Get the button that opens the modal
var btn = document.getElementById("myBtn");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal
btn.onclick = function() {
    modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
	//alert('span.onclick');
  modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
	//alert('windows.onclick');
  if (event.target == modal) {
      modal.style.display = "none";
  }
}

  modal.style.display = "none";
