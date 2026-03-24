import { useState } from 'react';

export function useForm<TForm>(inputValues: TForm) {
	const [form, setForm] = useState<TForm>(inputValues);

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { value, name } = event.target;
		setForm({ ...form, [name]: value });
	};

	const handleInputEdit = (name: string) => {
		setForm({
			...form,
			[name]: '',
		});
	};

	return { form, handleInputChange, handleInputEdit, setForm };
}
