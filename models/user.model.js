const create = ({ username, email, password, telephone }) => {
    return db.query(
        'insert into user (username, email, password, telephone) values (?, ?, ?, ?)',
        [username, email, password, telephone]
    );
}

const getByEmail = (email) => {
    return db.query(
        'select * from user where email = ?',
        [email]
    );
}

const getByTelephone = (telephone) => {
    return db.query(
        'select * from user where telephone = ?',
        [telephone]
    );
}

const getById = (userId) => {
    return db.query(
        'select * from user where id = ?', [userId]
    )
}

module.exports = {
    create, getByEmail, getById, getByTelephone
}