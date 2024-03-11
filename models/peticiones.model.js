const getAll = () => {
    return db.query('select * from peticiones');
}

const getById = (peticionId) => {
    return db.query('select * from peticiones where id = ? ', [peticionId]);
}

const getJobsByUrlTalla = (url, talla) => {
    return db.query('select * from peticiones where url = ? and talla = ?', [url, talla]);
}


const getJobs = () => {
    return db.query('select talla, url from peticiones group by url, talla order by url');
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

const deleteById = (producoId) => {
    return db.query('delete from peticiones where id = ?', [producoId]);
}

module.exports = {
    getAll, create, getById, getJobsByUrlTalla, getJobs, update, deleteById
}