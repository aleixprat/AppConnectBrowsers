const router = require('express').Router();
const bcrypt = require('bcryptjs');

const { create, update,getAll, getByEmail, getById } = require('../../models/user.model');
const { createToken } = require('../../utils/helpers');
const { checkToken, checkAdmin } = require('../../utils/middlewares');

router.get('/', checkToken, checkAdmin, async (req, res) => {
    try {
        const [users] = await getAll();
        res.json(users);
    } catch (error) {
        res.status(500).json({ fatal: error.message });
    }
});

router.get('/profile', checkToken, (req, res) => {
    delete req.user.password;
    res.json(req.user);
});

router.put('/:userId',checkToken, async (req, res) => {
    const { userId } = req.params;

    try {
        await update(userId, req.body);
        const [getByIdResponse] = await getById(userId);
        res.json(getByIdResponse[0]);
    } catch (error) {
        res.status(500).json({ fatal: error.message })
    }
});

router.post('/register', async (req, res) => {

    // Antes de insertar encriptamos la password
    req.body.password = bcrypt.hashSync(req.body.password, 8);

    try {
        const [result] = await create(req.body);
        res.json(result);
    } catch (error) {
        res.json({ fatal: error.message });
    }
});



router.post('/login', async (req, res) => {
    // ¿Existe el email en la base de datos?
    const [users] = await getByEmail(req.body.email);

    if (users.length === 0) {
        return res.json({ fatal: 'Error en email y/o contraseña' });
    }

    // Recuperamos el user
    const user = users[0];

    // ¿Coinciden las password?
    const iguales = bcrypt.compareSync(req.body.password, user.password);
    if (!iguales) {
        return res.json({ fatal: 'Error en email y/o contraseña' });
    }

    res.json({
        success: 'Login correcto',
        token: createToken(user)
    });

});

module.exports = router;