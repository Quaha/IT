function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function renderBooks(books) {
    let container = document.getElementById('books-container');
    if (container == null) {
        return;
    }
    container.innerHTML = '';  // Очистка контейнера перед рендером

    for (let i = 0; i < books.length; i++) {
        let book = books[i];
        
        let block = document.createElement('div');
        block.className = 'book-block';

        let img = document.createElement('img');
        img.src = 'assets/covers/' + book.cover;
        img.alt = book.title;

        let info = document.createElement('div');
        info.className = 'book-info';
        info.innerHTML = 
            '<p><strong>Название:</strong> ' + book.title + '</p>' +
            '<p><strong>Авторы:</strong> ' + book.authors.join(', ') + '</p>' +
            '<p><strong>Число страниц:</strong> ' + book.pages + '</p>' +
            '<p><strong>Издательство:</strong> ' + book.publisher + '</p>' +
            '<p><strong>ISBN:</strong> ' + book.isbn + '</p>' +
            '<p><strong>Экземпляры:</strong> ' + book.available + ' из ' + book.copies + '</p>' +
            '<p><strong>Код издания:</strong> ' + book.edition_code + '</p>';

        block.appendChild(img);
        block.appendChild(info);
        container.appendChild(block);
    }
}

function loadBooks(callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', 'books.json', true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let books = JSON.parse(xhr.responseText);
            callback(books);
        }
    };
    xhr.send();
}

function searchBooks(books, query) {
    if (query == "") {
        return [];
    }

    query = query.toLowerCase();

    let results = [];
    for (let i = 0; i < books.length; i++) {
        let book = books[i];
        let is_substr = false;

        // Проверка вхождения подстроки
        if (book.title.toLowerCase().indexOf(query) !== -1) {
            is_substr = true;
        }
        else if (book.authors.join(', ').toLowerCase().indexOf(query) !== -1) {
            is_substr = true;
        }
        else if (book.publisher.toLowerCase().indexOf(query) !== -1) {
            is_substr = true;
        }
        else if (book.isbn.toLowerCase().indexOf(query) !== -1) {
            is_substr = true;
        }
        else if (book.edition_code.toLowerCase().indexOf(query) !== -1) {
            is_substr = true;
        }
        else if (book.pages.toString().indexOf(query) !== -1) {
            is_substr = true;
        }
        else if (book.available.toString().indexOf(query) !== -1) {
            is_substr = true;
        }
        else if (book.copies.toString().indexOf(query) !== -1) {
            is_substr = true;
        }

        if (is_substr) {
           results.push(book); 
        }
    }
    return results;
}

function main() {
    let file_name = window.location.pathname.split('/').pop();

    if (file_name === 'index.html') {
        loadBooks(function(books) {
            let shuffled = shuffle(books);
            let random8 = shuffled.slice(0, 8);
            renderBooks(random8);
        });
    } 
    else if (file_name === 'find.html') {
        let search_input = document.getElementById('search-input');

        loadBooks(function(books) {
            let debounceTimer;
            search_input.oninput = function() {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(function() {
                    let query = search_input.value;
                    let filtered = searchBooks(books, query);
                    renderBooks(filtered);
                }, 300);
            };
        });
    }
}

main();