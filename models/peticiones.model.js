const getAll = () => {
    return db.query('select * from peticiones');
}

const getAllJobs = () => {
    return db.query('select talla, url from peticiones group by url, talla order by url');
}
const getById = (peticionId) => {
    return db.query('select * from peticiones where id = ? ', [peticionId]);
}

const getJobsByUrlTalla = (url, talla, { is_existe, is_stock }) => {
    return db.query('select * from peticiones where url = ? and talla = ? and (is_existe != ? or is_stock != ?)', [url, talla,is_existe, is_stock]);
}

const create = ({ nombre, descripcion, url, talla, usuarios_id }) => {
    return db.query(
        'insert into peticiones (nombre, descripcion, url, talla, usuarios_id) values (?, ?, ?, ?, ?)',
        [nombre, descripcion, url, talla, usuarios_id]
    );
}

const update = (producoId, { nombre, descripcion, url, talla, usuarios_id }) => {
    return db.query(
        'update peticiones set nombre = ?, descripcion = ?, url = ?, talla = ?, usuarios_id = ? where id = ?',
        [nombre, descripcion, url, talla, usuarios_id, producoId]
    )
}

const updateExisteStock = (productoId, { is_existe, is_stock }) => {
    return db.query(
        'UPDATE peticiones SET is_existe = ?, is_stock = ? WHERE id = ? AND (is_existe != ? OR is_stock != ?)',
        [is_existe, is_stock, productoId, is_existe, is_stock]
    )
}

const deleteById = (producoId) => {
    return db.query('delete from peticiones where id = ?', [producoId]);
}

module.exports = {
    getAll, create, getById, getJobsByUrlTalla, getAllJobs, update, updateExisteStock, deleteById
}