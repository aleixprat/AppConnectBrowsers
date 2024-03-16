const create = ({ username, email, password, telephone, name_img, img }) => {
    return db.query(
        'insert into user (username, email, password, telephone, name_img, img) values (?, ?, ?, ?, ?, ?)',
        [username, email, password, telephone, name_img, img]
    );
}

const update = (id,{ username, email, telephone, name_img, img }) => {
    return db.query(
        'UPDATE user SET username = ?, email = ?, telephone = ?, name_img = ?, img = ? WHERE id = ?',
        [username, email, telephone, name_img, img, id]
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
    create, update, getByEmail, getById, getByTelephone
}