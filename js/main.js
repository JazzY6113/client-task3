let eventBus = new Vue();

Vue.component('note-card', {
    props: {
        card: Object,
        allCards: Array
    },
    template: `
        <div class="card">
            <h3>Заголовок: {{ card.title }}</h3>
            <p>Описание: {{ card.description }}</p>
            <p>Приоритет: {{ getPriorityText(card.priority) }}</p>
            <p>Дата создания: {{ card.createdDate }}</p>
            <p>Дэдлайн: {{ formatDeadline(card.deadline) }}</p>
            <p v-if="card.status">Статус: {{ card.status }}</p>
            <p v-if="card.reason">Причина возврата: {{ card.reason }}</p>
            <p v-if="card.editDates.length">Редактировалось:</p>
            <ul>
                <li v-for="date in card.editDates" :key="date">{{ date }}</li>
            </ul>
            <div>
                <button v-if="canEdit" @click="$emit('edit', card)">Редактировать</button>
                <button v-if="canDelete" @click="$emit('delete', card.id)">Удалить</button>
            </div>
            <div>
                <button v-if="canMoveToInProgress" @click="$emit('move', card, 2)" :disabled="isMoveDisabled">В работу</button>
                <button v-if="canMoveToTesting" @click="$emit('move', card, 3)" :disabled="isMoveDisabled">На тестирование</button>
                <button v-if="canMoveToCompleted" @click="$emit('move', card, 4)" :disabled="isMoveDisabled">Выполнено</button>
                <button v-if="canMoveBack" @click="moveBack">Вернуть в работу</button>
            </div>
        </div>
    `,
    computed: {
        canEdit() {
            return this.card.column < 4;
        },
        canDelete() {
            return this.card.column === 1;
        },
        canMoveToInProgress() {
            return this.card.column === 1;
        },
        canMoveToTesting() {
            return this.card.column === 2;
        },
        canMoveToCompleted() {
            return this.card.column === 3;
        },
        canMoveBack() {
            return this.card.column === 3;
        },
        isMoveDisabled() {
            const higherPriorityExists = this.allCards && this.allCards.some(c => c.priority < this.card.priority && c.column < 4);
            return higherPriorityExists;
        }
    },
    methods: {
        formatDeadline(deadline) {
            return new Date(deadline).toLocaleString();
        },
        getPriorityText(priority) {
            return priority === '1' ? 'Высокий' : priority === '2' ? 'Средний' : 'Низкий';
        },
        moveBack() {
            const reason = prompt('Укажите причину возврата в работу:');
            if (reason) {
                this.$emit('move-back', this.card, 2, reason);
            }
        }
    }
});

Vue.component('create-card', {
    template: `
        <div>
            <h3>Добавить карточку</h3>
            <input v-model="title" placeholder="Название задачи">
            <input v-model="description" placeholder="Описание задачи">
            <input type="datetime-local" v-model="deadline">
            <select v-model="priority">
                <option value="1">Высокий</option>
                <option value="2">Средний</option>
                <option value="3">Низкий</option>
            </select>
            <button @click="createCard">Добавить</button>
        </div>
    `,
    data() {
        return { title: '', description: '', deadline: '', priority: '' };
    },
    methods: {
        createCard() {
            if (this.title.trim() && this.description.trim() && this.deadline && this.priority) {
                this.$emit('card-created', {
                    title: this.title,
                    description: this.description,
                    deadline: this.deadline,
                    priority: this.priority
                });
                this.title = '';
                this.description = '';
                this.deadline = '';
                this.priority = '';
            }
        }
    }
});

Vue.component('edit-card', {
    props: ['card'],
    template: `
        <div>
            <h3>Редактировать карточку</h3>
            <input v-model="card.title" placeholder="Название задачи">
            <input v-model="card.description" placeholder="Описание задачи">
            <button @click="$emit('save', card)">Сохранить</button>
            <button @click="cancelEdit">Отмена</button>
        </div>
    `,
    methods: {
        cancelEdit() {
            this.$emit('cancel');
        }
    }
});

let app = new Vue({
    el: '#app',
    data() {
        return {
            columns: [
                { id: 1, title: 'Новое' },
                { id: 2, title: 'В работе' },
                { id: 3, title: 'На тестировании' },
                { id: 4, title: 'Выполнено' }
            ],
            cards: [],
            nextCardId: 1,
            editingCard: null
        };
    },
    methods: {
        addCard(cardData) {
            this.cards.push({
                id: this.nextCardId++,
                ...cardData,
                column: 1,  // Устанавливаем карточку в столбец "Новое" (column = 1)
                createdDate: new Date().toLocaleString(),
                editDates: [],
                reason: ''
            });
            this.saveData();
        },
        editCard(card) {
            this.editingCard = { ...card };
        },
        saveEditedCard(card) {
            const index = this.cards.findIndex(c => c.id === card.id);
            if (index !== -1) {
                this.cards[index] = card;
                this.cards[index].editDates.push(new Date().toLocaleString());
            }
            this.editingCard = null;
            this.saveData();
        },
        deleteCard(cardId) {
            this.cards = this.cards.filter(c => c.id !== cardId);
            this.saveData();
        },
        moveCard(card, column) {
            if (column === 4) {
                card.status = new Date(card.deadline) < new Date() ? 'Просрочено' : 'Выполнено в срок';
            }
            card.column = column;
            this.saveData();
        },
        moveBackToInProgress(card, column, reason) {
            card.column = column;
            card.reason = reason;
            card.status = `Возвращено в работу: ${reason}`;
            this.saveData();
        },
        saveData() {
            localStorage.setItem('kanban-cards', JSON.stringify(this.cards));
        },
        clearCards() {
            this.cards = [];  // Очищаем массив карточек
            localStorage.removeItem('kanban-cards'); // Удаляем данные из LocalStorage
        },
        getCardsByColumn(columnId) {
            return this.cards.filter(card => card.column === columnId);  // Фильтруем карточки по столбцу
        },
        cancelEdit() {
            this.editingCard = null;  // Отменяем редактирование
        }
    },
    created() {
        const savedCards = JSON.parse(localStorage.getItem('kanban-cards'));
        if (savedCards) {
            this.cards = savedCards;
            this.nextCardId = this.cards.length ? Math.max(...this.cards.map(c => c.id)) + 1 : 1;
        }
    }
});