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

function generateSessionToken() {
    return crypto.randomBytes(16).toString('hex');
}

const sessions = {};

function readJSON(file) {
    return JSON.parse(fs.readFileSync(__dirname + "/" + file));
}
function writeJSON(file, data) {
    fs.writeFileSync(__dirname + "/" + file, JSON.stringify(data, null, 2));
}


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
    const { login, phash } = req.body;

    const authData = JSON.parse(fs.readFileSync(__dirname + '/users/users_auth.json'));
    const userAuth = authData.find(u => u.login === login && u.phash === phash);

    if (!userAuth) {
        return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    // Данные пользователя без phash
    const usersData = JSON.parse(fs.readFileSync(__dirname + '/users/users.json'));
    const userData = usersData.find(u => u.login === login);

    // Генерируем токен сессии
    const sessionToken = generateSessionToken();
    sessions[sessionToken] = login;

    // Сохраняем токен в cookie (HttpOnly)
    res.cookie('session', sessionToken, { httpOnly: true, maxAge: 24 * 3600 * 1000 }); // 1 день
    res.json(userData);
});


app.get('/me', (req, res) => {
    const sessionToken = req.cookies.session;
    if (!sessionToken || !sessions[sessionToken]) {
        return res.status(401).json({ error: 'Не авторизован' });
    }

    const login = sessions[sessionToken];
    const usersData = JSON.parse(fs.readFileSync(__dirname + '/users/users.json'));
    const userData = usersData.find(u => u.login === login);

    res.json(userData);
});

// Выход из аккаунта
app.post('/logout', (req, res) => {
    const session_token = req.cookies.session;
    if (session_token) {
        delete sessions[session_token];
    }
    res.clearCookie('session');
    res.json({ ok: true });
});

app.post('/take', (req, res) => {
    const sessionToken = req.cookies.session;
    if (!sessionToken || !sessions[sessionToken]) {
        return res.status(401).json({ error: "Не авторизован" });
    }

    const login = sessions[sessionToken];
    const { edition_code } = req.body;

    if (!edition_code) {
        return res.status(400).json({ error: "Не указан код издания" });
    }

    // Загружаем БД
    const booksPath = __dirname + '/books/books.json';
    const usersPath = __dirname + '/users/users.json';

    const books = JSON.parse(fs.readFileSync(booksPath));
    const users = JSON.parse(fs.readFileSync(usersPath));

    const book = books.find(b => b.edition_code === edition_code);
    if (!book) {
        return res.status(404).json({ error: "Книга с таким кодом не найдена" });
    }

    if (book.available < 1) {
        return res.status(400).json({ error: "Нет доступных экземпляров" });
    }

    const user = users.find(u => u.login === login);

    // Проверка: уже взята эта книга?
    if (user.taked_books.some(b => b.edition_code === edition_code)) {
        return res.status(400).json({ error: "Вы уже имеете такую книгу на руках" });
    }

    // Добавляем книгу пользователю
    user.taked_books.push({
        edition_code,
        date: new Date().toLocaleDateString("ru-RU")
    });

    // Уменьшаем доступное количество
    book.available--;

    // Сохраняем изменения
    fs.writeFileSync(booksPath, JSON.stringify(books, null, 2));
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

    res.json({ ok: true, message: "Книга успешно взята", book });
});

// Возврат книги
app.post('/return', (req, res) => {
    const sessionToken = req.cookies.session;
    if (!sessionToken || !sessions[sessionToken]) {
        return res.status(401).json({ error: 'Не авторизован' });
    }

    const login = sessions[sessionToken];
    const { edition_code } = req.body;

    // Загружаем базы
    const usersData = JSON.parse(fs.readFileSync(__dirname + '/users/users.json'));
    const booksData = JSON.parse(fs.readFileSync(__dirname + '/books/books.json'));

    const user = usersData.find(u => u.login === login);
    const book = booksData.find(b => b.edition_code === edition_code);

    if (!book) {
        return res.status(404).json({ error: 'Книга не найдена' });
    }

    // Проверяем наличие у пользователя
    const index = user.taked_books.findIndex(b => b.edition_code === edition_code);

    if (index === -1) {
        return res.status(400).json({ error: 'У пользователя нет этой книги' });
    }

    // ---- ВЫЧИСЛЕНИЕ РЕЙТИНГА ДЛЯ ЭТОЙ КНИГИ ----
    const taken = user.taked_books[index];
    const parts = taken.date.split('.');    // "ДД.ММ.ГГГГ"
    const taken_date = new Date(parts[2], parts[1] - 1, parts[0]);
    const today = new Date();
    const diff_days = Math.floor((today - taken_date) / (1000 * 60 * 60 * 24));

    if (diff_days <= 20) {
        user.rating += diff_days;
    } else {
        user.rating -= diff_days;
    }

    // ---- Удаляем книгу из списка ----
    user.taked_books.splice(index, 1);

    // ---- Возвращаем в доступные ----
    book.available += 1;

    // ---- Сохраняем ----
    fs.writeFileSync(__dirname + '/users/users.json', JSON.stringify(usersData, null, 2));
    fs.writeFileSync(__dirname + '/books/books.json', JSON.stringify(booksData, null, 2));

    res.json({
        ok: true,
        new_rating: user.rating
    });
});

app.listen(PORT, console.log(`Server is running: main page is available on http://localhost:${PORT}/index.html`));
