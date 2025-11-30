function shuffle(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function renderBooks(books) {
    var container = document.getElementById('books-container');
    if (!container) return;  // Если контейнера нет, ничего не делать

    container.innerHTML = '';  // Очищаем контейнер перед новым рендерингом

    for (var i = 0; i < books.length; i++) {
        var book = books[i];
        
        var block = document.createElement('div');
        block.className = 'book-block';

        var img = document.createElement('img');
        img.src = 'assets/covers/' + book.cover;
        img.alt = book.title;

        var info = document.createElement('div');
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
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'books.json', true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var books = JSON.parse(xhr.responseText);
            callback(books);
        }
    };
    xhr.send();
}

function searchBooks(books, query) {
    if (!query) return books;  // Если запрос пустой, возвращаем все

    query = query.toLowerCase();  // Игнорируем регистр

    var results = [];
    for (var i = 0; i < books.length; i++) {
        var book = books[i];
        var matches = false;

        // Проверяем все поля на наличие подстроки
        if (book.title.toLowerCase().indexOf(query) !== -1) matches = true;
        else if (book.authors.join(', ').toLowerCase().indexOf(query) !== -1) matches = true;
        else if (book.publisher.toLowerCase().indexOf(query) !== -1) matches = true;
        else if (book.isbn.toLowerCase().indexOf(query) !== -1) matches = true;
        else if (book.edition_code.toLowerCase().indexOf(query) !== -1) matches = true;
        else if (book.pages.toString().indexOf(query) !== -1) matches = true;
        else if (book.available.toString().indexOf(query) !== -1) matches = true;
        else if (book.copies.toString().indexOf(query) !== -1) matches = true;
        // cover не проверяем, так как это имя файла, но если нужно — добавь

        if (matches) results.push(book);
    }
    return results;
}

function main() {
    var fileName = window.location.pathname.split('/').pop();

    if (fileName === 'index.html') {
        loadBooks(function(books) {
            var shuffled = shuffle(books);
            var random8 = shuffled.slice(0, 8);
            renderBooks(random8);
        });
    } else if (fileName === 'find.html') {
        var searchInput = document.getElementById('search-input');
        if (!searchInput) return;

        loadBooks(function(books) {
            renderBooks(books);
            var debounceTimer;
            searchInput.oninput = function() {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(function() {
                    var query = searchInput.value;
                    var filtered = searchBooks(books, query);
                    renderBooks(filtered);
                }, 300);
            };
        });
    }
}
main();