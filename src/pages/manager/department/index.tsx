import React, { useState } from 'react';
import { ManagerUserTable } from '../../../component'; // новый компонент
import styles from './department.module.scss';

interface DepartmentStats {
	totalEmployees: number;
	avgCompetencyLevel: number;
	inProgressIpr: number;
	completedIpr: number;
}

// Моковые данные сотрудников отдела
const departmentEmployees = [
	{
		id: '1',
		fullName: 'Иванов Иван Иванович',
		email: 'ivanov@enplus.digital',
		department: 'IT отдел',
		currentPosition: 'Специалист',
		targetPosition: 'Ведущий специалист',
		progress: 65,
		createdAt: '2024-01-15',
	},
	{
		id: '2',
		fullName: 'Петров Петр Петрович',
		email: 'petrov@enplus.digital',
		department: 'IT отдел',
		currentPosition: 'Специалист',
		targetPosition: 'Специалист',
		progress: 30,
		createdAt: '2024-01-10',
	},
	{
		id: '3',
		fullName: 'Сидорова Мария Ивановна',
		email: 'sidorova@enplus.digital',
		department: 'IT отдел',
		currentPosition: 'Ведущий специалист',
		targetPosition: 'Главный специалист',
		progress: 80,
		createdAt: '2024-01-05',
	},
	{
		id: '4',
		fullName: 'Козлов Алексей Дмитриевич',
		email: 'kozlov@enplus.digital',
		department: 'IT отдел',
		currentPosition: 'Специалист',
		targetPosition: 'Ведущий специалист',
		progress: 45,
		createdAt: '2024-01-20',
	},
];

const DepartmentPage: React.FC = () => {
	// Данные отдела
	const departmentStats: DepartmentStats = {
		totalEmployees: departmentEmployees.length,
		avgCompetencyLevel: 3.2,
		inProgressIpr: 5,
		completedIpr: 3,
	};

	const handleTargetPositionChange = (userId: string, newPosition: string) => {
		console.log('Target position changed:', userId, newPosition);
	};

	const handleSaveChanges = (updatedUsers: any[]) => {
		console.log('Saving changes:', updatedUsers);
		alert('Изменения сохранены');
	};

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<h1 className={styles.title}>Мой отдел</h1>
			</div>

			<div className={styles.content}>
				{/* Статистика отдела */}
				<div className={styles.statsGrid}>
					<div className={styles.statCard}>
						<span className={styles.statValue}>
							{departmentStats.totalEmployees}
						</span>
						<span className={styles.statLabel}>Сотрудников</span>
					</div>
					<div className={styles.statCard}>
						<span className={styles.statValue}>
							{departmentStats.avgCompetencyLevel}
						</span>
						<span className={styles.statLabel}>Средний уровень</span>
					</div>
					<div className={styles.statCard}>
						<span className={styles.statValue}>
							{departmentStats.inProgressIpr}
						</span>
						<span className={styles.statLabel}>ИПР в работе</span>
					</div>
					<div className={styles.statCard}>
						<span className={styles.statValue}>
							{departmentStats.completedIpr}
						</span>
						<span className={styles.statLabel}>ИПР выполнено</span>
					</div>
				</div>

				{/* Таблица сотрудников */}
				<div className={styles.tableSection}>
					<h2>Сотрудники отдела</h2>
					<ManagerUserTable
						users={departmentEmployees}
						onTargetPositionChange={handleTargetPositionChange}
						onSaveChanges={handleSaveChanges}
					/>
				</div>
			</div>
		</div>
	);
};

export default DepartmentPage;
