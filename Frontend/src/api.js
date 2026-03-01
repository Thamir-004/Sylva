// src/api.js
// All backend API calls in one place.
// WHY centralise: if the API URL changes, we change it in one place.

import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

// POST /predict — main prediction call
export async function predict(lat, lng, userId = null) {
  const { data } = await api.post('/predict/', {
    lat,
    lng,
    user_id: userId,
  })
  return data
}

// GET /history/:userId — fetch past queries
export async function getHistory(userId) {
  const { data } = await api.get(`/history/${userId}`)
  return data.history
}