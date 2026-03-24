import { createAsyncThunk } from '@reduxjs/toolkit';
import { todoApi } from '../../utils/api/todo-list';
import { Todo } from '../../types/todos';
import { removeTodo, toggleTodo } from './todoSlice';

// Заглушка для получения списка задач с имитацией задержки
export const fetchTodos = createAsyncThunk('todos/fetchTodos', async () => {
	return todoApi.get();
});
// Заглушка для добавления новой задачи
export const addTodoApi = createAsyncThunk(
	'todos/addTodo',
	async (name: string, { dispatch }) => {
		await todoApi.set(name).then((id) => {
			dispatch(getTodo(id));
		});
	}
);

export const getTodo = createAsyncThunk('todos/getTodo', async (id: string) => {
	return todoApi.getItem(id);
});

export const putTodo = createAsyncThunk(
	'todos/putTodo',
	async (todo: Todo, { dispatch }) => {
		const formData = JSON.stringify({
			todoItemId: todo.id,
			name: todo.name,
			isComplete: todo.isComplete,
		});
		await todoApi.put(formData).then(() => {
			dispatch(toggleTodo(todo.id));
		});
	}
);

export const deleteTodo = createAsyncThunk(
	'todos/putTodo',
	async (id: string, { dispatch }) => {
		await todoApi.deleteItem(id).then(() => {
			dispatch(removeTodo(id));
		});
	}
);
