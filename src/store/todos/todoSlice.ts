import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Todo } from '../../types';
import { addTodoApi, fetchTodos, getTodo } from './actions';

interface TodosState {
	todos: Todo[];
	loading: boolean;
	error: string | null;
}
const initialState: TodosState = {
	todos: [],
	loading: false,
	error: null,
};

const todoSlice = createSlice({
	name: 'todos',
	initialState,
	reducers: {
		// Переключение статуса выполнения задачи
		toggleTodo: (state, action: PayloadAction<string>) => {
			const todo = state.todos.find((todo) => todo.id === action.payload);
			if (todo) {
				todo.isComplete = !todo.isComplete;
			}
		},
		// Удаление задачи
		removeTodo: (state, action: PayloadAction<string>) => {
			state.todos = state.todos.filter((todo) => todo.id !== action.payload);
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchTodos.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchTodos.fulfilled, (state, action: PayloadAction<Todo[]>) => {
				state.loading = false;
				state.todos = action.payload;
			})
			.addCase(fetchTodos.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || 'Не удалось загрузить задачи';
			})
			.addCase(addTodoApi.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addTodoApi.fulfilled, (state) => {
				state.loading = false;
			})
			.addCase(addTodoApi.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || 'Не удалось добавить задачу';
			})
			.addCase(getTodo.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(
				getTodo.fulfilled,
				(state, action: PayloadAction<Todo | null>) => {
					state.loading = false;
					action.payload && state.todos.push(action.payload);
				}
			)
			.addCase(getTodo.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || 'Не удалось добавить задачу';
			});
	},
});

export const { toggleTodo, removeTodo } = todoSlice.actions;
export default todoSlice.reducer;
