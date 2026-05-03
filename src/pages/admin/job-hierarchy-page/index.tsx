// job-hierarchy.page.tsx

import React, { useState, useEffect } from 'react';
import { JobHierarchyManager } from '../../../component';
import styles from './job-hierarchy.module.scss';

const JobHierarchyPage: React.FC = () => {
	const accessToken = localStorage.getItem('accessToken');
	
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true);
			// Здесь можно добавить предзагрузку данных если нужно
			setIsLoading(false);
		};
		loadData();
	}, []);

	if (isLoading) {
		return (
			<div className={styles.page}>
				<div className={styles.loading}>Загрузка...</div>
			</div>
		);
	}

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<h1 className={styles.title}>Иерархия должностей</h1>
			</div>

			<div className={styles.content}>
				{successMessage && (
					<div className={styles.successMessage}>{successMessage}</div>
				)}
				{error && (
					<div className={styles.errorMessage}>{error}</div>
				)}

				<JobHierarchyManager />
			</div>
		</div>
	);
};

export default JobHierarchyPage;