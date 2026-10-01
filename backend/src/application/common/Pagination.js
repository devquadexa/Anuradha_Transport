/**
 * Shared pagination/filtering/sorting parsing helper. Keeps this logic out
 * of controllers and use cases individually.
 */
function parsePagination(query = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(query.pageSize, 10) || 20, 1), 100);
  const offset = (page - 1) * pageSize;

  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = String(query.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const search = query.search ? String(query.search).trim() : null;

  return { page, pageSize, offset, sortBy, sortOrder, search };
}

function buildMeta({ page, pageSize, total }) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}

module.exports = { parsePagination, buildMeta };
