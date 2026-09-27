import apiClient from './client.js';

// Downloads the Excel template for routes / buses / drivers / students.
export async function downloadImportTemplate(entity) {
  const res = await apiClient.get(`/import/${entity}/template`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `awabus-${entity}-template.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Sends a filled-in template. Without commit it only checks the rows; with
// commit it imports them (the server re-checks first).
export const uploadImportFile = (entity, file, commit = false) =>
  apiClient
    .post(`/import/${entity}${commit ? '?commit=1' : ''}`, file, {
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
    })
    .then((r) => r.data);
