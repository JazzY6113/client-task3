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
            <p>{{ card.description }}</p>
            <p>Дата создания: {{ card.createdDate }}</p>
            <p>Дэдлайн: {{ card.deadline }}</p>
            <p v-if="card.editDates.length">Даты редактирования: {{ card.editDates.join(', ') }}</p>
            <p v-if="card.status">{{ card.status }}</p>
            <button @click="editCard">Редактировать</button>
            <button @click="deleteCard">Удалить</button>
            <button v-if="column === 1" @click="moveToInProgress">В работу</button>
            <button v-if="column === 3" @click="moveToCompleted">Выполнено</button>
            <button v-if="column === 2" @click="moveToTesting">На тестирование</button>
            <button v-if="column === 3" @click="moveBackToInProgress">Вернуть в работу</button>
        </div>
    `,
    methods: {
        editCard() {
            this.$emit('edit-card', this.card);
        },
        deleteCard() {
            this.$emit('delete-card', this.card);
        },
        moveToInProgress() {
            this.$emit('move-card', this.card, 2);
        },
        moveToTesting() {
            this.$emit('move-card', this.card, 3);
        },
        moveToCompleted() {
            this.$emit('move-card', this.card, 4);
        },
        moveBackToInProgress() {
            const reason = prompt("Введите причину возврата:");
            if (reason) {
                this.$emit('move-card-back', this.card, 2, reason);
            }
        }
    }
});

let app = new Vue({
    el: '#app',
    data: {
        cards: [],
        nextCardId: 1,
        newCardTitle: '',
        newCardDescription: '',
        newCardDeadline: '',
        editingCard: null
    },
    methods: {
        addCard(title, description, deadline) {
            const newCard = {
                id: this.nextCardId++,
                title: title,
                description: description,
                createdDate: new Date().toLocaleString(),
                deadline: deadline,
                column: 1,
                editDates: []
            };
            this.cards.push(newCard);
            this.saveData();
        },
        createCard() {
            if (this.newCardTitle.trim() !== '' && this.newCardDescription.trim() !== '' && this.newCardDeadline.trim() !== '') {
                this.addCard(this.newCardTitle, this.newCardDescription, this.newCardDeadline);
                this.resetNewCardForm();
            }
        },
        resetNewCardForm() {
            this.newCardTitle = '';
            this.newCardDescription = '';
            this.newCardDeadline = '';
        },
        editCard(card) {
            this.editingCard = JSON.parse(JSON.stringify(card));
        },
        saveEditedCard() {
            const index = this.cards.findIndex(c => c.id === this.editingCard.id);
            if (index !== -1) {
                this.editingCard.editDates.push(new Date().toLocaleString()); // Добавляем дату редактирования
                this.cards.splice(index, 1, this.editingCard);
            }
            this.editingCard = null;
            this.saveData();
        },
        cancelEdit() {
            this.editingCard = null;
        },
        deleteCard(card) {
            this.cards = this.cards.filter(c => c.id !== card.id);
            this.saveData();
        },
        moveCard(card, column) {
            card.column = column;
            if (column === 4) {
                const now = new Date();
                const deadline = new Date(card.deadline);
                card.status = deadline < now ? 'Просрочено' : 'Выполнено в срок';
            }
            this.saveData();
        },
        moveCardBack(card, column, reason) {
            card.column = column;
            card.status = `Возвращено в работу. Причина: ${reason}`;
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
        }
    },
    mounted() {
        this.loadData();
    }
});