import { Container } from '@mui/material';
import s from './auth.module.scss';
import { useAppSelector } from '../../../store/strore';

function Auth() {
	const error = useAppSelector((state) => state.auth.error);
	return (
		<Container maxWidth='sm' className={s.container}>
			<h1>Авторизация...</h1>
			<p>{error}</p>
		</Container>
	);
}

export default Auth;
