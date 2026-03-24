import { createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../../utils/api/auth';
import { setIsAuthChecked } from './authSplice';

// проверка токена локально
export const checkToken = createAsyncThunk(
	'auth/checkToken',
	async (_, { dispatch }) => {
		const token = localStorage.getItem('acessToken');
		dispatch(setIsAuthChecked(token));
		if (!token) {
			dispatch(fetchToken());
		}
	}
);

// авторизация
export const fetchToken = createAsyncThunk('auth/fetchToken', async () => {
	return authApi.requestToken();
});
