import { combineSlices, configureStore } from '@reduxjs/toolkit';
import todoReducer from './todos/todoSlice';
import authReducer from './auth/authSplice';
import { useDispatch, useSelector } from 'react-redux';

const rootReducer = combineSlices({
	auth: authReducer,
	todos: todoReducer,
});

export const store = configureStore({
	reducer: rootReducer,
	devTools: process.env.NODE_ENV !== 'production',
});

// Типизация корневого состояния и диспетчера
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
