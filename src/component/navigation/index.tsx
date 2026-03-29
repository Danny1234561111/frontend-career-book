import { NavLink, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/strore';
import '../../styles.css';
import logo from '../../assets/logo.png';

type MenuItem = {
	path: string;
	label: string;
	icon?: string;
};

interface NavigationProps {
	devRole?: 'admin' | 'manager' | 'user'; // для разработки
}

const Navigation = ({ devRole }: NavigationProps) => {
	const navigate = useNavigate();
	const storeRole = useAppSelector((state) => state.auth.role);

	// Используем devRole если он передан, иначе роль из стора
	const role = devRole || storeRole;

	const getMenuItems = (): MenuItem[] => {
		switch (role) {
			case 'admin':
				return [
					{ path: '/', label: 'Главная' },
					{ path: '/admin/import', label: 'Импорт из Excel' },
					{ path: '/admin/users', label: 'Пользователи' },
					{ path: '/admin/competencies', label: 'Компетенции' },
					{ path: '/admin/materials', label: 'Учебные материалы' },
					{ path: '/settings', label: 'Настройки' },
				];

			case 'manager':
				return [
					{ path: '/', label: 'Главная' },
					{ path: '/department/main', label: 'Мой отдел' },
					{ path: '/department/competencies', label: 'Компетенции отдела' },
					{ path: '/department/materials', label: 'Учебные материалы' },
					{ path: '/settings', label: 'Настройки' },
				];

			case 'user':
			default:
				return [
					{ path: '/', label: 'Главная' },
					{ path: '/my-competencies', label: 'Мои компетенции' },
					{ path: '/ipr', label: 'ИПР' },
					{ path: '/materials', label: 'Учебные материалы' },
					{ path: '/settings', label: 'Настройки' },
				];
		}
	};

	const menuItems = getMenuItems();

	return (
		<div className='navigation'>
			<div className='container'>
				<div className='logo' onClick={() => navigate('/')}>
					<span className='logoIcon'>
						<img src={logo} alt='Логотип' />
					</span>
				</div>

				<div className='tabs'>
					{menuItems.map((item) => (
						<NavLink
							key={item.path}
							to={item.path}
							className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
							{item.icon && <span className='tabIcon'>{item.icon}</span>}
							<span className='tabLabel'>{item.label}</span>
						</NavLink>
					))}
				</div>

				<div className='rightSection'>
					<button className='profileBtn' onClick={() => navigate('/profile')}>
						<div className='avatar'>👤</div>
					</button>
				</div>
			</div>
		</div>
	);
};

export default Navigation;
