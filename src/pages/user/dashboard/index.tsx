import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../../../store/strore';
import styles from './user_dashboard.module.scss';

interface ProfileData {
	id?: string;
	fullName: string;
	currentPosition: string;
	targetPosition: string;
	progress: {
		percent: number;
		completedMaterials: number;
		totalRequiredMaterials: number;
	};
	department: string;
	role?: {
		id: string;
		name: string;
		value: string;
	};
}

interface AppLog {
	id: string;
	text: string;
	employeeId: string;
	createdAt: string;
}

interface MaterialTask {
	id: string;
	status: number;
	material: {
		duration: number;
		name: string;
	};
}

const EmployeeDashboard: React.FC = () => {
	const user = useAppSelector((state) => state.auth.user);
	const accessToken = localStorage.getItem('accessToken');

	const [profile, setProfile] = useState<ProfileData | null>(null);
	const [recentUpdates, setRecentUpdates] = useState<AppLog[]>([]);
	const [materials, setMaterials] = useState<MaterialTask[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchProfile = async () => {
		try {
			const response = await fetch('http://localhost:5217/api/users/profile', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				
				let departmentStr = 'Не указан';
				if (data.department) {
					if (typeof data.department === 'string') {
						departmentStr = data.department;
					} else if (data.department.name) {
						departmentStr = data.department.name;
					}
				}
				
				setProfile({
					id: data.id,
					fullName: data.fullName || `${data.lastName || ''} ${data.firstName || ''}`.trim() || 'Пользователь',
					currentPosition: data.currentPosition || 'Не указана',
					targetPosition: data.targetPosition || 'Не указана',
					progress: data.progress || { percent: 0, completedMaterials: 0, totalRequiredMaterials: 0 },
					department: departmentStr,
					role: data.role,
				});
			}
		} catch (error) {
			console.error('Error fetching profile:', error);
		}
	};

	const fetchRecentUpdates = async () => {
		try {
			const response = await fetch('http://localhost:5217/api/applogs/own', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'application/json',
				},
			});

			if (response.ok) {
				const data: AppLog[] = await response.json();
				setRecentUpdates(data);
			} else if (response.status === 404) {
				setRecentUpdates([]);
			}
		} catch (error) {
			console.error('Error fetching updates:', error);
		}
	};

	const fetchMaterials = async () => {
		try {
			const response = await fetch('http://localhost:5217/api/material-task?withDeleted=false', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'application/json',
				},
			});

			if (response.ok) {
				const data: MaterialTask[] = await response.json();
				setMaterials(data);
				return data;
			}
			return [];
		} catch (error) {
			console.error('Error fetching materials:', error);
			return [];
		}
	};

	const calculateProgressFromMaterials = (materialsData: MaterialTask[]) => {
		if (!materialsData || materialsData.length === 0) {
			return {
				percent: 0,
				completedMaterials: 0,
				totalRequiredMaterials: 0,
			};
		}

		const completedMaterials = materialsData.filter(m => m.status === 2).length;
		const totalMaterials = materialsData.length;
		const percent = totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0;
		
		return {
			percent: percent,
			completedMaterials: completedMaterials,
			totalRequiredMaterials: totalMaterials,
		};
	};

	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true);
			setError(null);
			
			if (!accessToken) {
				setError('Нет токена авторизации');
				setIsLoading(false);
				return;
			}

			try {
				await fetchProfile();
				const materialsData = await fetchMaterials();
				const realProgress = calculateProgressFromMaterials(materialsData);
				
				setProfile(prev => prev ? {
					...prev,
					progress: realProgress,
				} : prev);
				
				await fetchRecentUpdates();
			} catch (error) {
				console.error('Error loading dashboard data:', error);
				setError('Ошибка загрузки данных');
			} finally {
				setIsLoading(false);
			}
		};

		loadData();
	}, [accessToken]);

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	if (isLoading) {
		return (
			<div className={styles.page}>
				<div className={styles.loading}>Загрузка...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className={styles.page}>
				<div className={styles.error}>{error}</div>
			</div>
		);
	}

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<h1 className={styles.title}>Главный экран</h1>
			</div>

			<div className={styles.content}>
				{/* Приветственная карточка */}
				<div className={styles.card}>
					<div className={styles.welcomeSection}>
						<h2 className={styles.greeting}>
							{profile?.fullName || user?.name || 'Пользователь'}
						</h2>
						<div className={styles.positionInfo}>
							<div className={styles.infoRow}>
								<span className={styles.infoLabel}>Текущая должность:</span>
								<span className={styles.infoValue}>{profile?.currentPosition || 'Не указана'}</span>
							</div>
							<div className={styles.infoRow}>
								<span className={styles.infoLabel}>Целевая должность:</span>
								<span className={styles.infoValue}>{profile?.targetPosition || 'Не указана'}</span>
							</div>
							{profile?.department && profile.department !== 'Не указан' && (
								<div className={styles.infoRow}>
									<span className={styles.infoLabel}>Отдел:</span>
									<span className={styles.infoValue}>{profile.department}</span>
								</div>
							)}
							{profile?.role && (
								<div className={styles.infoRow}>
									<span className={styles.infoLabel}>Роль:</span>
									<span className={styles.infoValue}>{profile.role.name || profile.role.value}</span>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Прогресс развития */}
				{profile?.progress && (
					<div className={styles.card}>
						<div className={styles.progressSection}>
							<div className={styles.progressHeader}>
								<span className={styles.progressLabel}>Текущий прогресс развития</span>
								<span className={styles.progressPercent}>{profile.progress.percent}%</span>
							</div>
							<div className={styles.progressBar}>
								<div
									className={styles.progressFill}
									style={{ width: `${profile.progress.percent}%` }}
								/>
							</div>
							<div className={styles.progressStats}>
								<span className={styles.completedCount}>
									Выполнено: {profile.progress.completedMaterials} {" "} из {profile.progress.totalRequiredMaterials} материалов
								</span>
							</div>
						</div>
					</div>
				)}

				{/* Блок последних обновлений */}
				<div className={styles.card}>
					<div className={styles.updatesSection}>
						<h2 className={styles.sectionTitle}>Последние обновления</h2>
						{recentUpdates.length > 0 ? (
							<div className={styles.updatesList}>
								{recentUpdates.map((update) => (
									<div key={update.id} className={styles.updateItem}>
										<span className={styles.updateDate}>
											{formatDate(update.createdAt)}
										</span>
										<span className={styles.updateText}>{update.text}</span>
									</div>
								))}
							</div>
						) : (
							<p className={styles.noUpdates}>Нет обновлений</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default EmployeeDashboard;