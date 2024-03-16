const router = require('express').Router();

const { checkToken } = require('../utils/middlewares');

router.use('/users', require('./api/users'));

router.use('/request',
    checkToken,
    require('./api/requests')
);

router.use('/company',
    checkToken,
    require('./api/companies')
);



module.exports = router;