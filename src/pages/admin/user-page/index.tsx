// users_page.tsx (ИСПРАВЛЕННЫЙ - без должностей, но с email)

import React, { useState, useEffect } from 'react';
import { UserTable, UserFilters } from '../../../component';
import styles from './users_page.module.scss';

interface User {
	id: string;
	fullName: string;
	email: string;
	role: 'admin' | 'manager' | 'user';
	department?: string;
	createdAt: string;
	employeeId?: string;
}

interface Filters {
	search?: string;
	role?: string;
	department?: string;
	dateFrom?: string;
	dateTo?: string;
}

const UsersPage: React.FC = () => {
	const accessToken = localStorage.getItem('accessToken');
	
	const [allUsers, setAllUsers] = useState<User[]>([]);
	const [filters, setFilters] = useState<Filters>({});
	const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
	const [departments, setDepartments] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	// Получение списка пользователей из API (/api/users)
	const fetchUsers = async () => {
		try {
			const token = localStorage.getItem('accessToken');
			if (!token) {
				setError('Нет токена доступа');
				return;
			}

			console.log('📥 Fetching users from API...');
			const response = await fetch('http://localhost:5217/api/users', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'accept': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Users from API:', data);
				
				const users: User[] = data.map((user: any) => {
					// Определяем роль по строковому значению (value)
					let role: 'admin' | 'manager' | 'user' = 'user';
					const roleValue = user.role?.value;
					if (roleValue === 'Admin') role = 'admin';
					else if (roleValue === 'Boss') role = 'manager';
					
					// Получаем информацию о сотруднике
					const employee = user.employee || {};
					
					return {
						id: user.id,
						employeeId: user.employeeId,
						fullName: `${employee.lastName || ''} ${employee.firstName || ''} ${employee.middleName || ''}`.trim() || user.fullName || 'Не указано',
						email: employee.email || user.email || 'Не указан',
						role: role,
						department: employee.department?.name || '-',
						createdAt: user.createdAt || user.lastOnline || new Date().toISOString(),
					};
				});
				
				setAllUsers(users);
				
				const uniqueDepartments = [...new Set(users.map(u => u.department).filter(d => d && d !== '-'))];
				setDepartments(uniqueDepartments);
			} else {
				console.error('Failed to fetch users:', response.status);
				setError('Ошибка загрузки пользователей');
			}
		} catch (error) {
			console.error('Error fetching users:', error);
			setError('Не удалось подключиться к серверу');
		}
	};

	// Обновление роли пользователя
	const updateUserRole = async (userId: string, roleValue: number): Promise<boolean> => {
		try {
			console.log(`📤 Sending PATCH request to: http://localhost:5217/api/users/${userId}/role?userRole=${roleValue}`);
			
			const response = await fetch(`http://localhost:5217/api/users/${userId}/role?userRole=${roleValue}`, {
				method: 'PATCH',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'application/json',
				},
			});

			if (response.ok) {
				const result = await response.json();
				console.log(`✅ Role updated for user ${userId}:`, result);
				return true;
			} else {
				const errorText = await response.text();
				console.error(`❌ Failed to update role for user ${userId}: ${response.status} - ${errorText}`);
				return false;
			}
		} catch (error) {
			console.error(`❌ Error updating role for user ${userId}:`, error);
			return false;
		}
	};

	// Применяем фильтры при их изменении
	useEffect(() => {
		let result = [...allUsers];

		if (filters.search) {
			const searchLower = filters.search.toLowerCase();
			result = result.filter(
				(user) =>
					user.fullName.toLowerCase().includes(searchLower) ||
					user.email.toLowerCase().includes(searchLower)
			);
		}

		if (filters.role) {
			result = result.filter((user) => user.role === filters.role);
		}

		if (filters.department) {
			result = result.filter((user) => user.department === filters.department);
		}

		if (filters.dateFrom) {
			const fromDate = new Date(filters.dateFrom).getTime();
			result = result.filter(
				(user) => new Date(user.createdAt).getTime() >= fromDate
			);
		}

		if (filters.dateTo) {
			const toDate = new Date(filters.dateTo).getTime();
			result = result.filter(
				(user) => new Date(user.createdAt).getTime() <= toDate
			);
		}

		setFilteredUsers(result);
	}, [filters, allUsers]);

	// Сохранение изменений на сервере и перезагрузка данных
	const handleSaveChanges = async (updatedUsers: User[]) => {
		try {
			const token = localStorage.getItem('accessToken');
			if (!token) {
				setError('Нет токена доступа');
				return;
			}

			setIsLoading(true);
			let successCount = 0;
			let errorCount = 0;
			const errors: string[] = [];

			// Отправляем PATCH запросы для каждого измененного пользователя
			for (const user of updatedUsers) {
				const originalUser = allUsers.find(u => u.id === user.id);
				if (!originalUser) continue;
				
				// Обновляем роль, если она изменилась
				if (originalUser.role !== user.role) {
					console.log(`🔄 Changing role for ${user.fullName} (ID: ${user.id}): ${originalUser.role} -> ${user.role}`);
					
					// Определяем числовое значение роли
					let roleValue = 2; // по умолчанию user (2)
					if (user.role === 'admin') roleValue = 0;
					else if (user.role === 'manager') roleValue = 1;
					
					const success = await updateUserRole(user.id, roleValue);
					if (success) {
						successCount++;
						console.log(`✅ Role changed successfully for ${user.fullName}`);
					} else {
						errorCount++;
						errors.push(`Не удалось изменить роль для ${user.fullName}`);
						console.error(`❌ Failed to change role for ${user.fullName}`);
					}
				}
			}
			
			if (errorCount === 0 && successCount > 0) {
				setSuccessMessage(`Роли успешно сохранены на сервере (${successCount} изменений)`);
				await fetchUsers();
				setTimeout(() => setSuccessMessage(null), 3000);
			} else if (successCount > 0 && errorCount > 0) {
				setError(`Сохранено на сервере: ${successCount}, ошибок: ${errorCount}. ${errors.join('; ')}`);
				setTimeout(() => setError(null), 5000);
				await fetchUsers();
			} else if (errorCount > 0) {
				setError(`Ошибка при сохранении на сервере: ${errors.join('; ')}`);
				setTimeout(() => setError(null), 5000);
			} else {
				setSuccessMessage('Нет изменений для сохранения');
				setTimeout(() => setSuccessMessage(null), 2000);
			}
		} catch (error) {
			console.error('Error saving changes:', error);
			setError('Ошибка при сохранении изменений');
			setTimeout(() => setError(null), 3000);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true);
			await fetchUsers();
			setIsLoading(false);
		};
		loadData();
	}, []);

	if (isLoading) {
		return (
			<div className={styles.page}>
				<div className={styles.loading}>Загрузка пользователей...</div>
			</div>
		);
	}

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<h1 className={styles.title}>Управление пользователями</h1>
			</div>

			<div className={styles.content}>
				{successMessage && (
					<div className={styles.successMessage}>{successMessage}</div>
				)}
				{error && (
					<div className={styles.errorMessage}>{error}</div>
				)}

				<UserFilters 
					onFilterChange={setFilters} 
					departments={departments}
				/>

				<UserTable 
					users={filteredUsers} 
					onSaveChanges={handleSaveChanges}
				/>

				<div className={styles.stats}>
					Найдено пользователей: <strong>{filteredUsers.length}</strong>
				</div>
			</div>
		</div>
	);
};

export default UsersPage;