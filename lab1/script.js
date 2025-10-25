const base_cards_path = "assets/";
const suit = "spades";

const card_values = ["06", "07", "08", "09", "10", "J", "Q", "K", "A"];

function getCardPath(value) {
    return base_cards_path + "card" + "_" + suit + "_" + value + ".png";
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

const slots = document.querySelectorAll(".slot");
const deck_back = document.getElementById("deck_back");
const deck = document.getElementById("deck");

let last_unused_value = 0;
let next_free_slot = 1;

let shuffled = false;

function onDeckClick() {

    if (!shuffled) {
        shuffle(card_values);
        shuffled = true;
    }

    if (next_free_slot < slots.length) {
        const img = document.createElement("img");

        img.alt = "Card" + card_values[last_unused_value];
        img.src = getCardPath(card_values[last_unused_value++]);

        slots[next_free_slot++].appendChild(img);

        setTimeout(() => {
            img.style.opacity = 1;
            img.style.transform = "translateY(0)";
        }, 10);

        if (last_unused_value == card_values.length || next_free_slot == slots.length) {
            deck_back.style.display = 'none';
            deck.style.cursor = 'default';

            const deck_text = document.getElementById('deck_text');
            
            deck_text.innerText = "Deck";
        }
    }
}

deck_back.addEventListener('click', onDeckClick);

function playSound() {
    const audio = new Audio('assets/card_deal.mp3');
    audio.playbackRate = 1.2;
    audio.play();
}

deck_back.addEventListener('click', playSound);