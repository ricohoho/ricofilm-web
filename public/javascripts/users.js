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
  $.getJSON( '/api/user/list', function( data ) {

    // Stick our user data array into a userlist variable in the global object
    userListData = data;
    nb_user=Object.keys(data).length;
    console.log(nb_user);
    //liste_resultat

    // For each item in our JSON, add a table row and cells to the content string
    $.each(data, function(){
      tableContent += '<tr>';
      tableContent += '<td>' + this.username + '</td>';
      tableContent += '<td>' + this.email + '</td>';
      tableContent += '<td>' + this.rolesString + '</td>';
      tableContent += '<td>' + this.status + '</td>';
      tableContent += '</tr>';
    });

    // Inject the whole content string into our existing HTML table
    $('#requestList table tbody').html(tableContent);
  });
};
