import React, { useState } from 'react';
import styles from './competencies-matrix.module.scss';

interface Competency {
	id: string;
	name: string;
	type: string;
	hierarchyId: string;
	hierarchy?: { id: string; name: string };
	description: string;
	text?: string;
	defenseTasks?: string;
	admissionCriteria?: string;
	proficiencyLevels?: Array<{ value: number; name: string; description?: string }>;
}

interface CompetenciesMatrixProps {
	editable?: boolean;
	onCompetencyUpdate?: (competencyId: string, level: number) => void;
	onEdit?: (competency: Competency) => void;
	onDelete?: (competencyId: string) => void;
	onViewDetails?: (competency: Competency) => void;
	userId?: string;
	competencies?: Competency[];
	competencyBlocks?: { id: string; name: string }[];
}

const CompetenciesMatrix: React.FC<CompetenciesMatrixProps> = ({
	editable = false,
	onEdit,
	onDelete,
	onViewDetails,
	competencies = [],
	competencyBlocks = [],
}) => {
	const [selectedBlock, setSelectedBlock] = useState<string>('all');
	const [expandedCompetency, setExpandedCompetency] = useState<string | null>(null);

	// Получаем уникальные блоки из переданных данных
	const blocks = ['all', ...competencyBlocks.map(b => b.name)];

	const getLevelLabel = (level: number): string => {
		const labels = ['Нет', 'Базовые знания', 'Профессионал', 'Эксперт'];
		return labels[level] || 'Нет';
	};

	const getLevelClass = (level: number): string => {
		const classes = ['', styles.level1, styles.level2, styles.level3];
		return classes[level] || '';
	};

	const getCompetencyLevels = (comp: Competency) => {
		const levels: { [key: number]: string } = {};
		if (comp.proficiencyLevels) {
			comp.proficiencyLevels.forEach(level => {
				levels[level.value] = level.description || '';
			});
		}
		return levels;
	};

	const filteredCompetencies = competencies.filter(
		(c) => selectedBlock === 'all' || c.hierarchy?.name === selectedBlock
	);

	const handleRowClick = (competency: Competency) => {
		if (expandedCompetency === competency.id) {
			setExpandedCompetency(null);
		} else {
			setExpandedCompetency(competency.id);
		}
		onViewDetails?.(competency);
	};

	const levels = getCompetencyLevels(filteredCompetencies[0] || {} as Competency);

	return (
		<div className={styles.matrix}>
			<div className={styles.header}>
				<h3>Матрица компетенций</h3>
				<div className={styles.filter}>
					<label>Блок компетенций:</label>
					<select
						value={selectedBlock}
						onChange={(e) => setSelectedBlock(e.target.value)}
						className={styles.blockSelect}>
						{blocks.map((block) => (
							<option key={block} value={block}>
								{block === 'all' ? 'Все блоки' : block}
							</option>
						))}
					</select>
				</div>
			</div>

			<div className={styles.table}>
				<div className={`${styles.row} ${styles.headerRow}`}>
					<div className={styles.cell}>Компетенция</div>
					<div className={styles.cell}>Блок</div>
					<div className={styles.cell}>Описание</div>
					{editable && <div className={styles.cell}>Действия</div>}
				</div>

				{filteredCompetencies.map((comp) => {
					const isExpanded = expandedCompetency === comp.id;
					const compLevels = getCompetencyLevels(comp);

					return (
						<React.Fragment key={comp.id}>
							<div
								className={`${styles.row} ${styles.dataRow} ${
									isExpanded ? styles.expanded : ''
								}`}
								onClick={() => handleRowClick(comp)}>
								<div className={styles.cell}>
									<span className={styles.competencyName}>{comp.name}</span>
								</div>
								<div className={styles.cell}>
									<span className={styles.blockBadge}>
										{comp.hierarchy?.name || 'Без блока'}
									</span>
								</div>
								<div className={styles.cell}>
									<div className={styles.description}>
										{comp.description?.slice(0, 100) || 'Нет описания'}
										{comp.description?.length > 100 ? '...' : ''}
									</div>
								</div>
								{editable && (
									<div className={styles.cell}>
										<div className={styles.actions}>
											<button
												className={styles.editBtn}
												onClick={(e) => {
													e.stopPropagation();
													onEdit?.(comp);
												}}
												title='Редактировать'>
												✏️
											</button>
											<button
												className={styles.deleteBtn}
												onClick={(e) => {
													e.stopPropagation();
													onDelete?.(comp.id);
												}}
												title='Удалить'>
												🗑️
											</button>
										</div>
									</div>
								)}
							</div>

							{isExpanded && (
								<div className={styles.expandedDetails}>
									<div className={styles.detailsGrid}>
										<div className={styles.detailSection}>
											<h5>Полное описание</h5>
											<p>{comp.description || 'Нет описания'}</p>
										</div>

										{Object.keys(compLevels).length > 0 && (
											<div className={styles.detailSection}>
												<h5>Уровни владения</h5>
												<div className={styles.levelsList}>
													{[1, 2, 3].map(level => {
														if (compLevels[level]) {
															return (
																<div key={level} className={styles.levelItem}>
																	<span className={`${styles.levelTag} ${getLevelClass(level)}`}>
																		Уровень {level} - {getLevelLabel(level)}
																	</span>
																	<p>{compLevels[level]}</p>
																</div>
															);
														}
														return null;
													})}
												</div>
											</div>
										)}

										{comp.defenseTasks && (
											<div className={styles.detailSection}>
												<h5>Задания для защиты</h5>
												<p>{comp.defenseTasks}</p>
											</div>
										)}

										{comp.admissionCriteria && (
											<div className={styles.detailSection}>
												<h5>Критерии приема</h5>
												<p>{comp.admissionCriteria}</p>
											</div>
										)}

										{comp.text && (
											<div className={styles.detailSection}>
												<h5>Теоретический материал</h5>
												<p>{comp.text}</p>
											</div>
										)}
									</div>
								</div>
							)}
						</React.Fragment>
					);
				})}
			</div>

			<div className={styles.legend}>
				<span className={styles.legendTitle}>Уровни владения:</span>
				<div className={styles.legendItem}>
					<span className={`${styles.legendColor} ${styles.level1}`}></span>
					<span>1 - Базовые знания</span>
				</div>
				<div className={styles.legendItem}>
					<span className={`${styles.legendColor} ${styles.level2}`}></span>
					<span>2 - Профессионал</span>
				</div>
				<div className={styles.legendItem}>
					<span className={`${styles.legendColor} ${styles.level3}`}></span>
					<span>3 - Эксперт</span>
				</div>
			</div>
		</div>
	);
};

export default CompetenciesMatrix;