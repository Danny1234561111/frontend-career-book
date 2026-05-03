// job-hierarchy-manager.tsx

import React, { useState, useEffect } from 'react';
import styles from './job_hierarchy_manager.module.scss';

interface JobTitle {
	id: string;
	name: string;
}

interface JobLevel {
	id: string;
	name: string;
}

interface JobHierarchy {
	id: string;
	jobTitleId: string;
	jobTitle: JobTitle;
	jobLevelId: string;
	jobLevel: JobLevel;
	level: number;
}

interface JobLevelProfLevel {
	id: string;
	jobLevelId: string;
	jobLevelName: string;
	minLevelId: string;
	minLevelName: string;
	competencyId: string;
	competency: {
		id: string;
		name: string;
		description?: string;
	};
}

interface Competency {
	id: string;
	name: string;
	description?: string;
}

interface Level {
	id: string;
	name: string;
	value: number;
}

const JobHierarchyManager: React.FC = () => {
	const accessToken = localStorage.getItem('accessToken');
	
	const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
	const [jobLevels, setJobLevels] = useState<JobLevel[]>([]);
	const [jobHierarchies, setJobHierarchies] = useState<JobHierarchy[]>([]);
	const [jobLevelProfLevels, setJobLevelProfLevels] = useState<JobLevelProfLevel[]>([]);
	const [competencies, setCompetencies] = useState<Competency[]>([]);
	const [levels, setLevels] = useState<Level[]>([]);
	
	// Поиск и фильтры
	const [searchQuery, setSearchQuery] = useState('');
	const [filteredJobTitles, setFilteredJobTitles] = useState<JobTitle[]>([]);
	
	const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
	const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
	const [selectedJobLevel, setSelectedJobLevel] = useState<{ jobLevelId: string; jobLevelName: string; jobTitleName: string } | null>(null);
	const [showAddCompetencyModal, setShowAddCompetencyModal] = useState(false);
	const [showAddJobTitleModal, setShowAddJobTitleModal] = useState(false);
	const [showAddJobLevelModal, setShowAddJobLevelModal] = useState(false);
	const [showAddHierarchyModal, setShowAddHierarchyModal] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	
	const [formData, setFormData] = useState({
		competencyId: '',
		minLevelId: '',
		newJobTitleName: '',
		newJobLevelName: '',
		selectedJobTitleId: '',
		selectedJobLevelId: '',
		hierarchyLevel: 1,
	});

	// Получение должностей
	const fetchJobTitles = async () => {
		try {
			const response = await fetch('http://localhost:5217/api/jobtitles?withDeleted=false', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				setJobTitles(data);
				setFilteredJobTitles(data);
			}
		} catch (error) {
			console.error('Error fetching job titles:', error);
		}
	};

	// Фильтрация должностей по поиску
	useEffect(() => {
		if (!searchQuery.trim()) {
			setFilteredJobTitles(jobTitles);
		} else {
			const filtered = jobTitles.filter(job =>
				job.name.toLowerCase().includes(searchQuery.toLowerCase())
			);
			setFilteredJobTitles(filtered);
		}
	}, [searchQuery, jobTitles]);

	// Остальные функции получения данных
	const fetchJobLevels = async () => {
		try {
			const response = await fetch('http://localhost:5217/api/joblevels?withDeleted=false', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				setJobLevels(data);
			}
		} catch (error) {
			console.error('Error fetching job levels:', error);
		}
	};

	const fetchJobHierarchies = async () => {
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
				setJobHierarchies(data);
			}
		} catch (error) {
			console.error('Error fetching job hierarchies:', error);
		}
	};

	const fetchJobLevelProfLevels = async () => {
		try {
			const response = await fetch('http://localhost:5217/api/job-level-prof-levels?withDeleted=false', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'application/json',
				},
			});

			if (response.ok) {
				const data: JobLevelProfLevel[] = await response.json();
				setJobLevelProfLevels(data);
			}
		} catch (error) {
			console.error('Error fetching job level prof levels:', error);
		}
	};

	const fetchCompetencies = async () => {
		try {
			const response = await fetch('http://localhost:5217/api/competencies', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				const competenciesList: Competency[] = [];
				if (data.blocks && Array.isArray(data.blocks)) {
					for (const block of data.blocks) {
						for (const category of block.categories || []) {
							for (const group of category.groups || []) {
								for (const comp of group.competencies || []) {
									competenciesList.push({
										id: comp.id,
										name: comp.name,
										description: comp.description,
									});
								}
							}
						}
					}
				}
				setCompetencies(competenciesList);
			}
		} catch (error) {
			console.error('Error fetching competencies:', error);
		}
	};

	const fetchLevels = async () => {
		try {
			const response = await fetch('http://localhost:5217/api/levels?withDeleted=false', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				setLevels(data.sort((a: Level, b: Level) => a.value - b.value));
			}
		} catch (error) {
			console.error('Error fetching levels:', error);
		}
	};

	// CRUD операции
	const handleAddJobTitle = async () => {
		if (!formData.newJobTitleName.trim()) {
			setError('Введите название должности');
			return;
		}

		try {
			const response = await fetch('http://localhost:5217/api/jobtitles', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ name: formData.newJobTitleName }),
			});

			if (response.ok) {
				setSuccessMessage('Должность успешно добавлена');
				await refreshData();
				setShowAddJobTitleModal(false);
				setFormData({ ...formData, newJobTitleName: '' });
				setTimeout(() => setSuccessMessage(null), 3000);
			} else {
				setError('Ошибка при добавлении должности');
				setTimeout(() => setError(null), 3000);
			}
		} catch (error) {
			console.error('Error adding job title:', error);
			setError('Ошибка при добавлении должности');
			setTimeout(() => setError(null), 3000);
		}
	};

	const handleAddJobLevel = async () => {
		if (!formData.newJobLevelName.trim()) {
			setError('Введите название уровня');
			return;
		}

		try {
			const response = await fetch('http://localhost:5217/api/joblevels', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ name: formData.newJobLevelName }),
			});

			if (response.ok) {
				setSuccessMessage('Уровень должности успешно добавлен');
				await refreshData();
				setShowAddJobLevelModal(false);
				setFormData({ ...formData, newJobLevelName: '' });
				setTimeout(() => setSuccessMessage(null), 3000);
			} else {
				setError('Ошибка при добавлении уровня');
				setTimeout(() => setError(null), 3000);
			}
		} catch (error) {
			console.error('Error adding job level:', error);
			setError('Ошибка при добавлении уровня');
			setTimeout(() => setError(null), 3000);
		}
	};

	const handleAddHierarchy = async () => {
		if (!formData.selectedJobTitleId || !formData.selectedJobLevelId) {
			setError('Выберите должность и уровень');
			return;
		}

		try {
			const response = await fetch('http://localhost:5217/api/jobhierarchies', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					jobTitleId: formData.selectedJobTitleId,
					jobLevelId: formData.selectedJobLevelId,
					level: formData.hierarchyLevel,
				}),
			});

			if (response.ok) {
				setSuccessMessage('Связь успешно добавлена');
				await refreshData();
				setShowAddHierarchyModal(false);
				setFormData({ ...formData, selectedJobTitleId: '', selectedJobLevelId: '', hierarchyLevel: 1 });
				setTimeout(() => setSuccessMessage(null), 3000);
			} else {
				setError('Ошибка при добавлении связи');
				setTimeout(() => setError(null), 3000);
			}
		} catch (error) {
			console.error('Error adding hierarchy:', error);
			setError('Ошибка при добавлении связи');
			setTimeout(() => setError(null), 3000);
		}
	};

	const handleAddCompetencyToJobLevel = async () => {
		if (!selectedJobLevel || !formData.competencyId || !formData.minLevelId) {
			setError('Заполните все поля');
			return;
		}

		const existing = jobLevelProfLevels.find(
			item => item.jobLevelId === selectedJobLevel.jobLevelId && item.competencyId === formData.competencyId
		);

		if (existing) {
			setError('Эта компетенция уже добавлена к данному уровню');
			setTimeout(() => setError(null), 3000);
			return;
		}

		setIsSaving(true);

		try {
			const response = await fetch('http://localhost:5217/api/job-level-prof-levels', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					jobLevelId: selectedJobLevel.jobLevelId,
					minLevelId: formData.minLevelId,
					competencyId: formData.competencyId,
				}),
			});

			if (response.ok) {
				setSuccessMessage('Компетенция добавлена');
				await refreshData();
				setShowAddCompetencyModal(false);
				setSelectedJobLevel(null);
				setFormData({ ...formData, competencyId: '', minLevelId: '' });
				setTimeout(() => setSuccessMessage(null), 3000);
			} else {
				setError('Ошибка при добавлении компетенции');
				setTimeout(() => setError(null), 3000);
			}
		} catch (error) {
			console.error('Error adding competency:', error);
			setError('Ошибка при добавлении компетенции');
			setTimeout(() => setError(null), 3000);
		} finally {
			setIsSaving(false);
		}
	};

	const handleRemoveCompetency = async (linkId: string, competencyName: string) => {
		if (!confirm(`Удалить компетенцию "${competencyName}"?`)) return;

		try {
			const response = await fetch(`http://localhost:5217/api/job-level-prof-levels/${linkId}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
				},
			});

			if (response.ok) {
				setSuccessMessage('Компетенция удалена');
				await refreshData();
				setTimeout(() => setSuccessMessage(null), 3000);
			} else {
				setError('Ошибка при удалении компетенции');
				setTimeout(() => setError(null), 3000);
			}
		} catch (error) {
			console.error('Error removing competency:', error);
			setError('Ошибка при удалении компетенции');
			setTimeout(() => setError(null), 3000);
		}
	};

	const refreshData = async () => {
		await Promise.all([
			fetchJobTitles(),
			fetchJobLevels(),
			fetchJobHierarchies(),
			fetchJobLevelProfLevels(),
			fetchCompetencies(),
			fetchLevels(),
		]);
	};

	const toggleJobExpand = (jobTitleId: string) => {
		const newSet = new Set(expandedJobs);
		if (newSet.has(jobTitleId)) {
			newSet.delete(jobTitleId);
		} else {
			newSet.add(jobTitleId);
		}
		setExpandedJobs(newSet);
	};

	const toggleLevelExpand = (levelId: string) => {
		const newSet = new Set(expandedLevels);
		if (newSet.has(levelId)) {
			newSet.delete(levelId);
		} else {
			newSet.add(levelId);
		}
		setExpandedLevels(newSet);
	};

	const getCompetenciesForJobLevel = (jobLevelId: string): JobLevelProfLevel[] => {
		return jobLevelProfLevels.filter(item => item.jobLevelId === jobLevelId);
	};

	const getAvailableCompetencies = (jobLevelId: string): Competency[] => {
		const existingIds = new Set(
			jobLevelProfLevels.filter(item => item.jobLevelId === jobLevelId).map(item => item.competencyId)
		);
		return competencies.filter(comp => !existingIds.has(comp.id));
	};

	const getHierarchyForJob = (jobTitleId: string): JobHierarchy[] => {
		return jobHierarchies.filter(item => item.jobTitleId === jobTitleId).sort((a, b) => a.level - b.level);
	};

	const getLevelName = (levelId: string): string => {
		const level = jobLevels.find(l => l.id === levelId);
		return level?.name || 'Неизвестный уровень';
	};

	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true);
			await refreshData();
			setIsLoading(false);
		};
		loadData();
	}, []);

	if (isLoading) {
		return (
			<div className={styles.container}>
				<div className={styles.loading}>Загрузка иерархии должностей...</div>
			</div>
		);
	}

	return (
		<div className={styles.container}>
			{successMessage && (
				<div className={styles.successMessage}>{successMessage}</div>
			)}
			{error && (
				<div className={styles.errorMessage}>{error}</div>
			)}

			<div className={styles.header}>
				<h3></h3>
				<div className={styles.headerButtons}>
					<button className={styles.addBtn} onClick={() => setShowAddJobTitleModal(true)}>
						+ Должность
					</button>
					<button className={styles.addLevelBtn} onClick={() => setShowAddJobLevelModal(true)}>
						+ Уровень
					</button>
					<button className={styles.addHierarchyBtn} onClick={() => setShowAddHierarchyModal(true)}>
						+ Связать
					</button>
				</div>
			</div>

			{/* Поиск должностей */}
			<div className={styles.searchBar}>
				<div className={styles.searchWrapper}>
					<span className={styles.searchIcon}>🔍</span>
					<input
						type="text"
						placeholder="Поиск по названию должности..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className={styles.searchInput}
					/>
					{searchQuery && (
						<button 
							className={styles.clearSearchBtn}
							onClick={() => setSearchQuery('')}>
							✕
						</button>
					)}
				</div>
				<div className={styles.searchStats}>
					Найдено должностей: <strong>{filteredJobTitles.length}</strong>
				</div>
			</div>

			<div className={styles.hierarchyContainer}>
				{filteredJobTitles.length === 0 ? (
					<div className={styles.emptyState}>
						<p>Должности не найдены</p>
						<small>Попробуйте изменить поисковый запрос</small>
					</div>
				) : (
					filteredJobTitles.map(job => {
						const isJobExpanded = expandedJobs.has(job.id);
						const hierarchies = getHierarchyForJob(job.id);
						
						return (
							<div key={job.id} className={styles.jobGroup}>
								<div 
									className={styles.jobHeader}
									onClick={() => toggleJobExpand(job.id)}>
									<div className={styles.jobTitle}>
										<span className={styles.expandIcon}>{isJobExpanded ? '▼' : '▶'}</span>
										<span className={styles.jobName}>{job.name}</span>
										<span className={styles.badge}>📊 {hierarchies.length} уровней</span>
									</div>
								</div>
								
								{isJobExpanded && (
									<div className={styles.levelsContainer}>
										{hierarchies.length === 0 ? (
											<div className={styles.emptyLevels}>
												<p>Нет связанных уровней</p>
												<small>Нажмите "+ Связать" чтобы добавить уровень</small>
											</div>
										) : (
											hierarchies.map(hierarchy => {
												const isLevelExpanded = expandedLevels.has(hierarchy.id);
												const competenciesForLevel = getCompetenciesForJobLevel(hierarchy.jobLevelId);
												const availableCompetencies = getAvailableCompetencies(hierarchy.jobLevelId);
												
												return (
													<div key={hierarchy.id} className={styles.levelNode}>
														<div 
															className={styles.levelHeader}
															onClick={() => toggleLevelExpand(hierarchy.id)}>
															<div className={styles.levelTitle}>
																<span className={styles.expandIcon}>
																	{isLevelExpanded ? '▼' : '▶'}
																</span>
																<span className={styles.levelName}>
																	{getLevelName(hierarchy.jobLevelId)}
																</span>
																<span className={styles.levelBadge}>
																	Уровень {hierarchy.level}
																</span>
																<span className={styles.competencyCount}>
																	📚 {competenciesForLevel.length} компетенций
																</span>
															</div>
															<div className={styles.levelActions}>
																{availableCompetencies.length > 0 && (
																	<button
																		className={styles.addCompetencyToLevelBtn}
																		onClick={(e) => {
																			e.stopPropagation();
																			setSelectedJobLevel({
																				jobLevelId: hierarchy.jobLevelId,
																				jobLevelName: getLevelName(hierarchy.jobLevelId),
																				jobTitleName: job.name,
																			});
																			setShowAddCompetencyModal(true);
																		}}>
																		+ Компетенция
																	</button>
																)}
															</div>
														</div>
														
														{isLevelExpanded && competenciesForLevel.length > 0 && (
															<div className={styles.competenciesContainer}>
																{competenciesForLevel.map(comp => (
																	<div key={comp.id} className={styles.competencyCard}>
																		<div className={styles.competencyHeader}>
																			<span className={styles.competencyName}>
																				{comp.competency.name}
																			</span>
																			<span className={styles.requiredLevel}>
																				Уровень: {comp.minLevelName}
																			</span>
																			<button
																				className={styles.removeBtn}
																				onClick={() => handleRemoveCompetency(comp.id, comp.competency.name)}>
																				🗑️
																			</button>
																		</div>
																		{comp.competency.description && (
																			<div className={styles.competencyDesc}>
																				{comp.competency.description}
																			</div>
																		)}
																	</div>
																))}
															</div>
														)}
													</div>
												);
											})
										)}
									</div>
								)}
							</div>
						);
					})
				)}
			</div>

			{/* Модальные окна (остаются без изменений) */}
			{showAddJobTitleModal && (
				<div className={styles.modal} onClick={() => setShowAddJobTitleModal(false)}>
					<div className={styles.modalContent} onClick={e => e.stopPropagation()}>
						<h3>Добавить должность</h3>
						<div className={styles.formGroup}>
							<label>Название должности</label>
							<input
								type="text"
								value={formData.newJobTitleName}
								onChange={e => setFormData({ ...formData, newJobTitleName: e.target.value })}
								placeholder="Например: Разработчик"
								autoFocus
							/>
						</div>
						<div className={styles.modalActions}>
							<button onClick={() => setShowAddJobTitleModal(false)}>Отмена</button>
							<button onClick={handleAddJobTitle}>Добавить</button>
						</div>
					</div>
				</div>
			)}

			{showAddJobLevelModal && (
				<div className={styles.modal} onClick={() => setShowAddJobLevelModal(false)}>
					<div className={styles.modalContent} onClick={e => e.stopPropagation()}>
						<h3>Добавить уровень должности</h3>
						<div className={styles.formGroup}>
							<label>Название уровня</label>
							<input
								type="text"
								value={formData.newJobLevelName}
								onChange={e => setFormData({ ...formData, newJobLevelName: e.target.value })}
								placeholder="Например: Специалист 1 категории"
								autoFocus
							/>
						</div>
						<div className={styles.modalActions}>
							<button onClick={() => setShowAddJobLevelModal(false)}>Отмена</button>
							<button onClick={handleAddJobLevel}>Добавить</button>
						</div>
					</div>
				</div>
			)}

			{showAddHierarchyModal && (
				<div className={styles.modal} onClick={() => setShowAddHierarchyModal(false)}>
					<div className={styles.modalContent} onClick={e => e.stopPropagation()}>
						<h3>Связать должность с уровнем</h3>
						<div className={styles.formGroup}>
							<label>Должность</label>
							<select
								value={formData.selectedJobTitleId}
								onChange={e => setFormData({ ...formData, selectedJobTitleId: e.target.value })}>
								<option value="">Выберите должность</option>
								{jobTitles.map(job => (
									<option key={job.id} value={job.id}>{job.name}</option>
								))}
							</select>
						</div>
						<div className={styles.formGroup}>
							<label>Уровень</label>
							<select
								value={formData.selectedJobLevelId}
								onChange={e => setFormData({ ...formData, selectedJobLevelId: e.target.value })}>
								<option value="">Выберите уровень</option>
								{jobLevels.map(level => (
									<option key={level.id} value={level.id}>{level.name}</option>
								))}
							</select>
						</div>
						<div className={styles.formGroup}>
							<label>Порядковый номер</label>
							<input
								type="number"
								min="1"
								value={formData.hierarchyLevel}
								onChange={e => setFormData({ ...formData, hierarchyLevel: parseInt(e.target.value) || 1 })}
							/>
						</div>
						<div className={styles.modalActions}>
							<button onClick={() => setShowAddHierarchyModal(false)}>Отмена</button>
							<button onClick={handleAddHierarchy}>Добавить</button>
						</div>
					</div>
				</div>
			)}

			{showAddCompetencyModal && selectedJobLevel && (
				<div className={styles.modal} onClick={() => setShowAddCompetencyModal(false)}>
					<div className={styles.modalContent} onClick={e => e.stopPropagation()}>
						<h3>Добавить компетенцию</h3>
						<p className={styles.modalSubtitle}>
							<strong>{selectedJobLevel.jobTitleName}</strong> → <strong>{selectedJobLevel.jobLevelName}</strong>
						</p>
						<div className={styles.formGroup}>
							<label>Компетенция</label>
							<select
								value={formData.competencyId}
								onChange={e => setFormData({ ...formData, competencyId: e.target.value })}>
								<option value="">Выберите компетенцию</option>
								{getAvailableCompetencies(selectedJobLevel.jobLevelId).map(comp => (
									<option key={comp.id} value={comp.id}>{comp.name}</option>
								))}
							</select>
						</div>
						<div className={styles.formGroup}>
							<label>Требуемый уровень владения</label>
							<select
								value={formData.minLevelId}
								onChange={e => setFormData({ ...formData, minLevelId: e.target.value })}>
								<option value="">Выберите уровень</option>
								{levels.map(level => (
									<option key={level.id} value={level.id}>{level.name}</option>
								))}
							</select>
						</div>
						<div className={styles.modalActions}>
							<button onClick={() => setShowAddCompetencyModal(false)}>Отмена</button>
							<button onClick={handleAddCompetencyToJobLevel} disabled={isSaving}>
								{isSaving ? 'Добавление...' : 'Добавить'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default JobHierarchyManager;