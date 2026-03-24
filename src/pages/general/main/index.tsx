import { Container } from '@mui/material';
import { TodoList } from '../../../component';
import clsx from 'clsx';
import s from './main.module.scss';

function Main() {
	return (
		<Container maxWidth='sm' className={clsx(s.container)}>
			<TodoList />
		</Container>
	);
}

export default Main;
