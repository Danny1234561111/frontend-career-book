import {
	Auth,
	ProfilePage,
	MyCompetenciesPage,
	IprPage,
	MaterialsPage,
	MaterialsAdminPage,
	SettingsPage,
	CompetenciesPage,
	UsersPage,
	DepartmentPage,
	DepartmentMaterialsPage,
	DepartmentCompetenciesPage,
	AdminDashboard,
	ManagerDashboard,
	EmployeeDashboard,
} from '../pages';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/strore';
import { useEffect, useState } from 'react';
import { checkToken } from '../store/auth/actions';
import { OnlyAuth, OnlyUnAuth, Navigation } from '../component';

export const App = () => {
	const location = useLocation();
	const state = location.state as { backgroundLocation?: Location };
	const dispatch = useAppDispatch();
	const isAuth = useAppSelector((state) => state.auth.isAuthenticated);
	const userRole = useAppSelector((state) => state.auth.user?.role);

	const [currentRole, setCurrentRole] = useState<'admin' | 'manager' | 'user' | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [authError, setAuthError] = useState<string | null>(null);

	// Функция для получения тестового токена
	const getTestTokens = async () => {
		try {
			console.log('Attempting to get test token from: http://localhost:5097/api/AuthTest/getTestTokens');
			
			const response = await fetch('http://localhost:5097/api/AuthTest/getTestTokens', {
				method: 'POST',
				headers: {
					'accept': 'text/plain',
				},
			});

			console.log('Response status:', response.status);
			
			if (response.ok) {
				const data = await response.json();
				console.log('✅ Test tokens received successfully');
				
				localStorage.setItem('accessToken', data.accessToken);
				localStorage.setItem('refreshToken', data.refreshToken);
				localStorage.setItem('accessTokenExpires', data.accessTokenExpires);
				localStorage.setItem('refreshTokenExpires', data.refreshTokenExpires);
				
				setAuthError(null);
				return true;
			} else if (response.status === 401) {
				console.error('❌ 401 Unauthorized - The endpoint requires authorization');
				setAuthError('Требуется авторизация');
				return false;
			} else {
				console.error('Failed to get test tokens:', response.status);
				setAuthError(`Ошибка ${response.status} при получении токена`);
				return false;
			}
		} catch (error) {
			console.error('❌ Error getting test tokens:', error);
			setAuthError('Не удалось подключиться к серверу авторизации');
			return false;
		}
	};

	// Функция для проверки токена локально
	const validateTokenLocally = (token: string): boolean => {
		try {
			if (!token || token === 'undefined' || token === 'null') {
				return false;
			}
			const payload = JSON.parse(atob(token.split('.')[1]));
			const exp = payload.exp * 1000;
			return Date.now() < exp;
		} catch (error) {
			console.error('Error validating token:', error);
			return false;
		}
	};

	// Получение текущей роли из профиля пользователя
	const fetchCurrentRole = async () => {
		try {
			const token = localStorage.getItem('accessToken');
			if (!token) {
				console.error('No access token found');
				return;
			}

			console.log('Fetching current user from: http://localhost:5217/api/users/profile');
			const response = await fetch('http://localhost:5217/api/users/profile', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'accept': 'text/plain',
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Current user from API:', data);
				
				// Определяем роль из данных пользователя
				let role: 'admin' | 'manager' | 'user' = 'user';
				const roleValue = data.role?.value?.toLowerCase();
				if (roleValue === 'admin') {
					role = 'admin';
				} else if (roleValue === 'manager') {
					role = 'manager';
				}
				setCurrentRole(role);
				console.log('✅ Updated role:', role);
			} else {
				console.error('Failed to fetch user:', response.status);
				if (response.status === 401) {
					console.log('Token invalid, trying to refresh...');
					await getTestTokens();
					if (localStorage.getItem('accessToken')) {
						await fetchCurrentRole();
					}
				}
			}
		} catch (error) {
			console.error('Error fetching user:', error);
		}
	};

	// Функция для смены роли через тестовый эндпоинт
	const changeUserRole = async (roleValue: number) => {
		try {
			const token = localStorage.getItem('accessToken');
			if (!token) {
				console.error('No access token found');
				setAuthError('Нет токена доступа');
				return;
			}

			const roleName = roleValue === 0 ? 'admin' : roleValue === 1 ? 'manager' : 'user';
			console.log(`Changing own role to: ${roleName} (value: ${roleValue})`);
			
			const response = await fetch(`http://localhost:5217/api/users/own/role?userRole=${roleValue}`, {
				method: 'PATCH',
				headers: {
					'Authorization': `Bearer ${token}`,
					'accept': 'text/plain',
				},
			});

			if (response.ok) {
				console.log(`✅ Role changed successfully to: ${roleName}`);
				// Принудительно устанавливаем новую роль
				setCurrentRole(roleName);
			} else {
				const errorText = await response.text();
				console.error('Failed to change role:', response.status, errorText);
				setAuthError(`Ошибка смены роли: ${response.status}`);
				// Если ошибка, пробуем получить актуальную роль с сервера
				await fetchCurrentRole();
			}
		} catch (error) {
			console.error('Error changing role:', error);
			setAuthError('Ошибка сети при смене роли');
		}
	};

	// Проверяем наличие токена при загрузке
	useEffect(() => {
		const initializeAuth = async () => {
			const existingToken = localStorage.getItem('accessToken');
			
			if (existingToken && validateTokenLocally(existingToken)) {
				console.log('✅ Valid token found, fetching user...');
				await fetchCurrentRole();
				setIsLoading(false);
			} else if (existingToken && !validateTokenLocally(existingToken)) {
				console.log('Token expired, getting new one...');
				localStorage.removeItem('accessToken');
				localStorage.removeItem('refreshToken');
				const success = await getTestTokens();
				if (success) {
					await fetchCurrentRole();
				}
				setIsLoading(false);
			} else {
				console.log('No token found, attempting to get test token...');
				const success = await getTestTokens();
				if (success) {
					await fetchCurrentRole();
				}
				setIsLoading(false);
			}
		};

		initializeAuth();
	}, []);

	// Показываем загрузку
	if (isLoading) {
		return <div style={{ padding: '20px', textAlign: 'center' }}>Загрузка...</div>;
	}

	// Если нет токена, показываем ошибку
	if (!localStorage.getItem('accessToken')) {
		return (
			<div style={{ padding: '40px', textAlign: 'center' }}>
				<p>Не удалось получить токен авторизации</p>
			</div>
		);
	}

	// Если роль еще не загружена
	if (!currentRole) {
		return <div style={{ padding: '20px', textAlign: 'center' }}>Загрузка роли...</div>;
	}

	return (
		<>
			{/* Панель для смены ролей */}
			<div
				style={{
					position: 'fixed',
					top: '10px',
					right: '10px',
					zIndex: 2000,
					background: 'white',
					padding: '15px',
					borderRadius: '8px',
					boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
					display: 'flex',
					gap: '10px',
				}}>
				<button
					onClick={() => changeUserRole(0)}
					style={{
						padding: '8px 16px',
						background: currentRole === 'admin' ? '#1976d2' : '#f0f0f0',
						color: currentRole === 'admin' ? 'white' : '#333',
						border: 'none',
						borderRadius: '4px',
						cursor: 'pointer',
					}}>
					Админ
				</button>
				<button
					onClick={() => changeUserRole(1)}
					style={{
						padding: '8px 16px',
						background: currentRole === 'manager' ? '#1976d2' : '#f0f0f0',
						color: currentRole === 'manager' ? 'white' : '#333',
						border: 'none',
						borderRadius: '4px',
						cursor: 'pointer',
					}}>
					Менеджер
				</button>
				<button
					onClick={() => changeUserRole(2)}
					style={{
						padding: '8px 16px',
						background: currentRole === 'user' ? '#1976d2' : '#f0f0f0',
						color: currentRole === 'user' ? 'white' : '#333',
						border: 'none',
						borderRadius: '4px',
						cursor: 'pointer',
					}}>
					Пользователь
				</button>
			</div>

			<Navigation devRole={currentRole} />

			<Routes location={state?.backgroundLocation || location}>
				<Route
					path='/'
					element={
						currentRole === 'admin' ? (
							<AdminDashboard />
						) : currentRole === 'manager' ? (
							<ManagerDashboard />
						) : (
							<EmployeeDashboard />
						)
					}
				/>

				<Route path='/auth' element={<Auth />} />
				<Route path='/profile' element={<ProfilePage />} />
				<Route path='/materials' element={<MaterialsPage />} />
				<Route path='/my-competencies' element={<MyCompetenciesPage />} />
				<Route path='/ipr' element={<IprPage />} />
				<Route path='/department/main' element={<DepartmentPage />} />
				<Route path='/department/materials' element={<DepartmentMaterialsPage />} />
				<Route path='/department/competencies' element={<DepartmentCompetenciesPage />} />
				<Route path='/admin/materials' element={<MaterialsAdminPage />} />
				<Route path='/settings' element={<SettingsPage />} />
				<Route path='/admin/competencies' element={<CompetenciesPage />} />
				<Route path='/admin/users' element={<UsersPage />} />
			</Routes>
		</>
	);
};