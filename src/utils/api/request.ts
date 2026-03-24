import axios, { AxiosRequestConfig } from 'axios';
import { apiConfig } from '../api-config';
import { ErrorResponse } from 'react-router-dom';

const token = async () => {
	return await axios({
		method: 'POST',
		url: `${apiConfig.baseUrlAuth}/Auth/getTokens`,
		headers: { 'content-type': 'application/json' },
		withCredentials: true,
	}).then((resp) => {
		localStorage.setItem('refreshToken', resp.data.refreshToken);
		localStorage.setItem('acessToken', resp.data.acessToken);
		return resp.data.acessToken;
	});
};

const refreshToken = async () => {
	try {
		return await axios({
			method: 'POST',
			url: `${apiConfig.baseUrlAuth}/Auth/refreshToken`,
			headers: { 'content-type': 'application/json' },
			withCredentials: true,
			data: JSON.stringify({
				acessToken: localStorage.getItem('acessToken'),
				refreshToken: localStorage.getItem('refreshToken'),
			}),
		}).then((resp) => {
			localStorage.setItem('refreshToken', resp.data.refreshToken);
			localStorage.setItem('acessToken', resp.data.acessToken);
			return resp.data.acessToken;
		});
	} catch (e) {
		return token();
	}
};

const get = async (url: string) => {
	const data = await fetchWithRefresh({
		method: 'GET',
		url: `${apiConfig.baseUrl}/${url}`,
	}).then((resp) => {
		switch (resp?.status) {
			case 200: {
				return resp.data;
			}
			default: {
				return null;
			}
		}
	});
	return data;
};

const getList = async (url: string) => {
	const data = await fetchWithRefresh({
		method: 'GET',
		url: `${apiConfig.baseUrl}/${url}`,
	}).then((resp) => {
		switch (resp?.status) {
			case 200: {
				return resp.data;
			}
			default: {
				return [];
			}
		}
	});
	return data;
};

const post = async (url: string, form: FormData) => {
	const data = await fetchWithRefresh({
		method: 'POST',
		url: `${apiConfig.baseUrl}/${url}`,
		data: form,
	}).then((resp) => {
		switch (resp?.status) {
			case 201: {
				return resp.data;
			}
			default: {
				return null;
			}
		}
	});

	return data;
};

const put = async (url: string, form: string) => {
	const data = await fetchWithRefresh({
		method: 'PUT',
		url: `${apiConfig.baseUrl}/${url}`,
		data: form,
	}).then((resp) => {
		switch (resp?.status) {
			case 201: {
				return resp.data;
			}
			default: {
				return null;
			}
		}
	});

	return data;
};

const deleteRequets = async (url: string) => {
	const data = await fetchWithRefresh({
		method: 'DELETE',
		url: `${apiConfig.baseUrl}/${url}`,
	}).then((resp) => {
		switch (resp?.status) {
			case 200: {
				return resp.data;
			}
			default: {
				return null;
			}
		}
	});

	return data;
};

const fetchWithRefresh = async (option: AxiosRequestConfig) => {
	option.headers = {
		'Content-Type': 'application/json;charset=utf-8',
		authorization: `Bearer ${localStorage.getItem('acessToken')}`,
	};
	try {
		const data = await axios(option);
		return data;
	} catch (e) {
		const err = e as ErrorResponse;
		if (err.status === 401) {
			const accessToken = await refreshToken(); //обновляем токен
			option.headers = {
				'Content-Type': 'application/json;charset=utf-8',
				authorization: `Bearer ${accessToken}`,
			};
			const data = await axios(option);
			return data;
		}
	}
};

export const request = {
	token,
	get,
	getList,
	post,
	put,
	deleteRequets,
};
