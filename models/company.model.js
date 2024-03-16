const getAll = () => {
    return db.query('select * from company');
}

const create = ({ name, description, name_img, img }) => {
    return db.query(
        'insert into company (name, description, name_img, img) values (?, ?, ?, ?)',
        [name, description, name_img, img]
    );
}

const update = (id, { name, description, name_img, img }) => {
    return db.query(
        'UPDATE company SET name = ?, description = ?, name_img = ?, img = ? WHERE id = ?',
        [name, description, name_img, img, id]
    );
}

const getByName = (name) => {
    return db.query(
        'select * from company where name = ?',
        [name]
    );
}

const getById = (companyId) => {
    return db.query(
        'select * from company where id = ?', [companyId]
    )
}

const deleteById = (companyId) => {
    return db.query('delete from company where id = ?', [companyId]);
}

module.exports = {
    getAll, create, update, getByName, getById, deleteById
}