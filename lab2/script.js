function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function loadBooks(callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', '/books', true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let books = JSON.parse(xhr.responseText);
            callback(books);
        }
    };
    xhr.send();
}

function loadUsers(callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', '/users', true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let users = JSON.parse(xhr.responseText);
            callback(users);
        }
    };
    xhr.send();
}

function renderBooks(books) {
    let container = document.getElementById('books-container');
    container.innerHTML = '';  // Очистка контейнера перед рендером

    let old_empty_block = document.getElementById('empty-search');
    if (old_empty_block) {
        old_empty_block.remove();
    }

    if (books.length === 0) {
        let empty_block = document.createElement('div');
        empty_block.className = 'text-block empty-search';
        empty_block.innerHTML = '<p>Книги не были найдены :( ... Возможно Вам стоит ввести другой запрос, если такой имеется... </p>';
        
        container.appendChild(empty_block);
        return;
    }

    for (let i = 0; i < books.length; i++) {
        let book = books[i];
        
        let block = document.createElement('div');
        block.className = 'book-block';

        let img = document.createElement('img');
        img.src = 'books/covers/' + book.cover;
        img.alt = book.title;
        img.classList.add('book-cover');

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

function calculateUserRating(user) {
    let rating = user.rating; // Стартовый рейтинг
    let today = new Date();

    for (let i = 0; i < user.taked_books.length; i++) {
        let book = user.taked_books[i];
        let parts = book.date.split('.'); // ["30","12","2025"]
        let taken_date = new Date(parts[2], parts[1] - 1, parts[0]);
        let diff_time = today - taken_date;
        let diff_days = Math.floor(diff_time / (1000 * 60 * 60 * 24));

        if (diff_days <= 20) {
            rating += diff_days;
        }
        else {
            rating -= diff_days;
        }
    }

    return rating;
}

function renderUsers(users) {
    let container = document.getElementById('rating-container');

    for (let i = 0; i < users.length; i++) {
        users[i].calculatedRating = calculateUserRating(users[i]);
    }

    users.sort(function(a, b) {
        return b.calculatedRating - a.calculatedRating;
    });

    let block = document.createElement('div');
    block.className = 'text-block';

    let table = document.createElement('table');

    let thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>№</th>
            <th>Имя</th>
            <th>Рейтинг</th>
        </tr>
    `;
    table.appendChild(thead);

    let tbody = document.createElement('tbody');
    for (let i = 0; i < users.length; i++) {
        let user = users[i];
        let row = document.createElement('tr');
        row.innerHTML = `
            <td>${i + 1}</td>
            <td>${user.name}</td>
            <td>${user.calculatedRating}</td>
        `;
        tbody.appendChild(row);
    }

    table.appendChild(tbody);
    block.appendChild(table);

    container.innerHTML = '';
    container.appendChild(block);
}

async function hashPassword(password) {

    // crypto.subtle.digest возвращает Promise (обещание выдать результат в будущем [асинхронно]), поэтому
    // функция объявлена с async (является асинхронной) и используется await (ожидание результата Promise)

    let encoder = new TextEncoder();
    let byte_data = encoder.encode(password);                           // byte_data: Uint8Array([112, 97, 115, 115, 119, 111, 114, 100])
    let hash_buffer = await crypto.subtle.digest("SHA-256", byte_data); // 32 байтовый буффер [43, 255, 12, 14, ...]
    let hash_array = Array.from(new Uint8Array(hash_buffer));           // hash_array: [235, 45, 12, 9, ...]
    let hash = hash_array.map(function(b) {                             // hash_array.map(...): ["eb", "2d", "0c", "09", ...]
        return b.toString(16).padStart(2, '0');
    }).join('');                                                        // .join(''): "eb2d0c09..."
    return hash;
}

function renderTakenBooks(user) {
    let books_list = document.getElementById('books-list');
    books_list.innerHTML = ''; // Очиcтка контейнера

    if (!user.taked_books || user.taked_books.length === 0) {
        let empty_block = document.createElement('div');
        empty_block.id = 'no-books';
        empty_block.className = 'text-block empty-search';
        empty_block.innerHTML = '<p>У вас пока нет взятых книг.</p>';
        books_list.appendChild(empty_block);
        return;
    }

    for (let i = 0; i < user.taked_books.length; i++) {
        let book = user.taked_books[i];
        let block = document.createElement('div');
        block.className = 'book-item';

        block.innerHTML = `
            <p><strong>Код издания:</strong> ${book.edition_code}</p>
            <p><strong>Дата взятия:</strong> ${book.date}</p>
        `;

        books_list.appendChild(block);
    }
}

function returnBook(event) {
    event.preventDefault(); /* Отмена стандартной обработки event (мгновенной отправки из-за submit)*/

    let code = document.getElementById('ret-book-code-input').value;
    if (!code) {
        return;
    }

    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/return', true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                let data = JSON.parse(xhr.responseText);
                alert('Книга успешно возвращена!');

                current_user.rating = data.new_rating;
                current_user.taked_books = current_user.taked_books.filter(function(b) {
                    return b.edition_code !== code;
                });

                renderTakenBooks(current_user);
                location.reload(); // Обновление страницы для обновления доступных книг
            }
            else {
                let data = JSON.parse(xhr.responseText);
                alert(data.error || 'Ошибка возврата книги');
            }
        }
    };

    xhr.send(JSON.stringify({ edition_code: code }));
}

function showProfile(user) {
    let profile_section = document.getElementById('profile-section');
    let login_section = document.getElementById('login-section');
    let user_name = document.getElementById('user-name');
    let user_login = document.getElementById('user-login');
    let user_rating = document.getElementById('user-rating');

    login_section.style.display = 'none';
    profile_section.style.display = 'block';

    user_name.textContent = user.name;
    user_login.textContent = user.login;
    user_rating.textContent = calculateUserRating(user);

    renderTakenBooks(user);
}

function showLogin() {
    let profile_section = document.getElementById('profile-section');
    let login_section = document.getElementById('login-section');

    profile_section.style.display = 'none';
    login_section.style.display = 'block';
}

function checkSession() {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', '/me', true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                let user = JSON.parse(xhr.responseText);
                current_user = user;
                showProfile(user);
            }
            else {
                showLogin();
            }
        }
    };
    xhr.send();
}

function login(event) {
    event.preventDefault();

    let login_value = document.getElementById('login').value;
    let password_value = document.getElementById('password').value;

    hashPassword(password_value).then(function(phash) {
        let xhr = new XMLHttpRequest();
        xhr.open('POST', '/login', true);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    let user = JSON.parse(xhr.responseText);
                    current_user = user;
                    showProfile(user);
                }
                else {
                    alert('Неверный логин или пароль');
                }
            }
        };

        xhr.send(JSON.stringify({ login: login_value, phash: phash }));
    });
}


function logout() {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/logout', true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            showLogin();
        }
    };
    xhr.send();
}

function takeBook(event) {
    event.preventDefault();
    let edition_code = document.getElementById('take-book-code-input').value

    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/take', true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            let data = JSON.parse(xhr.responseText);

            if (xhr.status === 200) {
                alert('Книга успешно взята!');
                location.reload(); // Обновление страницы для обновления доступных книг
            } 
            else {
                alert(data.error || 'Ошибка при взятии книги');
            }
        }
    };

    xhr.send(JSON.stringify({ edition_code }));
}

function initProfileModule() {
    let login_form = document.getElementById('login-form');
    let logout_btn = document.getElementById('logout-btn');

    login_form.addEventListener('submit', login);
    logout_btn.addEventListener('click', logout);

    document.getElementById('take-book-form').addEventListener('submit', takeBook);
    document.getElementById('ret-book-form').addEventListener('submit', returnBook);

    checkSession();
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
            let timer;
            search_input.oninput = function() {
                clearTimeout(timer);
                timer = setTimeout(function() {
                    let query = search_input.value;
                    let filtered = searchBooks(books, query);
                    renderBooks(filtered);
                }, 300);
            };
        });
    }
    else if (file_name === 'rating.html') {
        loadUsers(renderUsers);
    }
    else if (file_name === 'profile.html') {
        initProfileModule()
    }
}

window.addEventListener('DOMContentLoaded', main);