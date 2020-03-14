// Userlist data array for filling in info box
var filmListData = [];
var filmPage=0;

// DOM Ready =============================================================
$(document).ready(function() {
  // Populate the user table on initial page load
  populateTable('');
});


// Functions =============================================================
function populateTable(filmName) {
  //On indique la chaine de recherche si on relance automatiqement une recherche
  populateTablePage(filmName,0);
}


function populateTablePage(filmName,page) {
  //alert('populateTable userName:'+filmName);
  // Empty content string
  var tableContent = '';

  // jQuery AJAX call for JSON
  $.getJSON( '/request/list?username='+filmName, function( data ) {

    // Stick our user data array into a userlist variable in the global object
    filmListData = data;
    nb_film=Object.keys(data).length;
    console.log(nb_film);
    //liste_resultat

    // For each item in our JSON, add a table row and cells to the content string
    $.each(data, function(){
      tableContent += '<tr>';
      tableContent += '<td>' + this.username + '</td>';
      tableContent += '<td>' + this.id + '</td>';
      tableContent += '<td>' + this.title + '</td>';
      tableContent += '<td>' + this.RICO_file + '</td>';
      tableContent += '<td>' + this.RICO_size + '</td>';
      tableContent += '<td>' + this.RICO_filedate + '</td>';
      tableContent += '<td>' + this.RICO_StatusFichier + '</td>';
      tableContent += '</tr>';
    });

    // Inject the whole content string into our existing HTML table
    $('#requestList table tbody').html(tableContent);
  });
};
