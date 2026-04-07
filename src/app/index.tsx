import {
    Auth,
    ProfilePage,
    MyCompetenciesPage,
    IprPage,
    MaterialsPage,
    MaterialsAdminPage,
    ImportPage,
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

    // Функция для определения роли из данных пользователя
    const extractRoleFromUserData = (data: any): 'admin' | 'manager' | 'user' => {
        let roleValue = null;
        
        if (data.role) {
            if (typeof data.role === 'string') {
                roleValue = data.role;
            } else if (data.role.value) {
                roleValue = data.role.value;
            } else if (data.role.name) {
                roleValue = data.role.name;
            }
        }
        
        if (!roleValue && data.userRole) {
            roleValue = data.userRole;
        }
        
        if (roleValue) {
            const roleLower = roleValue.toString().toLowerCase();
            if (roleLower === 'admin' || roleLower === '0') {
                return 'admin';
            }
            if (roleLower === 'manager' || roleLower === '1') {
                return 'manager';
            }
        }
        
        return 'user';
    };

    // ИСПРАВЛЕННАЯ функция для смены роли
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
            
            // Отправляем просто число, а не объект
            const response = await fetch(`http://localhost:5217/api/users/own/role`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(roleValue), // ← Просто число!
            });

            if (response.ok) {
                console.log(`✅ Role changed successfully to: ${roleName}`);
                
                console.log('Getting new test token after role change...');
                const newTokenSuccess = await getTestTokens();
                
                if (newTokenSuccess) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    setCurrentRole(roleName);
                    console.log(`✅ Role updated locally: ${roleName}`);
                    setAuthError(null);
                } else {
                    console.warn('Could not get new test token');
                    setCurrentRole(null);
                    setAuthError('Не удалось получить новый токен после смены роли');
                }
            } else {
                const errorText = await response.text();
                console.error('Failed to change role:', response.status, errorText);
                setAuthError(`Ошибка смены роли: ${response.status}`);
            }
        } catch (error) {
            console.error('Error changing role:', error);
            setAuthError('Ошибка сети при смене роли');
        }
    };

    useEffect(() => {
        const initializeAuth = async () => {
            const existingToken = localStorage.getItem('accessToken');
            
            if (existingToken && validateTokenLocally(existingToken)) {
                console.log('✅ Valid token found');
                
                if (userRole) {
                    setCurrentRole(extractRoleFromUserData({ role: userRole }));
                    console.log('Initial role from store:', currentRole);
                    setIsLoading(false);
                    return;
                }
                
                console.log('No userRole in store, getting test token...');
                const success = await getTestTokens();
                
                if (success) {
                    setCurrentRole('user');
                    console.log('Initial role set to "user" after getting test token');
                }
                
                setIsLoading(false);
            } else {
                console.log('No valid token found, attempting to get test token...');
                const success = await getTestTokens();
                
                if (success) {
                    setCurrentRole('user');
                    console.log('Initial role set to "user" after getting test token');
                }
                
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, [userRole]);

    if (isLoading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Загрузка...</div>;
    }

    if (!localStorage.getItem('accessToken')) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <p>Не удалось получить токен авторизации</p>
                <button 
                    onClick={() => window.location.reload()}
                    style={{
                        marginTop: '20px',
                        padding: '10px 20px',
                        background: '#1976d2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                >
                    Повторить попытку
                </button>
            </div>
        );
    }

    if (!currentRole) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Загрузка роли...</div>;
    }

    return (
        <>
            {/* Панель для смены ролей */}
            <div style={{
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
                    disabled={currentRole === 'admin'}
                    style={{
                        padding: '8px 16px',
                        background: currentRole === 'admin' ? '#1976d2' : '#f0f0f0',
                        color: currentRole === 'admin' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: currentRole === 'admin' ? 'not-allowed' : 'pointer',
                        opacity: currentRole === 'admin' ? 0.6 : 1,
                    }}
                >
                    Админ
                </button>
                <button 
                    onClick={() => changeUserRole(1)} 
                    disabled={currentRole === 'manager'}
                    style={{
                        padding: '8px 16px',
                        background: currentRole === 'manager' ? '#1976d2' : '#f0f0f0',
                        color: currentRole === 'manager' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: currentRole === 'manager' ? 'not-allowed' : 'pointer',
                        opacity: currentRole === 'manager' ? 0.6 : 1,
                    }}
                >
                    Менеджер
                </button>
                <button 
                    onClick={() => changeUserRole(2)} 
                    disabled={currentRole === 'user'}
                    style={{
                        padding: '8px 16px',
                        background: currentRole === 'user' ? '#1976d2' : '#f0f0f0',
                        color: currentRole === 'user' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: currentRole === 'user' ? 'not-allowed' : 'pointer',
                        opacity: currentRole === 'user' ? 0.6 : 1,
                    }}
                >
                    Пользователь
                </button>
            </div>

            {/* Отображение ошибки авторизации */}
            {authError && (
                <div style={{
                    position: 'fixed',
                    top: '80px',
                    right: '10px',
                    zIndex: 2000,
                    background: '#ff4444',
                    color: 'white',
                    padding: '10px 15px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                }}>
                    {authError}
                    <button 
                        onClick={() => setAuthError(null)}
                        style={{
                            marginLeft: '10px',
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '16px',
                        }}
                    >
                        ×
                    </button>
                </div>
            )}

            <Navigation devRole={currentRole} />

            <Routes location={state?.backgroundLocation || location}>
                <Route path='/' element={
                    currentRole === 'admin' ? <AdminDashboard /> :
                    currentRole === 'manager' ? <ManagerDashboard /> :
                    <EmployeeDashboard />
                } />
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
                <Route path='/admin/import' element={<ImportPage />} />
            </Routes>
        </>
    );
};