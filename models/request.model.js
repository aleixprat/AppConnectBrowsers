const getAll = () => {
    return db.query('select * from request');
}

const getAllJobs = () => {
    return db.query('select size, url from request group by url, size order by url');
}
const getById = (requestId) => {
    return db.query('select * from request where id = ? ', [requestId]);
}

const getJobsByUrlSize = (url, size, { is_exist, is_stock }) => {
    return db.query('select * from request where url = ? and size = ? and (is_exist != ? or is_stock != ?)', [url, size,is_exist, is_stock]);
}

const create = ({ name, description, url, size, user_id, company_id }) => {
    return db.query(
        'insert into request (name, description, url, size, user_id, company_id) values (?, ?, ?, ?, ?, ?)',
        [name, description, url, size, user_id,company_id]
    );
}

const update = (requestId, { name, description, url, size, user_id, company_id }) => {
    return db.query(
        'update request set name = ?, description = ?, url = ?, size = ?, user_id = ?, company_id = ? where id = ?',
        [name, description, url, size, user_id, requestId, company_id]
    )
}

const updateExisteStock = (requestId, { is_exist, is_stock }) => {
    return db.query(
        'UPDATE request SET is_exist = ?, is_stock = ? WHERE id = ? AND (is_exist != ? OR is_stock != ?)',
        [is_exist, is_stock, requestId, is_exist, is_stock]
    )
}

const deleteById = (requestId) => {
    return db.query('delete from request where id = ?', [requestId]);
}

module.exports = {
    getAll, create, getById, getJobsByUrlSize, getAllJobs, update, updateExisteStock, deleteById
}