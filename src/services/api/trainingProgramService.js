import { fetchWithAuth } from '../../utils/fetch';

const BASE_URL = '/v1/training-programs';

export const trainingProgramService = {
  getAll: async (params) => {
    const queryParams = new URLSearchParams({
      PageIndex: params.PageIndex || 1,
      PageSize: params.PageSize || 10,
      ...(params.Semester && { Semester: params.Semester }),
      ...(params.AcademicYear && { AcademicYear: params.AcademicYear }),
    }).toString();

    const response = await fetchWithAuth(`${BASE_URL}?${queryParams}`);
    return response.json();
  },

  getById: async (id) => {
    const response = await fetchWithAuth(`${BASE_URL}/${id}`);
    return response.json();
  },

  create: async (data) => {
    const response = await fetchWithAuth(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  update: async (id, data) => {
    const response = await fetchWithAuth(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  delete: async (id) => {
    const response = await fetchWithAuth(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },
}; 