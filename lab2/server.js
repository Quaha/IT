const express = require('express');
const fs = require('fs');
const body_parser = require('body-parser');
const cookie_parser = require('cookie-parser');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

app.use(express.static(__dirname));
app.use(body_parser.json());
app.use(cookie_parser());

// Возвращает строку из 16 байтовых чисел для поддержания сессии
function generateSessionToken() {
    return crypto.randomBytes(16).toString('hex'); // "9f2b4e7c1a3d5f6e8b0c1d2e3f4a5b6c"
}

const sessions = {}; // { "a1b2c3d4...": "login1", "f5e6d7c8...": "login2" }

// Отправка books.json
app.get('/books', function(req, res) {
    let data = fs.readFileSync(__dirname + '/books/books.json');
    res.json(JSON.parse(data));
});

// Отправка users.json
app.get('/users', function(req, res) {
    let data = fs.readFileSync(__dirname + '/users/users.json');
    res.json(JSON.parse(data));
});

// Вход в аккаунт
app.post('/login', (req, res) => {
    let {login, phash} = req.body;

    let auth_data = JSON.parse(fs.readFileSync(__dirname + '/users/users_auth.json'));
    let user_auth_info = auth_data.find(function(u) {
        return u.login === login && u.phash === phash;
    });

    if (!user_auth_info) {
        return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    let users_data = JSON.parse(fs.readFileSync(__dirname + '/users/users.json'));
    let user_data = users_data.find(function(u) {
        return u.login === login;
    });

    let session_token = generateSessionToken();
    sessions[session_token] = login;

    res.cookie('session', session_token, { httpOnly: true });
    res.json(user_data);
});

// Получение информации о пользователе
app.get('/me', (req, res) => {
    let session_token = req.cookies.session;
    if (!session_token || !sessions[session_token]) {
        return res.status(401).json({ error: 'Вы не авторизованы' });
    }

    let login = sessions[session_token];
    let users_data = JSON.parse(fs.readFileSync(__dirname + '/users/users.json'));
    let user_data = users_data.find(function(u) {
        return u.login === login;
    });

    res.json(user_data);
});

// Выход из аккаунта
app.post('/logout', (req, res) => {
    let session_token = req.cookies.session;
    if (session_token) {
        delete sessions[session_token];
    }
    res.clearCookie('session');
    res.json({ ok: true });
});

// Взятие книги
app.post('/take', (req, res) => {
    let sessionToken = req.cookies.session;
    if (!sessionToken || !sessions[sessionToken]) {
        return res.status(401).json({ error: "Вы не авторизованы" });
    }

    let login = sessions[sessionToken];
    let edition_code = req.body.edition_code;

    if (!edition_code) {
        return res.status(400).json({ error: "Не указан код издания" });
    }

    let books_path = __dirname + '/books/books.json';
    let users_path = __dirname + '/users/users.json';

    let books = JSON.parse(fs.readFileSync(books_path));
    let users = JSON.parse(fs.readFileSync(users_path));

    let book = books.find(function(b) {
        return b.edition_code === edition_code;
    });
    if (!book) {
        return res.status(404).json({ error: "Книга с таким кодом не найдена" });
    }

    if (book.available < 1) {
        return res.status(400).json({ error: "Нет доступных экземпляров" });
    }

    let user = users.find(function(u) {
        return u.login === login;
    });

    if (user.taked_books.some(function(b) {
        return b.edition_code === edition_code;
    })) {
        return res.status(400).json({ error: "Вы уже имеете такую книгу на руках" });
    }

    user.taked_books.push({
        edition_code,
        date: new Date().toLocaleDateString("ru-RU")
    });

    book.available--;

    fs.writeFileSync(books_path, JSON.stringify(books, null, 2));
    fs.writeFileSync(users_path, JSON.stringify(users, null, 2));

    res.json({ ok: true, message: "Книга успешно взята!", book });
});

// Возврат книги
app.post('/return', (req, res) => {
    let session_token = req.cookies.session;
    if (!session_token || !sessions[session_token]) {
        return res.status(401).json({ error: 'Вы не авторизованы' });
    }

    let login = sessions[session_token];
    let edition_code = req.body.edition_code;

    let users_data = JSON.parse(fs.readFileSync(__dirname + '/users/users.json'));
    let books_data = JSON.parse(fs.readFileSync(__dirname + '/books/books.json'));

    let user = users_data.find(function(u) {
        return u.login === login;
    });
    let book = books_data.find(function(b) {
        return b.edition_code === edition_code;
    });

    if (!book) {
        return res.status(404).json({ error: 'Книга не найдена' });
    }

    let index = user.taked_books.findIndex(function(b) {
        return b.edition_code === edition_code;
    });

    if (index === -1) {
        return res.status(400).json({ error: 'У вас нет этой книги' });
    }

    let taken = user.taked_books[index];
    let parts = taken.date.split('.'); // ["30", "12", "2025"]
    let taken_date = new Date(parts[2], parts[1] - 1, parts[0]);
    let today = new Date();
    let diff_days = Math.floor((today - taken_date) / (1000 * 60 * 60 * 24));

    if (diff_days <= 20) {
        user.rating += diff_days;
    } 
    else {
        user.rating -= diff_days;
    }

    user.taked_books.splice(index, 1);

    book.available++;

    fs.writeFileSync(__dirname + '/users/users.json', JSON.stringify(users_data, null, 2));
    fs.writeFileSync(__dirname + '/books/books.json', JSON.stringify(books_data, null, 2));

    res.json({ok: true});
});

app.listen(PORT, console.log(`Server is running: main page is available on http://localhost:${PORT}/index.html`));
