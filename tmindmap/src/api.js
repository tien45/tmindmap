import axios from 'axios';

const API_URL = 'http://localhost:5000';

export const getMindMaps = async () => {
    return await axios.get(`${API_URL}/mindmaps`);
};