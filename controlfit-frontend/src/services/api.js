// src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3000/api'
});

export const loginAdmin = (credentials) => API.post('/login', credentials);
export const getMembers = () => API.get('/members');
export const createMember = (data) => API.post('/members', data);