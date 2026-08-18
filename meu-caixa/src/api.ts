// src/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3011',
});

export default api;