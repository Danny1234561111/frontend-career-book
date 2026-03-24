import { request } from '../request';

const requestToken = async () => {
	const data = await request.token();
	return data;
};

export const authApi = {
	requestToken,
};
