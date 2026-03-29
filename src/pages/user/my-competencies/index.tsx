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
}

interface BlockData {
	id: string;
	name: string;
	categories: CategoryData[];
}

interface CategoryData {
	id: string;
	name: string;
	groups: GroupData[];
}

interface GroupData {
	id: string;
	name: string;
	competencies: CompetencyFromApi[];
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
					data.blocks.forEach((block: BlockData) => {
						blockNames.add(block.name);
						block.categories?.forEach((category: CategoryData) => {
							category.groups?.forEach((group: GroupData) => {
								group.competencies?.forEach((comp: CompetencyFromApi) => {
									transformedCompetencies.push({
										id: comp.id,
										name: comp.name,
										block: block.name,
										currentLevel: comp.currentLevel || 0,
										targetLevel: comp.requiredLevel || 0,
										progress: comp.progress?.percent || 0,
										materialsCount: comp.progress?.totalRequiredMaterials || 0,
									});
								});
							});
						});
					});
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
					data.blocks.forEach((block: any) => {
						block.categories?.forEach((category: any) => {
							category.groups?.forEach((group: any) => {
								group.competencies?.forEach((comp: any) => {
									transformedCompetencies.push({
										id: comp.id,
										name: comp.name,
										block: block.name,
										currentLevel: comp.currentLevel || 0,
										targetLevel: comp.requiredLevel || 0,
										progress: comp.progress?.percent || 0,
										materialsCount: comp.progress?.totalRequiredMaterials || 0,
									});
								});
							});
						});
					});
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
					data.blocks.forEach((block: any) => {
						block.categories?.forEach((category: any) => {
							category.groups?.forEach((group: any) => {
								group.competencies?.forEach((comp: any) => {
									allComps.push({
										id: comp.id,
										name: comp.name,
										type: comp.type,
										hierarchyId: block.id,
										hierarchy: { id: block.id, name: block.name },
										description: comp.description,
										proficiencyLevels: comp.proficiencyLevels,
									});
								});
							});
						});
					});
				}
				setAllCompetencies(allComps);
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
				body: JSON.stringify({ competencyId }),
			});

			if (response.ok || response.status === 204) {
				setSuccessMessage('Компетенция успешно добавлена');
				await fetchMyCompetencies();
				await fetchNextLevelCompetencies();
				setTimeout(() => setSuccessMessage(null), 3000);
			} else {
				setError('Не удалось добавить компетенцию');
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
		
		if (filteredList.length === 0) return null;
		
		return (
			<div className={styles.tableWrapper}>
				<table className={styles.table}>
					<thead>
							<th>Компетенция</th>
							<th>Блок</th>
							<th>Текущий уровень</th>
							<th>Целевой уровень</th>
							{showProgress && <th>Прогресс</th>}
							<th>Действия</th>
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
											📚 {comp.materialsCount} материалов
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
							<th>Компетенция</th>
							<th>Блок</th>
							<th>Описание</th>
							<th>Действия</th>
						</thead>
						<tbody>
							{availableCompetencies.map((comp) => (
								<tr key={comp.id}>
									<td className={styles.competencyName}>{comp.name}</td>
									<td className={styles.blockCell}>
										<span className={styles.blockBadge}>{comp.hierarchy?.name || 'Без блока'}</span>
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
					<button className={`${styles.tab} ${activeTab === 'my' ? styles.active : ''}`} onClick={() => setActiveTab('my')}>
						Мои компетенции
					</button>
					<button className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`} onClick={() => setActiveTab('all')}>
						Все компетенции
					</button>
				</div>

				{activeTab === 'my' ? (
					<>
						{blocks.length > 1 && (
							<div className={styles.filters}>
								<div className={styles.filterGroup}>
									<label>Блок компетенций:</label>
									<select value={filterByBlock} onChange={(e) => setFilterByBlock(e.target.value)}>
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
								<div className={styles.requiredHeader}>
									<span className={styles.requiredIcon}>🎯</span>
									<h2 className={styles.requiredTitle}>Компетенции для следующей должности</h2>
									<span className={styles.requiredBadge}>{nextLevelCompetencies.length}</span>
								</div>
								{renderCompetencyTable(nextLevelCompetencies, true)}
							</div>
						)}

						{competencies.length > 0 && (
							<div className={styles.otherSection}>
								<div className={styles.otherHeader}>
									<span className={styles.otherIcon}>📚</span>
									<h2 className={styles.otherTitle}>Все мои компетенции</h2>
									<span className={styles.otherBadge}>{competencies.length}</span>
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