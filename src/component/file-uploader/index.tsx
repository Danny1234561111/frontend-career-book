import React, { useRef } from 'react';
import styles from './file-uploader.module.scss';

interface FileUploaderProps {
	onFileSelect: (file: File) => void;
	selectedFile: File | null;
}

const FileUploader: React.FC<FileUploaderProps> = ({
	onFileSelect,
	selectedFile,
}) => {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			onFileSelect(file);
		}
	};

	return (
		<div className={styles.uploader}>
			<button
				className={styles.selectBtn}
				onClick={() => fileInputRef.current?.click()}>
				Выбрать файл
			</button>
			<input
				ref={fileInputRef}
				type='file'
				accept='.xlsx'
				onChange={handleFileSelect}
				className={styles.fileInput}
			/>
			{selectedFile && (
				<span className={styles.fileName}>
					Выбран файл: {selectedFile.name}
				</span>
			)}
		</div>
	);
};

export default FileUploader;
