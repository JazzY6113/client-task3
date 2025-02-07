let eventBus = new Vue();

Vue.component('note-card', {
    props: {
        card: {
            type: Object,
            required: true
        },
        column: {
            type: Number,
            required: true
        }
    },
    template: `
        <div class="card">
            <h3>{{ card.title }}</h3>
            <ul>
                <li v-for="(item, index) in card.items" :key="index">
                    <input type="checkbox" v-model="item.completed" @change="updateCompletion" :disabled="column === 3">
                    <span :class="{ 'completed': item.completed }">{{ item.text }}</span>
                </li>
            </ul>
            <p v-if="card.completedDate">Завершено: {{ card.completedDate }}</p>
            <div v-if="card.editHistory.length > 0">
                <p>История редактирования:</p>
                <ul>
                    <li v-for="(date, index) in card.editHistory" :key="index">
                        {{ date }}
                    </li>
                </ul>
            </div>
            <button v-if="column !== 3" @click="editCard">Редактировать</button>
        </div>
    `,
    methods: {
        updateCompletion() {
            this.$emit('update-card', this.card, this.column);
        },
        editCard() {
            this.$emit('edit-card', this.card);
        }
    }
});

let app = new Vue({
    el: '#app',
    data: {
        cards: [],
        nextCardId: 1,
        isFirstColumnBlocked: false,
        newCardTitle: '',
        newCardItems: ['', '', ''],
        editingCard: null,
    },
    computed: {
        firstColumnCards() {
            return this.cards.filter(card => card.column === 1);
        },
        secondColumnCards() {
            return this.cards.filter(card => card.column === 2);
        },
        thirdColumnCards() {
            return this.cards.filter(card => card.column === 3);
        },
        isNewCardValid() {
            return this.newCardTitle.trim() !== '' && 
                   this.newCardItems.length >= 3 && 
                   this.newCardItems.length <= 5 && 
                   this.newCardItems.every(item => item.trim() !== '');
        }
    },
    methods: {
        addCard(title, items) {
            if (this.firstColumnCards.length >= 3) {
                alert('Нельзя добавить больше 3 карточек в первый столбец');
                return;
            }
            const newCard = {
                id: this.nextCardId++,
                title: title,
                items: items.map(text => ({ text: text, completed: false })),
                column: 1,
                completedDate: null,
                editHistory: []
            };
            this.cards.push(newCard);
            this.saveData();
        },
        createCard() {
            if (this.isNewCardValid) {
                this.addCard(this.newCardTitle, this.newCardItems);
                this.newCardTitle = '';
                this.newCardItems = ['', '', ''];
            }
        },
        addNewCardItem() {
            if (this.newCardItems.length < 5) {
                this.newCardItems.push('');
            }
        },
        removeNewCardItem(index) {
            this.newCardItems.splice(index, 1);
        },
        updateCard(card, column) {
            const completedItems = card.items.filter(item => item.completed).length;
            const totalItems = card.items.length;
            const completionPercentage = (completedItems / totalItems) * 100;
    
            if (column === 1) {
                if (completionPercentage > 50) {
                    if (this.secondColumnCards.length < 5) {
                        card.column = 2;
                    }
                }
            } else if (column === 2) {
                if (completionPercentage <= 50) {
                    if (this.firstColumnCards.length < 3) {
                        card.column = 1;
                    } else {
                        alert('Первый столбец полон, невозможно переместить карточку обратно.');
                    }
                } else if (completionPercentage === 100) {
                    card.column = 3;
                    card.completedDate = new Date().toLocaleString();
                }
            }
            this.checkSecondColumn();
            this.saveData();
        },
        checkSecondColumn() {
            if (this.secondColumnCards.length >= 5) {
                this.isFirstColumnBlocked = true;
            } else {
                this.isFirstColumnBlocked = false;
            }
        },
        editCard(card) {
            this.editingCard = JSON.parse(JSON.stringify(card));
        },
        saveEditedCard() {
            const index = this.cards.findIndex(c => c.id === this.editingCard.id);
            if (index !== -1) {
                this.editingCard.editHistory.push(new Date().toLocaleString());
                this.cards.splice(index, 1, this.editingCard);
            }
            this.editingCard = null;
            this.saveData();
        },
        cancelEdit() {
            this.editingCard = null;
        },
        addEditCardItem() {
            if (this.editingCard.items.length < 5) {
                this.editingCard.items.push({ text: '', completed: false });
            }
        },
        removeEditCardItem(index) {
            if (this.editingCard.items.length > 3) {
                this.editingCard.items.splice(index, 1);
            } else {
                alert('Нельзя удалить пункт, так как должно быть не менее трех пунктов.');
            }
        },
        deleteAllCards() {
            this.cards = [];
            this.nextCardId = 1;
            this.saveData();
        },
        saveData() {
            localStorage.setItem('cards', JSON.stringify(this.cards));
            localStorage.setItem('nextCardId', this.nextCardId);
        },
        loadData() {
            const savedCards = localStorage.getItem('cards');
            const savedNextCardId = localStorage.getItem('nextCardId');
            if (savedCards) {
                this.cards = JSON.parse(savedCards);
            }
            if (savedNextCardId) {
                this.nextCardId = parseInt(savedNextCardId, 10);
            }
            this.checkSecondColumn();
        }
    },
    mounted() {
        this.loadData();
    }
});