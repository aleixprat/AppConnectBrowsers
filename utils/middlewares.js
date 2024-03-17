const jwt = require('jsonwebtoken');
const { getById } = require('../models/user.model');

const checkToken = async (req, res, next) => {
    // ¿Viene incluida la cabecera de Authorization?
    if (!req.headers['authorization']) {
        return res.json({ fatal: 'Debes incluir la cabecera de Autorización' });
    }

    // Recuperar el token
    const token = req.headers['authorization'];

    // ¿Es correcto el token?
    let obj;
    try {
        obj = jwt.verify(token, process.env.SECRET_KEY);
    } catch (error) {
        return res.json({ fatal: error.message });
    }

    // Recupero los datos del user logado
    // obj dispone de las siguientes claves: user_id, user_role, exp
    const [users] = await getById(obj.user_id);
    req.user = users[0];

    next();
}


const checkAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.json({ fatal: 'Debes ser usuario administrador' });
    }

    next();
}

module.exports = { checkToken, checkAdmin};