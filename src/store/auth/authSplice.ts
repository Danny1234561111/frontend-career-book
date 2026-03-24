import { createSlice } from '@reduxjs/toolkit';
import { fetchToken } from './actions';

interface AuthState {
	isAuth: boolean;
	loading: boolean;
	error: string | null;
}
const initialState: AuthState = {
	isAuth: false,
	loading: false,
	error: null,
};

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		setIsAuthChecked: (state, action) => {
			state.isAuth = action.payload;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchToken.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchToken.fulfilled, (state) => {
				state.isAuth = true;
				state.loading = false;
			})
			.addCase(fetchToken.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || 'Пользователь не найден';
			});
	},
});

export const { setIsAuthChecked } = authSlice.actions;
export default authSlice.reducer;
