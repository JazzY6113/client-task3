let eventBus = new Vue();

Vue.component('note-card', {
    props: {
        card: {
            type: Object,
            required: true
        },
        highPriorityCardsCompleted: {
            type: Boolean,
            required: true
        }
    },
    template: `
        <div class="card">
            <h3>Заголовок: {{ card.title }}</h3>
            <p>Описание: {{ card.description }}</p>
            <p v-if="card.priority">Приоритет: {{ getPriorityText(card.priority) }}</p>
            <p>Дата создания: {{ card.createdDate }}</p>
            <p>Дэдлайн: {{ formatDeadline(card.deadline) }}</p>
            <p v-if="card.editDates.length">Даты редактирования: {{ card.editDates.join(', ') }}</p>
            <p v-if="card.status">{{ card.status }}</p>
            <p v-if="card.reason">Причина возврата: {{ card.reason }}</p><br>
            <div>
                <button v-if="canEdit" @click="editCard">Редактировать</button><br>
                <button v-if="canDelete" @click="deleteCard">Удалить</button>
            </div>
            <div v-if="canMoveToInProgress">
                <button @click="moveToInProgress" :disabled="isMoveDisabled">В работу</button><br>
            </div>
            <div v-if="canMoveToTesting">
                <button @click="moveToTesting" :disabled="isMoveDisabled">На тестирование</button><br>
            </div>
            <div v-if="canMoveToCompleted">
                <button @click="moveToCompleted" :disabled="isMoveDisabled">Выполнено</button><br>
                <button v-if="canMoveBack" @click="moveBackToInProgress">Вернуть в работу</button>
            </div><br>
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
            return this.card.column === 3 && this.canMoveBasedOnPriority();
        },
        canMoveBack() {
            if (this.card.priority === '1') {
                return true;
            }
            if (this.card.column === 4) {
                return false;
            } else if (this.card.column === 3) {
                const higherPriorityCardsInProgress = this.$parent.cards.filter(c => 
                    (c.priority === '1') && c.column < 4
                );
                return higherPriorityCardsInProgress.length === 0;
            }
            return false
        },
        isMoveDisabled() {
            const higherPriorityCardsInProgress = this.$parent.cards.filter(c => 
                (c.priority === '1' || c.priority === '2') && c.column < 4
            );
            if (this.card.column === 1 && (this.card.priority === '2' || this.card.priority === '3')) {
                return higherPriorityCardsInProgress.length > 0;
            }
            if ((this.card.column === 2 || this.card.column === 3) && (this.card.priority === '2' || this.card.priority === '3')) {
                return higherPriorityCardsInProgress.length > 0;
            }
            return false;
        }             
    },
    methods: {
        formatDeadline(deadline) {
            const date = new Date(deadline);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        },
        getPriorityText(priority) {
            switch (priority) {
                case '1': return 'Высокий';
                case '2': return 'Средний';
                case '3': return 'Низкий';
                default: return '';
            }
        },
        editCard() {
            this.$emit('edit', this.card);
        },
        deleteCard() {
            this.$emit('delete', this.card.id);
        },
        moveToInProgress() {
            this.$emit('move', this.card, 2);
        },
        moveToTesting() {
            this.$emit('move', this.card, 3);
        },
        moveToCompleted() {
            this.$emit('move', this.card, 4);
        },
        moveBackToInProgress() {
            const reason = prompt('Укажите причину возврата в работу:');
            if (reason) {
                this.$emit('move-back', this.card, 2, reason);
            }
        },
        canMoveBasedOnPriority() {
            if (this.card.priority === '3') {
                return this.$parent.cards.every(c => (c.priority !== '1' && c.priority !== '2') || c.column === 4);
            } else if (this.card.priority === '2') {
                return this.$parent.cards.every(c => (c.priority !== '1') || c.column === 4);
            }
            return true;
        }
    }
}); 

Vue.component('create-card', {
    template: `
        <div>
            <h3>Добавить карточку</h3>
            <input v-model="title" placeholder="Название задачи" />
            <input v-model="description" placeholder="Описание задачи" />
            <input type="datetime-local" v-model="deadline" />
            <select v-model="priority">
                <option disabled value="">Выберите приоритет</option>
                <option value="1">1 - Высокий</option>
                <option value="2">2 - Средний</option>
                <option value="3">3 - Низкий</option>
            </select>
            <button @click="createCard">Добавить карточку</button>
        </div>
    `,
    data() {
        return {
            title: '',
            description: '',
            deadline: '',
            priority: ''
        };
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
                this.resetForm();
            }
        },
        resetForm() {
            this.title = '';
            this.description = '';
            this.deadline = '';
            this.priority = '';
        }
    }
});

Vue.component('edit-card', {
    props: {
        card: {
            type: Object,
            required: true
        }
    },
    template: `
        <div>
            <h3>Редактировать карточку</h3>
            <input v-model="card.title" placeholder="Название задачи" />
            <input v-model="card.description" placeholder="Описание задачи" />
            <button @click="saveChanges">Сохранить изменения</button>
            <button @click="$emit('cancel')">Отмена</button>
        </div>
    `,
    methods: {
        saveChanges() {
            this.card.editDates.push(new Date().toLocaleString());
            this.$emit('save', this.card);
        }
    }
});

let app = new Vue({
    el: '#app',
    data: {
        cards: [],
        nextCardId: 1,
        editingCard: null
    },
    methods: {
        addCard(cardData) {
            const newCard = {
                id: this.nextCardId++,
                title: cardData.title,
                description: cardData.description,
                createdDate: new Date().toLocaleString(),
                deadline: cardData.deadline,
                priority: cardData.priority || '0',
                column: 1,
                editDates: [],
                reason: ''
            };
            this.cards.push(newCard);
            this.saveData();
        },
        clearCards() {
            this.cards = [];
            this.nextCardId = 1;
            this.saveData();
        },
        editCard(card) {
            this.editingCard = JSON.parse(JSON.stringify(card));
        },
        saveEditedCard(card) {
            const index = this.cards.findIndex(c => c.id === card.id);
            if (index !== -1) {
                card.editDates.push(new Date().toLocaleString());
                this.cards.splice(index, 1, card);
            }
            this.editingCard = null;
            this.saveData();
        },
        cancelEdit() {
            this.editingCard = null;
        },
        deleteCard(cardId) {
            this.cards = this.cards.filter(c => c.id !== cardId);
            this.saveData();
        },
        moveCard(card, column) {
            if (column === 2 && card.column === 3) {
                const reason = prompt('Укажите причину перемещения в работу:');
                if (reason) {
                    card.column = column;
                    card.reason = reason;
                    card.status = `Возвращено в работу. Причина: ${reason}`;
                }
            } else {
                card.column = column;
                if (column === 4) {
                    const now = new Date();
                    const deadline = new Date(card.deadline);
                    card.status = deadline < now ? 'Просрочено' : 'Выполнено в срок';
                }
            }
            this.saveData();
        },                
        moveBackToInProgress(card, column, reason) {
            if (column === 2) {
                card.column = column;
                card.reason = reason;
                card.status = `Возвращено в работу. Причина: ${reason}`;
                this.saveData();
            }
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