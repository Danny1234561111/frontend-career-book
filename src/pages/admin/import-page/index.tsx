import React, { useState, useEffect } from 'react';
import styles from './import-excel.module.scss';

interface PreviewData {
	table: string[][];
	numberDataRows: number;
	numberIgnoreRows: number;
	numberCompetencies: number;
}

interface EmployeePreviewData {
	profiles: PreviewData;
	model: PreviewData;
}

const ImportPage: React.FC = () => {
	const accessToken = localStorage.getItem('accessToken');
	
	const [activeTab, setActiveTab] = useState<'bosses' | 'employees'>('bosses');
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [preview, setPreview] = useState<PreviewData | EmployeePreviewData | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	// Получение превью для руководителей
	const fetchBossesPreview = async (file: File) => {
		const formData = new FormData();
		formData.append('File', file);

		console.log('Sending request to: http://localhost:5217/api/import-excel/bosses/preview');
		
		const response = await fetch('http://localhost:5217/api/import-excel/bosses/preview', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
			},
			body: formData,
		});

		console.log('Response status:', response.status);
		
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Ошибка ${response.status}: ${errorText || 'Неизвестная ошибка'}`);
		}

		const data = await response.json();
		console.log('Bosses preview data:', data);
		return data;
	};

	// Подтверждение импорта руководителей
	const confirmBossesImport = async (file: File) => {
		const formData = new FormData();
		formData.append('File', file);

		const response = await fetch('http://localhost:5217/api/import-excel/bosses/confirm', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
			},
			body: formData,
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Ошибка ${response.status}: ${errorText}`);
		}

		return response;
	};

	// Получение превью для сотрудников
	const fetchEmployeesPreview = async (file: File) => {
		const formData = new FormData();
		formData.append('File', file);

		console.log('Sending request to: http://localhost:5217/api/import-excel/employees/preview');
		
		const response = await fetch('http://localhost:5217/api/import-excel/employees/preview', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
			},
			body: formData,
		});

		console.log('Response status:', response.status);
		
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Ошибка ${response.status}: ${errorText || 'Неизвестная ошибка'}`);
		}

		const data = await response.json();
		console.log('Employees preview data:', data);
		return data;
	};

	// Подтверждение импорта сотрудников
	const confirmEmployeesImport = async (file: File) => {
		const formData = new FormData();
		formData.append('File', file);

		const response = await fetch('http://localhost:5217/api/import-excel/employees/confirm', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
			},
			body: formData,
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Ошибка ${response.status}: ${errorText}`);
		}

		return response;
	};

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			console.log('File selected:', file.name, file.type, file.size);
			setSelectedFile(file);
			setPreview(null);
			setError(null);
			setSuccess(null);
		}
	};

	const handlePreview = async () => {
		if (!selectedFile) {
			setError('Пожалуйста, выберите файл');
			return;
		}

		setIsLoading(true);
		setError(null);
		setPreview(null);

		try {
			if (activeTab === 'bosses') {
				const data = await fetchBossesPreview(selectedFile);
				// Для руководителей данные в поле data
				if (data && data.data) {
					setPreview(data.data);
				} else {
					setPreview(data);
				}
			} else {
				const data = await fetchEmployeesPreview(selectedFile);
				// Для сотрудников данные уже в правильной структуре
				setPreview(data);
			}
		} catch (err) {
			console.error('Preview error:', err);
			setError(err instanceof Error ? err.message : 'Ошибка при загрузке превью');
		} finally {
			setIsLoading(false);
		}
	};

	const handleImport = async () => {
		if (!selectedFile) {
			setError('Пожалуйста, выберите файл');
			return;
		}

		setIsLoading(true);
		setError(null);
		setSuccess(null);

		try {
			if (activeTab === 'bosses') {
				await confirmBossesImport(selectedFile);
			} else {
				await confirmEmployeesImport(selectedFile);
			}
			setSuccess('Импорт успешно выполнен');
			setSelectedFile(null);
			setPreview(null);
			// Очищаем input
			const fileInput = document.getElementById('file-input') as HTMLInputElement;
			if (fileInput) fileInput.value = '';
		} catch (err) {
			console.error('Import error:', err);
			setError(err instanceof Error ? err.message : 'Ошибка при импорте');
		} finally {
			setIsLoading(false);
		}
	};

	const renderTable = (data: PreviewData, title?: string) => {
		if (!data || !data.table || data.table.length === 0) {
			return (
				<div className={styles.emptyPreview}>
					<p>Нет данных для отображения</p>
				</div>
			);
		}

		return (
			<div className={styles.tableWrapper}>
				{title && <h3 className={styles.tableTitle}>{title}</h3>}
				<div className={styles.tableContainer}>
					<table className={styles.previewTable}>
						<tbody>
							{data.table.map((row, rowIndex) => (
								<tr key={rowIndex}>
									{row.map((cell, cellIndex) => (
										<td key={cellIndex} className={styles.tableCell}>
											{cell || '—'}
											</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div className={styles.tableStats}>
					<span>📊 Строк с данными: <strong>{data.numberDataRows}</strong></span>
					<span>⏭️ Пропущено строк: <strong>{data.numberIgnoreRows}</strong></span>
					<span>🎯 Компетенций: <strong>{data.numberCompetencies}</strong></span>
				</div>
			</div>
		);
	};

	// Проверка доступности эндпоинтов
	useEffect(() => {
		const checkEndpoints = async () => {
			try {
				const bossesUrl = 'http://localhost:5217/api/import-excel/bosses/preview';
				const employeesUrl = 'http://localhost:5217/api/import-excel/employees/preview';
				
				const bossesResponse = await fetch(bossesUrl, {
					method: 'OPTIONS',
					headers: { 'Authorization': `Bearer ${accessToken}` },
				});
				const employeesResponse = await fetch(employeesUrl, {
					method: 'OPTIONS',
					headers: { 'Authorization': `Bearer ${accessToken}` },
				});
				
				console.log('Bosses endpoint available:', bossesResponse.status !== 404);
				console.log('Employees endpoint available:', employeesResponse.status !== 404);
			} catch (error) {
				console.error('Error checking endpoints:', error);
			}
		};
		
		checkEndpoints();
	}, []);

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<h1 className={styles.title}>Импорт Excel</h1>
				<p className={styles.subtitle}>Загрузка данных из Excel файлов</p>
			</div>

			<div className={styles.content}>
				<div className={styles.tabs}>
					<button
						className={`${styles.tab} ${activeTab === 'bosses' ? styles.active : ''}`}
						onClick={() => {
							setActiveTab('bosses');
							setSelectedFile(null);
							setPreview(null);
							setError(null);
							setSuccess(null);
						}}>
						👔 Руководители
					</button>
					<button
						className={`${styles.tab} ${activeTab === 'employees' ? styles.active : ''}`}
						onClick={() => {
							setActiveTab('employees');
							setSelectedFile(null);
							setPreview(null);
							setError(null);
							setSuccess(null);
						}}>
						👥 Сотрудники
					</button>
				</div>

				<div className={styles.uploadSection}>
					<div className={styles.fileInputWrapper}>
						<input
							id="file-input"
							type="file"
							accept=".xlsx, .xls, .csv"
							onChange={handleFileSelect}
							className={styles.fileInput}
							disabled={isLoading}
						/>
						<label htmlFor="file-input" className={styles.fileLabel}>
							📁 Выберите файл Excel
						</label>
						{selectedFile && (
							<div className={styles.fileInfo}>
								<span>📄 {selectedFile.name}</span>
								<span className={styles.fileSize}>
									({(selectedFile.size / 1024).toFixed(2)} KB)
								</span>
							</div>
						)}
					</div>

					<div className={styles.buttonsGroup}>
						<button
							className={styles.previewBtn}
							onClick={handlePreview}
							disabled={!selectedFile || isLoading}>
							{isLoading ? '⏳ Загрузка...' : '🔍 Предпросмотр'}
						</button>
						<button
							className={styles.importBtn}
							onClick={handleImport}
							disabled={!selectedFile || isLoading || !preview}>
							{isLoading ? '⏳ Импорт...' : '📥 Импортировать'}
						</button>
					</div>
				</div>

				{error && (
					<div className={styles.errorMessage}>
						⚠️ {error}
					</div>
				)}

				{success && (
					<div className={styles.successMessage}>
						✅ {success}
					</div>
				)}

				{preview && (
					<div className={styles.previewSection}>
						<h2 className={styles.previewTitle}>📋 Предпросмотр данных</h2>
						{activeTab === 'bosses' && (
							renderTable(preview as PreviewData, 'Структура руководителей')
						)}
						{activeTab === 'employees' && (
							<>
								{(preview as EmployeePreviewData).profiles && 
									renderTable((preview as EmployeePreviewData).profiles, '📝 Профили сотрудников')
								}
								{(preview as EmployeePreviewData).model && 
									renderTable((preview as EmployeePreviewData).model, '🎓 Модель компетенций')
								}
							</>
						)}
					</div>
				)}

				<div className={styles.infoSection}>
					<h3>📌 Инструкция</h3>
					<div className={styles.infoContent}>
						<p><strong>👔 Для руководителей:</strong> Excel файл должен содержать информацию о структуре подчинения (кто кому подчиняется).</p>
						<p><strong>👥 Для сотрудников:</strong> Excel файл должен содержать профили сотрудников и матрицу компетенций.</p>
						<p><strong>📎 Поддерживаемые форматы:</strong> <code>.xlsx</code>, <code>.xls</code>, <code>.csv</code></p>
						<p><strong>📋 Порядок действий:</strong> Выберите файл → Нажмите "Предпросмотр" → Проверьте данные → Нажмите "Импортировать"</p>
						{error && error.includes('404') && (
							<div className={styles.hint}>
								💡 <strong>Совет:</strong> Если вы видите ошибку 404, убедитесь, что:
								<ul>
									<li>Бэкенд сервер запущен на порту 5217</li>
									<li>Эндпоинты импорта доступны (проверьте в Swagger)</li>
									<li>У вас есть права администратора для импорта данных</li>
								</ul>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default ImportPage;