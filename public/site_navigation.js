state = "";
library = [];

function getCookie(cname) {
  const name = cname + "=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(";");
  for (let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function getMyISBN(googleISBN) {
  for (k = 0; k < googleISBN.length; k++) {
    if (googleISBN[k]["type"]=="ISBN_13") {
      return googleISBN[k]["identifier"];
    }
  }
}

function changeBookFormat(book) {
  const newBook = {};
  newBook["isbn"] = getMyISBN(book["volumeInfo"]["industryIdentifiers"]);
  newBook["title"] = book["volumeInfo"]["title"];
  newBook["author"] = book["volumeInfo"]["authors"] == undefined ?
      "" : book["volumeInfo"]["authors"][0];
  newBook["description"] = book["volumeInfo"]["description"];
  newBook["thumbnail"] = book["volumeInfo"]["imageLinks"]["thumbnail"];
  return newBook;
}

/* function getBookFromISBN(isbn, onFinished) {
  // search request with ISBN to google books api
  url = "https://www.googleapis.com/books/v1/volumes?key=AIzaSyCBgMekk7f1zxkI7PZkQJlCey0Qx1y5vgU&q="
   + isbn;

  jQuery.ajax({
    url: url,
    type: "GET",
    contentType: "text/plain; charset=utf-8",
    success: function(data) {
      onFinished(data["items"][0]);
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log(jqXHR);
      console.log(textStatus);
      console.log(errorThrown);
    },

    timeout: 3000,
  });
} */

$(document).ready(function() {
  setupNavigation("#was_kann");
  setupNavigation("#preise");
  setupNavigation("#einloggen");
  setupNavigation("#registrieren");

  setupNavigation("#my_books");
  setupNavigation("#my_recommendations");

  setupFormEvents();

  state="#my_books";
  refreshPage();
});

/* ================= BASIC SITE NAVIGATION =================== */

function refreshPage() {
  if (isLoggedIn()) {
    $("#header_default").hide();
    $("#header_logged_in").show();
    $("#header_logged_in").css("display", "flex");
  } else {
    $("#header_logged_in").hide();
    $("#header_default").show();
    $("#header_default").css("display", "flex");
  }

  if (!$(state + "_content").is(":visible")) {
    $(".content").fadeOut().promise().done(function() {
      $(state + "_content").fadeIn();
    });
  }
  $(".hint").hide();
  $("#book_search_results").empty();

  if (getCookie("email") != "") {
    fetchLibrary();
  }
}

function setupNavigation(name) {
  $(name + "_navigation").on("click", function() {
    state = name;
    refreshPage();
  });
}
function setupFormEvents() {
  // register form
  $("#register_button").on("click", function() {
    register();
  });

  // login form
  $("#login_button").on("click", function() {
    login();
  });

  $("#book_search_button").on("click", function() {
    searchBook();
  });

  // form sending with enter
  $(document).keypress(function(e) {
    if (e.which == 13) {
      switch (state) {
        case "#einloggen":
          login();
          break;
        case "#registrieren":
          register();
          break;
        case "#my_books":
          searchBook();
          break;
        default:
          break;
      }
    }
  });

  // logout "form"
  $("#ausloggen_navigation").on("click", function() {
    document.cookie = "email=x; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    document.cookie = "token=x; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    state = "#einloggen";
    refreshPage();
  });
}

function searchBook() {
  url="https://www.googleapis.com/books/v1/volumes?key=AIzaSyCBgMekk7f1zxkI7PZkQJlCey0Qx1y5vgU&q=";
  query = $("#book_search_input").val();
  url += query;

  // search request to google books api
  console.log("[GOOGLE BOOKS API] - searching");
  jQuery.ajax({
    url: url,
    type: "GET",
    contentType: "text/plain; charset=utf-8",
    success: function(data) {
      // show search results in book_search_results
      bookContainer = $("#book_search_results");
      bookContainer.empty();
      if (data["totalItems"] == 0) {
        $("#search_result_hint").slideDown();
      } else {
        $("#search_result_hint").slideUp();
        books = data["items"];
        for (let i = 0; i < books.length; i++) {
          // for each book in search results add a div.book
          book = changeBookFormat(books[i]);
          statusPart = "<img src=\"res/add.svg\" class=\"book_status\"/>";

          // set status button
          for (j = 0; j < library.length; j++) {
            if (library[j]["isbn"] == book["isbn"]) {
              statusPart = "<img src=\"res/delete.svg\" class=\"book_status\"/>";
            }
          }

          // append div.book to the bookContainer
          bookContainer.append("<div class=\"book\">"
                         + statusPart
                         + "<img src=\"" + book["thumbnail"]
                         + "\" class=\"book_cover\"/>"
                         + "<div class=\"book_text_container\">"
                         + "<p class=\"book_author\">" + book["author"] + "</p>"
                         + "<p class=\"book_title\">" + book["title"] + "</p>"
                         + "</div></div>");
          bookContainer.find(".book").last().data("book_info", book);
        }
        // alternating-width-layout
        for (let i = 0; i < $(".book").length; i++) {
          if (Math.ceil(i/2)%2==0) {
            $(".book").eq(i).css({width: "calc(38% - 70px)"});
          } else {
            $(".book").eq(i).css({width: "calc(62% - 70px)"});
          }
        }
        bookInteractListener();
      }
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log(errorThrown);
    },

    timeout: 3000,
  });
}

function fetchLibrary() {
  const myUrl = "/api/get-library/" + getCookie("email");
  jQuery.ajax({
    type: "GET",
    url: myUrl,
    contentType: "text/plain; charset=utf-8",
    success: function(data) {
      if (data=="not authorized") {
        alert("not authorized");
      } else {
        library = data;
        updateLibraryHTML();
      }
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log(jqXHR.responseText + ";" + textStatus + ";" + errorThrown);
      alert("something went wrong...");
    },

    timeout: 3000,
  });
}

function updateLibraryHTML() {
  const bookContainer = $("#my_books");
  bookContainer.empty();

  library.forEach((book)=>{
    // for each book in search results add a div.book
    authorPart = "";
    statusPart = "<img src=\"res/delete.svg\" class=\"book_status\"/>";
    if (book["author"] != undefined) {
      authorPart = "<p class=\"book_author\">" + book["author"] + ":</p>";
    }
    bookContainer.append("<div class=\"book\">"
          + statusPart
          + "<img src=\"" + book["thumbnail"]
          + "\" class=\"book_cover\"/>"
          + "<div class=\"book_text_container\">"
          + authorPart
          + "<p class=\"book_title\">" + book["title"] + "</p>"
          + "</div></div>");
    bookContainer.find(".book").last().data("book_info", book);
    bookInteractListener();
  });
}

function bookInteractListener() {
  bookContainer = $("#book_search_container, #my_books");
  books = bookContainer.find(".book_status");
  books.off();
  books.on("click", function() {
    book = $(this).closest(".book");
    bookData = book.data("book_info");
    button = $(this);
    button.addClass("turn");
    setTimeout(
        function() {
          button.removeClass("turn");
        }, 550);
    newSrc = "res/delete.svg";
    url = "/api/add-book";
    for (j = 0; j < library.length; j++) {
      if (library[j]["isbn"] == bookData["isbn"]) {
        url="/api/remove-book";
        newSrc="res/add.svg";
      }
    }
    jQuery.ajax({
      "url": url,
      "type": "POST",
      "dataType": "text",
      "data": JSON.stringify({"email": getCookie("email"), "book": bookData}),
      "contentType": "application/json; charset=utf-8",
      "success": function(data) {
        if (data=="okay") {
          button.attr("src", newSrc);
          fetchLibrary();
        } else if (data=="not authorized") {
          alert("not authorized");
        } else {
          console.log(data);
        }
      },
      "error": function(jqXHR, textStatus, errorThrown) {
        console.log(errorThrown);
      },

      "timeout": 3000,
    });
    bookInteractListener();
  });
}

function register() {
  email = $("#register_email").val();
  password = $("#register_password").val();
  payload = {"email": email, "password": password};

  jQuery.ajax({
    type: "POST",
    url: "/api/register-user",
    dataType: "text",
    data: JSON.stringify(payload),
    contentType: "application/json; charset=utf-8",
    success: function(data) {
      $(".content").fadeOut(200).promise().done(function() {
        $("#registered_content").fadeIn(200);
      });
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log(jqXHR.responseText + ";" + textStatus + ";" + errorThrown);
      alert("something went wrong...");
    },

    timeout: 3000,
  });
}

function login() {
  email = $("#login_email").val();
  password = $("#login_password").val();

  jQuery.ajax({
    type: "POST",
    url: "/api/login-user",
    dataType: "text",
    data: JSON.stringify({"email": email, "password": password}),
    contentType: "application/json; charset=utf-8",
    success: function(data) {
      if (data=="okay") {
        $(".content").fadeOut(200).promise().done(function() {
          $("#logged_in_content").fadeIn(200);
        });
        refreshPage();
      } else {
        hint = $("#einloggen_content").find(".hint");
        if (hint.is(":visible")) {
          hint.slideUp().promise().done(function() {
            $("#einloggen_content").find(".hint").slideDown();
          });
        } else {
          $("#einloggen_content").find(".hint").slideDown();
        }
      }
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log(jqXHR.responseText + ";" + textStatus + ";" + errorThrown);
      alert("something went wrong...");
    },

    timeout: 3000,
  });
}

function isLoggedIn() {
  if (document.cookie.split(";").filter(function(item) {
    return item.indexOf("token=") >= 0;
  }).length) {
    return true;
  }
  return false;
}
