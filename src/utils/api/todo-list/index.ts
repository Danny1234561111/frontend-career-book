import { request } from '../request';

const get = async () => {
	const data = await request.getList('TodoItems');
	return data;
};

const set = async (name: string) => {
	const formData = new FormData();
	formData.append('name', name);
	const data = await request.post('TodoItems', formData);
	return String(data);
};

const getItem = async (id: string) => {
	const data = await request.get(`TodoItems/${id}`);
	return data;
};

const put = async (formData: string) => {
	const data = await request.put('TodoItems', formData);
	return data;
};

const deleteItem = async (id: string) => {
	const data = await request.deleteRequets(`TodoItems/${id}`);
	return data;
};

export const todoApi = {
	get,
	getItem,
	set,
	put,
	deleteItem,
};
