const router = require('express').Router();

const { checkToken } = require('../utils/middlewares');

router.use('/usuarios', require('./api/usuarios'));

router.use('/peticiones',
    checkToken,
    require('./api/peticiones')
);



module.exports = router;