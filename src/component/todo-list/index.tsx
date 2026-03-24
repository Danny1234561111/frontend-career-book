import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/strore';

import {
	List,
	ListItem,
	ListItemText,
	Checkbox,
	IconButton,
	TextField,
	Button,
	CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useForm } from '../../hook/useForm';
import {
	addTodoApi,
	deleteTodo,
	fetchTodos,
	putTodo,
} from '../../store/todos/actions';

type TRequest = {
	newTodo: string;
};

function TodoList() {
	const dispatch = useAppDispatch();
	const { todos, loading, error } = useAppSelector((state) => state.todos);

	const { form, handleInputChange, handleInputEdit } = useForm<TRequest>({
		newTodo: '',
	});

	useEffect(() => {
		dispatch(fetchTodos());
	}, [dispatch]);

	const handleAddTodo = () => {
		if (form.newTodo.trim()) {
			dispatch(addTodoApi(form.newTodo));
			handleInputEdit('newTodo');
		}
	};

	const handleToggle = (id: string) => {
		const todo = todos.find((i) => i.id == id);
		if (!todo) {
			return;
		}
		dispatch(
			putTodo({ id: todo.id, name: todo.name, isComplete: !todo.isComplete })
		);
	};

	const handleRemove = (id: string) => {
		dispatch(deleteTodo(id));
	};

	return (
		<div>
			<h1>Todo List</h1>
			<div
				style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
				<TextField
					label='Новая задача'
					value={form.newTodo}
					name='newTodo'
					onChange={handleInputChange}
					variant='outlined'
					size='small'
					fullWidth
				/>
				<Button
					variant='contained'
					color='primary'
					onClick={handleAddTodo}
					style={{ marginLeft: '0.5rem', height: '40px' }}>
					Добавить
				</Button>
			</div>
			{loading ? (
				<CircularProgress />
			) : (
				<List>
					{todos.map((todo) => (
						<ListItem key={todo.id} dense>
							<Checkbox
								checked={todo.isComplete}
								onChange={() => handleToggle(todo.id)}
							/>
							<ListItemText
								primary={todo.name}
								style={{
									textDecoration: todo.isComplete ? 'line-through' : 'none',
								}}
							/>
							<IconButton edge='end' onClick={() => handleRemove(todo.id)}>
								<DeleteIcon />
							</IconButton>
						</ListItem>
					))}
				</List>
			)}
			{error && <p style={{ color: 'red' }}>{error}</p>}
		</div>
	);
}
export default TodoList;
