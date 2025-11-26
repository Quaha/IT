function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function renderBooks(books) {
    const container = document.getElementById('books-container');

    books.forEach(book => {
        const block = document.createElement('div');
        block.className = 'book-block';

        const img = document.createElement('img');
        img.src = 'assets/covers/' + book.cover;
        img.alt = book.title;

        const info = document.createElement('div');
        info.className = 'book-info';
        info.innerHTML = `
            <p><strong>Название:</strong> ${book.title}</p>
            <p><strong>Авторы:</strong> ${book.authors.join(', ')}</p>
            <p><strong>Число страниц:</strong> ${book.pages}</p>
            <p><strong>Издательство:</strong> ${book.publisher}</p>
            <p><strong>ISBN:</strong> ${book.isbn}</p>
            <p><strong>Экземпляры:</strong> ${book.available} из ${book.copies}</p>
            <p><strong>Код издания:</strong> ${book.edition_code}</p>
        `;

        block.appendChild(img);
        block.appendChild(info);
        container.appendChild(block);
    });
}


function main() {
    fetch('books.json')
        .then(response => response.json())
        .then(books => {
            const shuffled = shuffle(books);
            const random10 = shuffled.slice(0, 8);
            renderBooks(random10);
        });
}
main()
