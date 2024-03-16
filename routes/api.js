const router = require('express').Router();

const { checkToken } = require('../utils/middlewares');

router.use('/requests',
    checkToken,
    require('./api/requests')
);



module.exports = router;