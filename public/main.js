addedBooks = [];

$(document).ready(function() {
  $('#search_button').on('click', function() {
    search();
  });
  $(document).keypress(function(e) {
    if (e.which == 13) {
      search();
    }
  });
  $('#set_button').on('click', function() {
    jQuery.ajax({
      type: 'POST',
      url: '/api/add-combo',
      dataType: 'text',
      data: JSON.stringify(addedBooks),
      contentType: 'application/json; charset=utf-8',
      success: function(data) {
        alert('Wissens-Datenbank erweitert!');
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR.responseText);
      },

      timeout: 3000,
    });
  });
});

/* function searchBook() {
  alert('test');
} */

function search() {
  url='https://www.googleapis.com/books/v1/volumes?key=AIzaSyCBgMekk7f1zxkI7PZkQJlCey0Qx1y5vgU&q=';
  query = $('#search_input').val();
  url += query;
  jQuery.ajax({
    url: url,
    type: 'GET',
    contentType: 'text/plain; charset=utf-8',
    success: function(data) {
      names = [];
      ul = $('#search_results').find('ul');
      ul.empty();
      for (i = 0; i < data['items'].length; i++) {
        ul.append('<li>' + data['items'][i]['volumeInfo']['title'] + '</li>'); +
        ul.find('li').last().data('bookInfo', data['items'][i]);
      }
      bookAddListener();
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log(errorThrown);
    },

    timeout: 3000,
  });
}

function bookAddListener() {
  ul = $('#search_results').find('ul');
  ul.find('li').on('click', function() {
    bookInfo = $(this).data('bookInfo');
    addedBooks.push(bookInfo);
    refreshAddedBooks();
  });
}

function bookRemoveListener() {
  ul = $('#addedBooks').find('ul');
  ul.find('li').on('click', function() {
    bookInfo = $(this).data('bookInfo');
    index = addedBooks.indexOf(bookInfo);
    addedBooks.splice(index, 1);
    refreshAddedBooks();
  });
}

function refreshAddedBooks() {
  // show added books
  ul = $('#addedBooks').find('ul');
  ul.empty();
  $('.hint').remove();
  for (i = 0; i < addedBooks.length; i++) {
    ul.append('<li>' + addedBooks[i]['volumeInfo']['title'] + '</li>');
    ul.find('li').last().data('bookInfo', addedBooks[i]);
  }
  // on click remove book again
  bookRemoveListener();
}
