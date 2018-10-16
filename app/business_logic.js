/* function isbnCheck(isbnA, isbnB) {
  if (isbnA['ISBN_10'] == isbnB['ISBN_10'] ||
        isbnA['ISBN_13'] == isbnB['ISBN_13']) {
    return true;
  }
  return false;
} */

function getMyISBN(googleISBN) {
  for (i = 0; i < googleISBN.length; i++) {
    if (googleISBN[i]["type"]=="ISBN_13") {
      return googleISBN[i]["identifier"];
    }
  }
}

module.exports = function(app, db, auth) {
  /* ===== ADD A BOOK TO THE USERS LIBRARY =====*/
  app.post("/api/add-book", function(req, res) {
    const email = req.body["email"];
    const book = req.body["book"];

    // check if the book already is in local library
    let alreadyInLibrary = false;
    for (let i = 0; i < db.get("books").size(); i++) {
      if (book["isbn"] == db.get("books").value()[i]["isbn"]) {
        alreadyInLibrary = true;
        break;
      }
    }
    if (!alreadyInLibrary) {
      db.get("books").push({"isbn": isbn, "title": book["title"],
        "author": ["author"],
        "description": book["description"],
        "thumbnail": ["thumbnail"]}).write();
    }

    // actually add the book to the users library
    if (auth.isAuthorized(req, email)) {
      const library = db.get("users").find({"email": email}).value()["library"];
      let inPersonalLibrary = false;
      for (let i = 0; i < library.length; i++) {
        if (library[i] == book["isbn"]) {
          inPersonalLibrary = true;
        }
      }
      if (!inPersonalLibrary) {
        library.push(book["isbn"]);
        db.get("users").find({"email": email}).assign({"library": library}).write();
      }
      res.send("okay");
    } else {
      res.send("not authorized");
    }
  });

  /* ===== REMOVE BOOK =====*/
  app.post("/api/remove-book", function(req, res) {
    const email = req.body["email"];
    const book = req.body["book"];

    // rewrite isbn syntax
    const isbn = book["isbn"];

    // remove the book from the users library
    if (auth.isAuthorized(req, email)) {
      const library = db.get("users").find({"email": email}).value()["library"];
      const index = library.indexOf(isbn);
      library.splice(index, 1);
      db.get("users").find({"email": email}).assign({"library": library}).write();
      res.send("okay");
    } else {
      res.send("not authorized");
    }
  });

  /* ===== GET LIBRARY =====*/
  app.get("/api/get-library/:email", function(req, res) {
    const email = req.params.email;

    if (auth.isAuthorized(req, email)) {
      const result = [];
      const library = db.get("users").find({"email": email}).value()["library"];

      library.forEach((isbn) =>{
        const book = db.get("books").find({"isbn": isbn}).value();
        result.push(book);
      });
      res.send(result);
    } else {
      res.send("not authorized");
    }
  });

  /* ===== GET TOTAL BOOK-COUNT =====*/
  app.get("/api/total-count", function(req, res) {
    const result = {"total-count": db.get("books").size().value()};
    res.send(result);
  });

  /* ===== SEARCH FOR A BOOK IN LOCAL DB =====*/
  /* app.get('/api/find-book/:searchquery', function(req, res) {
    const query = req.params.searchquery;
    const queryBooks = [];
    books = db.get('books').value();

    for (i = 0; i < db.get('books').size().value(); i++) {
      book = books[i];
      if (book['title'].toLowerCase().includes(query.toLowerCase())) {
        query_books.push(book);
      }
    }

    res.send(query_books);
  }); */


  /* ===== ADD A COMBO =====
  app.post('/api/add-combo', function(req, res) {
    addedBooks = req.body;
    books = db.get('books');
    combos = [];

    // look if new books have to be added to local database and add them if neccessairy
    for (i = 0; i < added_books.length; i++) {
      alreadyExists = false;
      for (j = 0; j < books.length; j++) {
        if (books[j]['isbn']==added_books[i]['volumeInfo']['industryIdentifiers']) {
          alreadyExists = true;
        }
      }

      // rewrite isbn-object-syntax
      isbnObject = {};
      isbnObject['ISBN_10'] = added_books[i]['volumeInfo']['industryIdentifiers'][0]['identifier'];
      isbnObject['ISBN_13'] = added_books[i]['volumeInfo']['industryIdentifiers'][1]['identifier'];

      if (!alreadyExists) {
        db.get('books').push({'isbn': isbn_object, 'title': added_books[i]['volumeInfo']['title'],
            'authors': added_books[i]['volumeInfo']['authors'],
            'description': added_books[i]['volumeInfo']['description']}).write();
      }

      combos.push(isbn_object);
    }
    // add the combo to the database
    db.get('combos').push(combos).write();
    res.send('okay');
  }); */

  /* ===== GET RECOMMENDATION =====*/
  app.post("/api/get-recommendation", function(req, res) {
    bookIds = req.body;
    combos = db.get("combos");
    recommendedBooks = {};

    // for every combo
    for (i = 0; i < combos.size().value(); i++) {
      combo = combos.value()[i]["book-ids"];
      // for every book in this combo
      for (j = 0; j < combo.length; j++) {
        comboBook = combo[j];
        // for every book in the user input
        for (k = 0; k < bookIds.length; k++) {
          book = bookIds[k];
          // if user input book is contained in combo then
          if (book == comboBook) {
            // add all books from this combo into recommendation
            for (l = 0; l < combo.length; l++) {
              valueBefore = recommendedBooks[combo[l]];
              if (valueBefore == undefined) {
                valueBefore = 0;
              }
              recommendedBooks[combo[l]] = valueBefore+1;
            }
          }
        }
      }
    }
    // remove the already known books
    for (i = 0; i < Object.keys(recommendedBooks).length; i++) {
      recommendedBooks = Object.keys(recommendedBooks)[i];
      for (j = 0; j < bookIds.length; j++) {
        book = bookIds[j];
        if (book == recommendedBooks) {
          console.log(book);
          recommendedBooks[recommended_book] = undefined;
        }
      }
    }
    res.send(recommendedBooks);
  });
  return this;
};
module.exports.setAuth = function(using) {
  auth = using;
};
