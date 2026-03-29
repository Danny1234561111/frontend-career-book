import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../../store/strore';
import {
	ProfileTab,
	AdminTab,
	InterfaceTab,
	MonitoringTab,
} from '../../../component';
import styles from './settings.module.scss';

type TabType = 'profile' | 'admin' | 'monitoring' | 'interface';

// Временные данные пользователя, если в store нет
const mockUser = {
	id: 'f50b6d32-30e9-5599-a5ab-80110cb28681',
	fullName: 'Иванов Иван Иванович',
	account: 'IvanovII',
	email: 'Ivanov@enplus.digital',
	organization: 'ЭН+ ДИДЖИТАЛ ООО',
	department: 'Отдел развития веб-решений',
	currentPosition: 'Ведущий специалист по разработке',
};

const SettingsPage: React.FC = () => {
	const [activeTab, setActiveTab] = useState<TabType>('profile');

	// Пытаемся получить данные из store
	const storeRole = useAppSelector((state) => state.auth?.role);
	const storeUser = useAppSelector((state) => state.auth?.user);

	// Используем данные из store или моковые для разработки
	const userRole = storeRole || 'admin'; // По умолчанию админ для разработки
	const user = storeUser || mockUser;

	// Определяем доступные вкладки в зависимости от роли
	const getAvailableTabs = () => {
		const tabs = [
			{ id: 'profile' as TabType, label: 'Профиль', icon: '👤' },
			{
				id: 'monitoring' as TabType,
				label: 'Мониторинг изменений',
				icon: '📊',
			},
			{ id: 'interface' as TabType, label: 'Интерфейс', icon: '🎨' },
		];

		if (userRole === 'admin') {
			tabs.splice(1, 0, {
				id: 'admin' as TabType,
				label: 'Администрирование',
				icon: '⚙️',
			});
		}

		return tabs;
	};

	const availableTabs = getAvailableTabs();

	// Если текущая вкладка недоступна для роли, переключаем на первую доступную
	useEffect(() => {
		if (!availableTabs.some((tab) => tab.id === activeTab)) {
			setActiveTab(availableTabs[0]?.id || 'profile');
		}
	}, [userRole, activeTab, availableTabs]);

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<h1 className={styles.title}>Настройки</h1>
			</div>

			<div className={styles.content}>
				<div className={styles.tabs}>
					{availableTabs.map((tab) => (
						<button
							key={tab.id}
							className={`${styles.tab} ${
								activeTab === tab.id ? styles.active : ''
							}`}
							onClick={() => setActiveTab(tab.id)}>
							<span className={styles.tabIcon}>{tab.icon}</span>
							<span className={styles.tabLabel}>{tab.label}</span>
						</button>
					))}
				</div>

				<div className={styles.tabContent}>
					{activeTab === 'profile' && <ProfileTab user={user} />}
					{activeTab === 'admin' && userRole === 'admin' && <AdminTab />}
					{activeTab === 'monitoring' && <MonitoringTab userRole={userRole} />}
					{activeTab === 'interface' && <InterfaceTab />}
				</div>
			</div>
		</div>
	);
};

export default SettingsPage;
