export class CardStore {
    static cards = [];
    static _resolve = null;

    static setCards(newCards) {
        this.cards = newCards;
        if (this._resolve) {
            this._resolve(newCards); 
            this._resolve = null;
        }
    }

    static getCards() {
        return this.cards;
    }

    static waitForCards() {
        if (this.cards.length > 0) {
            return Promise.resolve(this.cards);
        }
        return new Promise(resolve => {
            this._resolve = resolve;
        });
    }
}
