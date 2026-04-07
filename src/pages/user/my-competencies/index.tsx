// my-competencies.module.tsx (ИСПРАВЛЕННАЯ)

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
	progress: number;
	materialsCount: number;
}

interface CompetencyFromApi {
	id: string;
	name: string;
	currentLevel: number;
	requiredLevel: number;
	progress: {
		percent: number;
		completedMaterials: number;
		totalRequiredMaterials: number;
	};
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

const MyCompetenciesPage = () => {
	const navigate = useNavigate();
	const user = useAppSelector((state) => state.auth.user);
	const accessToken = localStorage.getItem('accessToken');
	
	const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');
	const [filterByBlock, setFilterByBlock] = useState<string>('all');
	const [competencies, setCompetencies] = useState<Competency[]>([]);
	const [nextLevelCompetencies, setNextLevelCompetencies] = useState<Competency[]>([]);
	const [allCompetencies, setAllCompetencies] = useState<CompetencyFull[]>([]);
	const [blocks, setBlocks] = useState<string[]>(['all']);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [addingCompetencyId, setAddingCompetencyId] = useState<string | null>(null);

	// Получение количества материалов в компетенции
	const fetchMaterialsCountForCompetency = async (competencyId: string): Promise<number> => {
		try {
			const token = localStorage.getItem('accessToken');
			if (!token) return 0;

			const response = await fetch(`http://localhost:5217/api/educational-material-competencies/by-competency/${competencyId}`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'accept': 'text/plain',
				},
			});

			if (response.ok) {
				const data: EducationalMaterialCompetency[] = await response.json();
				return data.length;
			}
			return 0;
		} catch (error) {
			console.error(`Error fetching materials count for competency ${competencyId}:`, error);
			return 0;
		}
	};

	// Получение количества материалов для всех компетенций
	const fetchMaterialsCountsForCompetencies = async (competenciesList: CompetencyFull[]) => {
		const competenciesWithCounts = await Promise.all(
			competenciesList.map(async (comp) => {
				const count = await fetchMaterialsCountForCompetency(comp.id);
				return { ...comp, materialsCount: count };
			})
		);
		return competenciesWithCounts;
	};

	const fetchMyCompetencies = async () => {
		try {
			const token = localStorage.getItem('accessToken');
			if (!token) {
				setError('Нет токена доступа');
				setIsLoading(false);
				return;
			}

			const response = await fetch('http://localhost:5217/api/competencies/own', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'accept': 'text/plain',
				},
			});

			if (response.ok) {
				const data = await response.json();
				const transformedCompetencies: Competency[] = [];
				const blockNames: Set<string> = new Set();
				
				if (data.blocks && Array.isArray(data.blocks)) {
					for (const block of data.blocks) {
						blockNames.add(block.name);
						for (const category of block.categories || []) {
							for (const group of category.groups || []) {
								for (const comp of group.competencies || []) {
									// Получаем реальное количество материалов в компетенции
									const materialsCount = await fetchMaterialsCountForCompetency(comp.id);
									
									transformedCompetencies.push({
										id: comp.id,
										name: comp.name,
										block: block.name,
										currentLevel: comp.currentLevel || 0,
										targetLevel: comp.requiredLevel || 0,
										progress: comp.progress?.percent || 0,
										materialsCount: materialsCount,
									});
								}
							}
						}
					}
				}
				setCompetencies(transformedCompetencies);
				setBlocks(['all', ...Array.from(blockNames)]);
			} else if (response.status === 401) {
				setError('Сессия истекла. Обновите страницу.');
			}
		} catch (error) {
			console.error('Error fetching competencies:', error);
			setError('Не удалось подключиться к серверу');
		}
	};

	const fetchNextLevelCompetencies = async () => {
		try {
			const token = localStorage.getItem('accessToken');
			if (!token) return;

			const response = await fetch('http://localhost:5217/api/competencies/own/next-level', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'accept': 'text/plain',
				},
			});

			if (response.ok) {
				const data = await response.json();
				const transformedCompetencies: Competency[] = [];
				
				if (data.blocks && Array.isArray(data.blocks)) {
					for (const block of data.blocks) {
						for (const category of block.categories || []) {
							for (const group of category.groups || []) {
								for (const comp of group.competencies || []) {
									const materialsCount = await fetchMaterialsCountForCompetency(comp.id);
									
									transformedCompetencies.push({
										id: comp.id,
										name: comp.name,
										block: block.name,
										currentLevel: comp.currentLevel || 0,
										targetLevel: comp.requiredLevel || 0,
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

	const fetchAllCompetencies = async () => {
		try {
			const token = localStorage.getItem('accessToken');
			if (!token) return;

			const response = await fetch('http://localhost:5217/api/competencies', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'accept': 'text/plain',
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
				
				// Получаем количество материалов для всех компетенций
				const competenciesWithCounts = await fetchMaterialsCountsForCompetencies(allComps);
				setAllCompetencies(competenciesWithCounts);
			}
		} catch (error) {
			console.error('Error fetching all competencies:', error);
		}
	};

	// ИСПРАВЛЕННАЯ функция добавления компетенции
	const addCompetencyToMe = async (competencyId: string) => {
		try {
			setAddingCompetencyId(competencyId);
			const token = localStorage.getItem('accessToken');
			if (!token) {
				setError('Нет токена доступа');
				return;
			}

			// Используем правильный эндпоинт для добавления компетенции текущему пользователю
			const response = await fetch('http://localhost:5217/api/competency-task', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ competencyId: competencyId }),
			});

			console.log('Add competency response:', response.status);

			if (response.ok || response.status === 204 || response.status === 201) {
				setSuccessMessage('Компетенция успешно добавлена');
				// Обновляем списки
				await fetchMyCompetencies();
				await fetchNextLevelCompetencies();
				await fetchAllCompetencies();
				setTimeout(() => setSuccessMessage(null), 3000);
			} else {
				const errorText = await response.text();
				console.error('Add competency error:', response.status, errorText);
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
		return new Set(competencies.map(c => c.id));
	};

	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true);
			await Promise.all([
				fetchMyCompetencies(),
				fetchNextLevelCompetencies(),
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
			2: 'Профессионал',
			3: 'Эксперт',
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
							<th>Действия</th>
						</tr>
					</thead>
					<tbody>
						{filteredList.map((comp) => (
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
										{getLevelLabel(comp.targetLevel)}
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
											<span className={styles.progressText}>{comp.progress}%</span>
										</div>
									</td>
								)}
								<td className={styles.actionsCell}>
									<button
										className={styles.materialsBtn}
										onClick={() => handleViewMaterials(comp.id, comp.name)}>
										📚 {comp.materialsCount} материал{comp.materialsCount !== 1 ? 'ов' : ''}
									</button>
								</td>
							</tr>
						))}
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
							<th>Материалов</th>
							<th>Описание</th>
							<th>Действия</th>
						</tr>
					</thead>
					<tbody>
						{availableCompetencies.map((comp) => (
							<tr key={comp.id}>
								<td className={styles.competencyName}>{comp.name}</td>
								<td className={styles.blockCell}>
									<span className={styles.blockBadge}>{comp.hierarchy?.name || 'Без блока'}</span>
								</td>
								<td className={styles.materialsCountCell}>
									<span className={styles.materialsBadge}>📚 {comp.materialsCount || 0}</span>
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

	const completedCount = competencies.filter(c => c.currentLevel >= c.targetLevel).length;
	const averageProgress = competencies.length > 0
		? Math.round(competencies.reduce((acc, c) => acc + c.progress, 0) / competencies.length)
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

						{competencies.length > 0 && (
							<div className={styles.userStats}>
								<div className={styles.statItem}>
									<span className={styles.statValue}>{completedCount}</span>
									<span className={styles.statLabel}>Выполнено</span>
								</div>
								<div className={styles.statItem}>
									<span className={styles.statValue}>{competencies.length}</span>
									<span className={styles.statLabel}>Всего</span>
								</div>
								<div className={styles.statItem}>
									<span className={styles.statValue}>{averageProgress}%</span>
									<span className={styles.statLabel}>Общий прогресс</span>
								</div>
							</div>
						)}

						{nextLevelCompetencies.length > 0 && (
							<div className={styles.requiredSection}>
								<div className={styles.sectionHeader}>
									<span className={styles.sectionIcon}>🎯</span>
									<h2 className={styles.sectionTitle}>Компетенции для следующей должности</h2>
									<span className={styles.sectionBadge}>{nextLevelCompetencies.length}</span>
								</div>
								{renderCompetencyTable(nextLevelCompetencies, true)}
							</div>
						)}

						{competencies.length > 0 && (
							<div className={styles.otherSection}>
								<div className={styles.sectionHeader}>
									<span className={styles.sectionIcon}>📚</span>
									<h2 className={styles.sectionTitle}>Все мои компетенции</h2>
									<span className={styles.sectionBadge}>{competencies.length}</span>
								</div>
								{renderCompetencyTable(competencies, true)}
							</div>
						)}

						{competencies.length === 0 && (
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