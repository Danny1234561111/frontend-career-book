import { 
  Auth, 
  Main, 
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
  EmployeeDashboard 
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
  
  // Временное состояние для разработки
  const [devRole, setDevRole] = useState<'admin' | 'manager' | 'user'>('admin');

  useEffect(() => {
    dispatch(checkToken());
  }, []);

  // Временно подменяем роль для разработки
  useEffect(() => {
    console.log('Current dev role:', devRole);
  }, [devRole]);

  return (
    <>
      {/* Временный переключатель ролей для разработки */}
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
        gap: '10px'
      }}>
        <button 
          onClick={() => setDevRole('admin')}
          style={{
            padding: '8px 16px',
            background: devRole === 'admin' ? '#1976d2' : '#f0f0f0',
            color: devRole === 'admin' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Админ
        </button>
        <button 
          onClick={() => setDevRole('manager')}
          style={{
            padding: '8px 16px',
            background: devRole === 'manager' ? '#1976d2' : '#f0f0f0',
            color: devRole === 'manager' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Менеджер
        </button>
        <button 
          onClick={() => setDevRole('user')}
          style={{
            padding: '8px 16px',
            background: devRole === 'user' ? '#1976d2' : '#f0f0f0',
            color: devRole === 'user' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Пользователь
        </button>
      </div>

      {/* Передаем роль в навигацию через пропс */}
      <Navigation devRole={devRole} />
      
      {/* Роутинг для разработки - все страницы доступны */}
      <Routes location={state?.backgroundLocation || location}>
        {/* Роль-зависимые главные страницы */}
        <Route 
          path='/' 
          element={
            devRole === 'admin' ? <AdminDashboard /> :
            devRole === 'manager' ? <ManagerDashboard /> :
            <EmployeeDashboard />
          } 
        />
        
        {/* Общие страницы */}
        <Route path='/auth' element={<Auth />} />
        <Route path='/profile' element={<ProfilePage />} />
        <Route path='/materials' element={<MaterialsPage />} />
        
        {/* Страницы пользователя */}
        <Route path='/my-competencies' element={<MyCompetenciesPage />} />
        <Route path='/ipr' element={<IprPage />} />
        
        {/* Страницы менеджера */}
        <Route path='/department/main' element={<DepartmentPage />} />
        <Route path='/department/materials' element={<DepartmentMaterialsPage />} />
        <Route path='/department/competencies' element={<DepartmentCompetenciesPage />} />
        
        {/* Страницы админа */}
        <Route path='/admin/materials' element={<MaterialsAdminPage />} />
        <Route path='/settings' element={<SettingsPage />} />
        <Route path='/admin/competencies' element={<CompetenciesPage />} />
        <Route path='/admin/users' element={<UsersPage />} />
      </Routes>

      {/* Закомментированный код для будущего использования с бэком */}
      {/* 
      <Routes location={state?.backgroundLocation || location}>
        <Route path='/' element={<OnlyAuth component={<Main />} />} />
        <Route path='/auth' element={<OnlyUnAuth component={<Auth />} />} />
        <Route path='/profile' element={<OnlyAuth component={<ProfilePage />} />} />
        <Route path='/my-competencies' element={<OnlyAuth component={<MyCompetenciesPage />} />} />
        <Route path='/ipr' element={<OnlyAuth component={<IprPage />} />} />
        <Route path='/materials' element={<OnlyAuth component={<MaterialsPage />} />} />
        
        <Route path='/admin/materials' element={<OnlyAuth role="admin" component={<MaterialsAdminPage />} />} />
        <Route path='/admin/settings' element={<OnlyAuth role="admin" component={<SettingsPage />} />} />
        <Route path='/admin/competencies' element={<OnlyAuth role="admin" component={<CompetenciesPage />} />} />
        <Route path='/admin/users' element={<OnlyAuth role="admin" component={<UsersPage />} />} />
        
        <Route path='/department/main' element={<OnlyAuth role="manager" component={<DepartmentPage />} />} />
        <Route path='/department/materials' element={<OnlyAuth role="manager" component={<DepartmentMaterialsPage />} />} />
        <Route path='/department/competencies' element={<OnlyAuth role="manager" component={<DepartmentCompetenciesPage />} />} />
      </Routes>
      */}
    </>
  );
};