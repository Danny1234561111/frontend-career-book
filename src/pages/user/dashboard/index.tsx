import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../../../store/strore';
import styles from './user_dashboard.module.scss';

interface JobHierarchy {
	id: string;
	jobTitleId: string;
	jobTitle: { id: string; name: string };
	jobLevelId: string;
	jobLevel: { id: string; name: string };
	level: number;
}

interface UserJobInfo {
	currentJobTitle: string;
	currentJobLevel: string;
	nextJobTitle: string;
	nextJobLevel: string;
	specialization: string;
}

interface ProfileData {
	id?: string;
	fullName: string;
	currentPosition: string;
	targetPosition: string;
	specialization: string;
	progress: {
		percent: number;
		completedMaterials: number;
		totalRequiredMaterials: number;
	};
	department: {
		id: string;
		name: string;
	};
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

// Функция для извлечения специальности из названия должности
const extractSpecialization = (jobTitle: string): string => {
	if (!jobTitle) return '';
	
	// Паттерн: "Название должности (Специализация)"
	const bracketMatch = jobTitle.match(/\(([^)]+)\)/);
	if (bracketMatch) {
		return bracketMatch[1];
	}
	
	// Паттерн: "Название должности - Специализация"
	const dashMatch = jobTitle.match(/[-–—]\s*(.+)$/);
	if (dashMatch) {
		return dashMatch[1];
	}
	
	return '';
};

// Функция для получения основной должности без специализации
const getMainJobTitle = (jobTitle: string): string => {
	if (!jobTitle) return 'Не указана';
	
	// Убираем содержимое в скобках
	let main = jobTitle.replace(/\s*\([^)]*\)\s*/, '');
	// Убираем текст после дефиса
	main = main.replace(/[-–—]\s*.+$/, '');
	
	return main.trim() || jobTitle;
};

const EmployeeDashboard: React.FC = () => {
	const user = useAppSelector((state) => state.auth.user);
	const accessToken = localStorage.getItem('accessToken');

	const [profile, setProfile] = useState<ProfileData | null>(null);
	const [userJobInfo, setUserJobInfo] = useState<UserJobInfo | null>(null);
	const [recentUpdates, setRecentUpdates] = useState<AppLog[]>([]);
	const [materials, setMaterials] = useState<MaterialTask[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Получение иерархии должностей
	const fetchJobHierarchies = async (): Promise<JobHierarchy[]> => {
		try {
			const response = await fetch('http://localhost:5217/api/jobhierarchies?withDeleted=false', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'application/json',
				},
			});

			if (response.ok) {
				const data: JobHierarchy[] = await response.json();
				return data;
			}
			return [];
		} catch (error) {
			console.error('Error fetching job hierarchies:', error);
			return [];
		}
	};

	// Получение информации о должностях пользователя
	const fetchUserJobInfo = async (): Promise<UserJobInfo | null> => {
		try {
			// Сначала получаем профиль пользователя, чтобы узнать его должность
			const profileResponse = await fetch('http://localhost:5217/api/users/profile', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'application/json',
				},
			});

			if (!profileResponse.ok) return null;
			
			const profileData = await profileResponse.json();
			const userJobTitle = profileData.jobTitle?.name || profileData.currentPosition;
			
			if (!userJobTitle) return null;
			
			// Получаем все иерархии
			const hierarchies = await fetchJobHierarchies();
			
			// Ищем текущую должность пользователя в иерархии
			const currentHierarchy = hierarchies.find(h => 
				h.jobTitle?.name === userJobTitle || 
				getMainJobTitle(h.jobTitle?.name || '') === getMainJobTitle(userJobTitle)
			);
			
			if (!currentHierarchy) {
				console.log('Текущая должность не найдена в иерархии:', userJobTitle);
				return null;
			}
			
			// Ищем следующую должность (следующий уровень)
			const nextHierarchy = hierarchies.find(h => 
				h.jobTitleId === currentHierarchy.jobTitleId && 
				h.level === currentHierarchy.level + 1
			);
			
			const specialization = extractSpecialization(userJobTitle);
			const mainJobTitle = getMainJobTitle(userJobTitle);
			
			return {
				currentJobTitle: mainJobTitle,
				currentJobLevel: currentHierarchy.jobLevel?.name || '',
				nextJobTitle: nextHierarchy ? getMainJobTitle(nextHierarchy.jobTitle?.name || '') : 'Достигнут максимум',
				nextJobLevel: nextHierarchy ? nextHierarchy.jobLevel?.name || '' : '',
				specialization: specialization,
			};
		} catch (error) {
			console.error('Error fetching user job info:', error);
			return null;
		}
	};

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
				
				let departmentObj = { id: '', name: 'Не указан' };
				if (data.department) {
					if (typeof data.department === 'string') {
						departmentObj = { id: '', name: data.department };
					} else if (data.department.name) {
						departmentObj = data.department;
					}
				}
				
				setProfile({
					id: data.id,
					fullName: data.fullName || `${data.lastName || ''} ${data.firstName || ''}`.trim() || 'Пользователь',
					currentPosition: data.currentPosition || data.jobTitle?.name || 'Не указана',
					targetPosition: data.targetPosition || 'Не указана',
					specialization: '',
					progress: data.progress || { percent: 0, completedMaterials: 0, totalRequiredMaterials: 0 },
					department: departmentObj,
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
				const jobInfo = await fetchUserJobInfo();
				setUserJobInfo(jobInfo);
				
				const materialsData = await fetchMaterials();
				const realProgress = calculateProgressFromMaterials(materialsData);
				
				setProfile(prev => prev ? {
					...prev,
					progress: realProgress,
					specialization: jobInfo?.specialization || '',
					currentPosition: jobInfo?.currentJobTitle || prev.currentPosition,
					targetPosition: jobInfo?.nextJobTitle || prev.targetPosition,
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
				<div className={styles.card}>
					<div className={styles.welcomeSection}>
						<h2 className={styles.greeting}>
							{profile?.fullName || user?.name || 'Пользователь'}
						</h2>
						<div className={styles.positionInfo}>
							<div className={styles.infoRow}>
								<span className={styles.infoLabel}>Текущая должность:</span>
								<div className={styles.infoValueWrapper}>
									<span className={styles.infoValue}>{userJobInfo?.currentJobTitle || profile?.currentPosition || 'Не указана'}</span>
									{userJobInfo?.currentJobLevel && (
										<span className={styles.levelBadge}>{userJobInfo.currentJobLevel}</span>
									)}
								</div>
							</div>
							
							<div className={styles.infoRow}>
								<span className={styles.infoLabel}>Целевая должность:</span>
								<div className={styles.infoValueWrapper}>
									<span className={styles.infoValue}>{userJobInfo?.nextJobTitle || profile?.targetPosition || 'Не указана'}</span>
									{userJobInfo?.nextJobLevel && (
										<span className={styles.levelBadge}>{userJobInfo.nextJobLevel}</span>
									)}
								</div>
							</div>
							
							{userJobInfo?.specialization && (
								<div className={styles.infoRow}>
									<span className={styles.infoLabel}>Специальность:</span>
									<div className={styles.infoValueWrapper}>
										<span className={styles.specializationMain}>
											🎯 {userJobInfo.specialization}
										</span>
									</div>
								</div>
							)}
							
							{profile?.department && profile.department.name !== 'Не указан' && (
								<div className={styles.infoRow}>
									<span className={styles.infoLabel}>Отдел:</span>
									<span className={styles.infoValue}>{profile.department.name}</span>
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
									Выполнено: {profile.progress.completedMaterials} из {profile.progress.totalRequiredMaterials} материалов
								</span>
							</div>
						</div>
					</div>
				)}

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