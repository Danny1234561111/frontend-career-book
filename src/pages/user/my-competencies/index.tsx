import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../store/strore';
import styles from './my-competencies.module.scss';

interface Competency {
	id: string;
	name: string;
	block: string;
	currentLevel: number;
	targetLevel: number;
	nextLevel: number;
	progress: number;
	materialsCount: number;
}

interface CompetencyFull {
	id: string;
	name: string;
	type: string;
	hierarchyId: string;
	hierarchy?: { id: string; name: string };
	description: string;
	proficiencyLevels?: Array<{ value: number; name: string }>;
	materialsCount?: number;
}

interface EducationalMaterialCompetency {
	id: string;
	educationalMaterialId: string;
	competencyId: string;
	targetLevel: {
		id: string;
		name: string;
		value: string;
	} | null;
}

interface UserProfile {
	fullName: string;
	currentPosition: string;
	targetPosition: string;
	department: { id: string; name: string };
}

const MyCompetenciesPage = () => {
	const navigate = useNavigate();
	const user = useAppSelector((state) => state.auth.user);
	const accessToken = localStorage.getItem('accessToken');
	
	const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');
	const [filterByBlock, setFilterByBlock] = useState<string>('all');
	// Три блока компетенций
	const [currentLevelCompetencies, setCurrentLevelCompetencies] = useState<Competency[]>([]);
	const [nextLevelCompetencies, setNextLevelCompetencies] = useState<Competency[]>([]);
	const [allMyCompetencies, setAllMyCompetencies] = useState<Competency[]>([]);
	const [allCompetencies, setAllCompetencies] = useState<CompetencyFull[]>([]);
	const [blocks, setBlocks] = useState<string[]>(['all']);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [addingCompetencyId, setAddingCompetencyId] = useState<string | null>(null);
	const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

	// Получение профиля пользователя
	const fetchUserProfile = async () => {
		try {
			const token = localStorage.getItem('accessToken');
			if (!token) return null;

			const response = await fetch('http://localhost:5217/api/users/profile', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'accept': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				setUserProfile({
					fullName: data.fullName,
					currentPosition: data.currentPosition || data.jobTitle?.name || 'Не указана',
					targetPosition: data.targetPosition || data.nextJobLevel?.name || 'Не указана',
					department: data.department,
				});
				return data;
			}
		} catch (error) {
			console.error('Error fetching user profile:', error);
		}
		return null;
	};

	const fetchMaterialsCountForTargetLevel = async (competencyId: string, targetLevelValue: number): Promise<number> => {
		try {
			const token = localStorage.getItem('accessToken');
			if (!token) return 0;
			
			// Получаем материалы для целевого уровня
			const response = await fetch(`http://localhost:5217/api/educational-material-competencies/by-competency/${competencyId}`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'accept': 'application/json',
				},
			});

			if (response.ok) {
				const data: EducationalMaterialCompetency[] = await response.json();
				// Фильтруем материалы по целевому уровню
				const filtered = data.filter(item => {
					const targetValue = item.targetLevel?.value;
					return targetValue && parseInt(targetValue) === targetLevelValue;
				});
				return filtered.length;
			}
			return 0;
		} catch (error) {
			console.error(`Error fetching materials for competency ${competencyId}:`, error);
			return 0;
		}
	};

	const fetchTotalMaterialsCountForCompetency = async (competencyId: string): Promise<number> => {
		try {
			const token = localStorage.getItem('accessToken');
			if (!token) return 0;

			const response = await fetch(`http://localhost:5217/api/educational-material-competencies/by-competency/${competencyId}`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'accept': 'application/json',
				},
			});

			if (response.ok) {
				const data: EducationalMaterialCompetency[] = await response.json();
				return data.length;
			}
			return 0;
		} catch (error) {
			console.error(`Error fetching total materials for competency ${competencyId}:`, error);
			return 0;
		}
	};

	// Получение компетенций для текущего уровня должности
	const fetchCurrentLevelCompetencies = async () => {
		try {
			const token = localStorage.getItem('accessToken');
			if (!token) return;

			const response = await fetch('http://localhost:5217/api/competencies/own/current-level', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'accept': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				const transformedCompetencies: Competency[] = [];
				const blockNames: Set<string> = new Set();
				
				console.log('📊 Current level competencies data:', data);
				
				if (data.blocks && Array.isArray(data.blocks)) {
					for (const block of data.blocks) {
						blockNames.add(block.name);
						for (const category of block.categories || []) {
							for (const group of category.groups || []) {
								for (const comp of group.competencies || []) {
									const currentLevel = comp.currentLevel || 0;
									const targetLevel = comp.requiredLevel || 0;
									const nextLevelValue = Math.min(currentLevel + 1, targetLevel);
									
									// Получаем количество материалов для следующего уровня
									let materialsCount = 0;
									if (currentLevel < targetLevel) {
										materialsCount = await fetchMaterialsCountForTargetLevel(comp.id, nextLevelValue);
									}
									
									transformedCompetencies.push({
										id: comp.id,
										name: comp.name,
										block: block.name,
										currentLevel: currentLevel,
										targetLevel: targetLevel,
										nextLevel: nextLevelValue,
										progress: comp.progress?.percent || 0,
										materialsCount: materialsCount,
									});
								}
							}
						}
					}
				}
				setCurrentLevelCompetencies(transformedCompetencies);
				setBlocks(['all', ...Array.from(blockNames)]);
			} else if (response.status === 401) {
				setError('Сессия истекла. Обновите страницу.');
			}
		} catch (error) {
			console.error('Error fetching current level competencies:', error);
			setError('Не удалось подключиться к серверу');
		}
	};

	// Получение компетенций для следующего уровня должности
	const fetchNextLevelCompetencies = async () => {
		try {
			const token = localStorage.getItem('accessToken');
			if (!token) return;

			const response = await fetch('http://localhost:5217/api/competencies/own/next-level', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'accept': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				const transformedCompetencies: Competency[] = [];
				
				console.log('🎯 Next level competencies data:', data);
				
				if (data.blocks && Array.isArray(data.blocks)) {
					for (const block of data.blocks) {
						for (const category of block.categories || []) {
							for (const group of category.groups || []) {
								for (const comp of group.competencies || []) {
									const currentLevel = comp.currentLevel || 0;
									const targetLevel = comp.requiredLevel || 0;
									const nextLevelValue = Math.min(currentLevel + 1, targetLevel);
									
									let materialsCount = 0;
									if (currentLevel < targetLevel) {
										materialsCount = await fetchMaterialsCountForTargetLevel(comp.id, nextLevelValue);
									}
									
									transformedCompetencies.push({
										id: comp.id,
										name: comp.name,
										block: block.name,
										currentLevel: currentLevel,
										targetLevel: targetLevel,
										nextLevel: nextLevelValue,
										progress: comp.progress?.percent || 0,
										materialsCount: materialsCount,
									});
								}
							}
						}
					}
				}
				setNextLevelCompetencies(transformedCompetencies);
			}
		} catch (error) {
			console.error('Error fetching next level competencies:', error);
		}
	};

	// Получение всех компетенций пользователя (включая добавленные)
	const fetchAllMyCompetencies = async () => {
		try {
			const token = localStorage.getItem('accessToken');
			if (!token) return;

			const response = await fetch('http://localhost:5217/api/competencies/own', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'accept': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				const transformedCompetencies: Competency[] = [];
				
				console.log('📚 All my competencies data:', data);
				
				if (data.blocks && Array.isArray(data.blocks)) {
					for (const block of data.blocks) {
						for (const category of block.categories || []) {
							for (const group of category.groups || []) {
								for (const comp of group.competencies || []) {
									const currentLevel = comp.currentLevel || 0;
									const targetLevel = comp.requiredLevel || 0;
									const nextLevelValue = Math.min(currentLevel + 1, targetLevel);
									
									let materialsCount = 0;
									if (currentLevel < targetLevel) {
										materialsCount = await fetchMaterialsCountForTargetLevel(comp.id, nextLevelValue);
									}
									
									transformedCompetencies.push({
										id: comp.id,
										name: comp.name,
										block: block.name,
										currentLevel: currentLevel,
										targetLevel: targetLevel,
										nextLevel: nextLevelValue,
										progress: comp.progress?.percent || 0,
										materialsCount: materialsCount,
									});
								}
							}
						}
					}
				}
				setAllMyCompetencies(transformedCompetencies);
			}
		} catch (error) {
			console.error('Error fetching all my competencies:', error);
		}
	};

	const fetchAllCompetencies = async () => {
		try {
			const token = localStorage.getItem('accessToken');
			if (!token) return;

			const response = await fetch('http://localhost:5217/api/competencies', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'accept': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				const allComps: CompetencyFull[] = [];
				
				if (data.blocks && Array.isArray(data.blocks)) {
					for (const block of data.blocks) {
						for (const category of block.categories || []) {
							for (const group of category.groups || []) {
								for (const comp of group.competencies || []) {
									allComps.push({
										id: comp.id,
										name: comp.name,
										type: comp.type,
										hierarchyId: block.id,
										hierarchy: { id: block.id, name: block.name },
										description: comp.description,
										proficiencyLevels: comp.proficiencyLevels,
									});
								}
							}
						}
					}
				}
				
				const competenciesWithCounts = await Promise.all(
					allComps.map(async (comp) => {
						const count = await fetchTotalMaterialsCountForCompetency(comp.id);
						return { ...comp, materialsCount: count };
					})
				);
				setAllCompetencies(competenciesWithCounts);
			}
		} catch (error) {
			console.error('Error fetching all competencies:', error);
		}
	};

	const addCompetencyToMe = async (competencyId: string) => {
		try {
			setAddingCompetencyId(competencyId);
			const token = localStorage.getItem('accessToken');
			if (!token) {
				setError('Нет токена доступа');
				return;
			}

			const response = await fetch('http://localhost:5217/api/competency-task', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ competencyId: competencyId }),
			});

			if (response.ok || response.status === 204 || response.status === 201) {
				setSuccessMessage('Компетенция успешно добавлена');
				await Promise.all([
					fetchCurrentLevelCompetencies(),
					fetchNextLevelCompetencies(),
					fetchAllMyCompetencies(),
					fetchAllCompetencies()
				]);
				setTimeout(() => setSuccessMessage(null), 3000);
			} else {
				setError(`Не удалось добавить компетенцию: ${response.status}`);
				setTimeout(() => setError(null), 3000);
			}
		} catch (error) {
			console.error('Error adding competency:', error);
			setError('Ошибка при добавлении компетенции');
			setTimeout(() => setError(null), 3000);
		} finally {
			setAddingCompetencyId(null);
		}
	};

	const getAddedCompetencyIds = () => {
		return new Set(allMyCompetencies.map(c => c.id));
	};

	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true);
			await fetchUserProfile();
			await Promise.all([
				fetchCurrentLevelCompetencies(),
				fetchNextLevelCompetencies(),
				fetchAllMyCompetencies(),
				fetchAllCompetencies()
			]);
			setIsLoading(false);
		};
		loadData();
	}, []);

	const getLevelLabel = (level: number) => {
		const labels: Record<number, string> = {
			0: 'Не определен',
			1: 'Базовые знания',
			2: 'Эксперт',
			3: 'Профессионал',
		};
		return labels[level] || `Уровень ${level}`;
	};

	const getLevelClass = (level: number) => {
		if (level === 1) return styles.level1;
		if (level === 2) return styles.level2;
		if (level === 3) return styles.level3;
		return styles.level0;
	};

	const handleViewMaterials = (competencyId: string, competencyName: string) => {
		navigate('/materials', {
			state: {
				filterByCompetency: competencyName,
				competencyId: competencyId,
			},
		});
	};

	const getMaterialsWord = (count: number) => {
		if (count === 0) return 'материалов';
		if (count === 1) return 'материал';
		if (count >= 2 && count <= 4) return 'материала';
		return 'материалов';
	};

	const renderCompetencyTable = (competenciesList: Competency[], showProgress = true) => {
		if (competenciesList.length === 0) return null;
		
		const filteredList = filterByBlock === 'all' 
			? competenciesList 
			: competenciesList.filter(c => c.block === filterByBlock);
		
		if (filteredList.length === 0) {
			return <div className={styles.emptyState}>Нет компетенций в выбранном блоке</div>;
		}
		
		return (
			<div className={styles.tableWrapper}>
				<table className={styles.table}>
					<thead>
						<tr>
							<th>Компетенция</th>
							<th>Блок</th>
							<th>Текущий уровень</th>
							<th>Целевой уровень</th>
							{showProgress && <th>Прогресс</th>}
							<th>Материалы для изучения</th>
						</tr>
					</thead>
					<tbody>
						{filteredList.map((comp) => {
							const isTargetReached = comp.currentLevel >= comp.targetLevel;
							const hasMaterials = comp.materialsCount > 0;
							
							return (
								<tr key={comp.id}>
									<td className={styles.competencyName}>{comp.name}</td>
									<td className={styles.blockCell}>
										<span className={styles.blockBadge}>{comp.block}</span>
										</td>
									<td className={styles.levelCell}>
										<span className={`${styles.levelBadge} ${getLevelClass(comp.currentLevel)}`}>
											{getLevelLabel(comp.currentLevel)}
										</span>
										</td>
									<td className={styles.levelCell}>
										<span className={`${styles.levelBadge} ${getLevelClass(comp.targetLevel)}`}>
											{isTargetReached ? '✓ Достигнут' : getLevelLabel(comp.targetLevel)}
										</span>
										</td>
									{showProgress && (
										<td className={styles.progressCell}>
											<div className={styles.progressContainer}>
												<div className={styles.progressBar}>
													<div
														className={styles.progressFill}
														style={{ width: `${comp.progress}%` }}
													/>
												</div>
												<span className={styles.progressText}>{Math.round(comp.progress)}%</span>
											</div>
										</td>
									)}
									<td className={styles.materialsCountCell}>
										{isTargetReached ? (
											<span className={styles.completedBadge}>✓ Уровень достигнут</span>
										) : !hasMaterials ? (
											<span className={styles.noMaterialsBadge}>Нет материалов для изучения</span>
										) : (
											<button
												className={styles.materialsBtn}
												onClick={() => handleViewMaterials(comp.id, comp.name)}>
												📚 {comp.materialsCount} {getMaterialsWord(comp.materialsCount)}
											</button>
										)}
										{!isTargetReached && hasMaterials && (
											<div className={styles.materialsHint}>
												Для перехода на уровень {getLevelLabel(comp.targetLevel)}
											</div>
										)}
										{!isTargetReached && !hasMaterials && comp.currentLevel < comp.targetLevel && (
											<div className={styles.materialsHint}>
												Нет материалов для повышения уровня
											</div>
										)}
										{comp.currentLevel >= 3 && (
											<div className={styles.materialsHint}>
												Максимальный уровень достигнут
											</div>
										)}
										</td>
									</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		);
	};

	const renderAllCompetencies = () => {
		const addedIds = getAddedCompetencyIds();
		const availableCompetencies = allCompetencies.filter(comp => !addedIds.has(comp.id));
		
		if (availableCompetencies.length === 0) {
			return <div className={styles.emptyState}>Нет доступных компетенций для добавления</div>;
		}

		return (
			<div className={styles.tableWrapper}>
				<table className={styles.table}>
					<thead>
						<tr>
							<th>Компетенция</th>
							<th>Блок</th>
							<th>Всего материалов</th>
							<th>Описание</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{availableCompetencies.map((comp) => (
							<tr key={comp.id}>
								<td className={styles.competencyName}>{comp.name}
									{comp.type && <span className={styles.typeBadge}>{comp.type}</span>}
								</td>
								<td className={styles.blockCell}>
									<span className={styles.blockBadge}>{comp.hierarchy?.name || 'Без блока'}</span>
								</td>
								<td className={styles.materialsCountCell}>
									<span className={styles.materialsBadge}>
										📚 {comp.materialsCount || 0} {getMaterialsWord(comp.materialsCount || 0)}
									</span>
								</td>
								<td className={styles.descriptionCell}>{comp.description?.slice(0, 100) || '—'}</td>
								<td className={styles.actionsCell}>
									<button
										className={styles.addBtn}
										onClick={() => addCompetencyToMe(comp.id)}
										disabled={addingCompetencyId === comp.id}>
										{addingCompetencyId === comp.id ? 'Добавление...' : '+ Добавить'}
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		);
	};

	const currentLevelCompletedCount = currentLevelCompetencies.filter(c => c.currentLevel >= c.targetLevel).length;
	const currentLevelAverageProgress = currentLevelCompetencies.length > 0
		? Math.round(currentLevelCompetencies.reduce((acc, c) => acc + c.progress, 0) / currentLevelCompetencies.length)
		: 0;

	if (isLoading) {
		return (
			<div className={styles.page}>
				<div className={styles.loading}>Загрузка компетенций...</div>
			</div>
		);
	}

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<h1 className={styles.title}>Мои компетенции</h1>
				{userProfile && (
					<div className={styles.positionInfo}>
						<span className={styles.currentPosition}>📍 {userProfile.currentPosition}</span>
						{userProfile.targetPosition && userProfile.targetPosition !== 'Не указана' && (
							<span className={styles.targetPosition}>🎯 {userProfile.targetPosition}</span>
						)}
					</div>
				)}
			</div>

			<div className={styles.content}>
				{successMessage && <div className={styles.successMessage}>{successMessage}</div>}
				{error && <div className={styles.errorMessage}>{error}</div>}

				<div className={styles.tabs}>
					<button 
						className={`${styles.tab} ${activeTab === 'my' ? styles.active : ''}`} 
						onClick={() => setActiveTab('my')}>
						Мои компетенции
					</button>
					<button 
						className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`} 
						onClick={() => setActiveTab('all')}>
						Все компетенции
					</button>
				</div>

				{activeTab === 'my' ? (
					<>
						{blocks.length > 1 && (
							<div className={styles.filters}>
								<div className={styles.filterGroup}>
									<label>Блок компетенций:</label>
									<select 
										className={styles.filterSelect}
										value={filterByBlock} 
										onChange={(e) => setFilterByBlock(e.target.value)}>
										{blocks.map((block) => (
											<option key={block} value={block}>
												{block === 'all' ? 'Все блоки' : block}
											</option>
										))}
									</select>
								</div>
							</div>
						)}

						{/* Блок 1: Компетенции для текущего уровня */}
						{currentLevelCompetencies.length > 0 && (
							<div className={styles.currentJobSection}>
								<div className={styles.sectionHeader}>
									<span className={styles.sectionIcon}>💼</span>
									<h2 className={styles.sectionTitle}>
										Компетенции для текущего уровня
										{userProfile?.currentPosition && userProfile.currentPosition !== 'Не указана' && (
											<span className={styles.jobTitleBadge}>{userProfile.currentPosition}</span>
										)}
									</h2>
									<div className={styles.statsRow}>
										<span className={styles.statBadge}>✅ {currentLevelCompletedCount}/{currentLevelCompetencies.length}</span>
										<span className={styles.statBadge}>📊 {currentLevelAverageProgress}%</span>
									</div>
								</div>
								{renderCompetencyTable(currentLevelCompetencies, true)}
							</div>
						)}

						{/* Блок 2: Компетенции для следующего уровня */}
						{nextLevelCompetencies.length > 0 && (
							<div className={styles.nextJobSection}>
								<div className={styles.sectionHeader}>
									<span className={styles.sectionIcon}>🎯</span>
									<h2 className={styles.sectionTitle}>
										Компетенции для следующего уровня
										{userProfile?.targetPosition && userProfile.targetPosition !== 'Не указана' && (
											<span className={styles.jobTitleBadge}>{userProfile.targetPosition}</span>
										)}
									</h2>
									<span className={styles.sectionBadge}>{nextLevelCompetencies.length}</span>
								</div>
								{renderCompetencyTable(nextLevelCompetencies, true)}
							</div>
						)}

						{/* Блок 3: Все мои компетенции */}
						{allMyCompetencies.length > 0 && (
							<div className={styles.otherSection}>
								<div className={styles.sectionHeader}>
									<span className={styles.sectionIcon}>📚</span>
									<h2 className={styles.sectionTitle}>Все мои компетенции</h2>
									<span className={styles.sectionBadge}>{allMyCompetencies.length}</span>
								</div>
								{renderCompetencyTable(allMyCompetencies, true)}
							</div>
						)}

						{currentLevelCompetencies.length === 0 && nextLevelCompetencies.length === 0 && allMyCompetencies.length === 0 && (
							<div className={styles.emptyState}>
								<p>У вас нет назначенных компетенций</p>
								<p className={styles.emptyHint}>Перейдите на вкладку "Все компетенции", чтобы добавить их</p>
							</div>
						)}
					</>
				) : (
					renderAllCompetencies()
				)}
			</div>
		</div>
	);
};

export default MyCompetenciesPage;