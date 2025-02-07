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
            <button @click="editCard">Редактировать</button>
            <button @click="deleteCard">Удалить</button>
            <button v-if="column === 1" @click="moveToInProgress">В работу</button>
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
                lastEdited: null
            };
            this.cards.push(newCard);
            this.saveData();
        },
        createCard() {
            if (this.newCardTitle.trim() !== '' && this.newCardDescription.trim() !== '' && this.newCardDeadline.trim() !== '') {
                this.addCard(this.newCardTitle, this.newCardDescription, this.newCardDeadline);
                this.newCardTitle = '';
                this.newCardDescription = '';
                this.newCardDeadline = '';
            }
        },
        editCard(card) {
            this.editingCard = JSON.parse(JSON.stringify(card));
        },
        saveEditedCard() {
            const index = this.cards.findIndex(c => c.id === this.editingCard.id);
            if (index !== -1) {
                this.editingCard.lastEdited = new Date().toLocaleString();
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
            this.saveData();
        },
    },
    mounted() {
        this.loadData();
    }
});