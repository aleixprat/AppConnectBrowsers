const router = require('express').Router();
const { getAll, create, getById, update, deleteById } = require('../../models/request.model');

router.get('/', async (req, res) => {
    try {
        const [requests] = await getAll();
        res.json(requests);
    } catch (error) {
        res.status(500).json({ fatal: error.message });
    }
});

router.get('/:requestId', async (req, res) => {
    const { requestId } = req.params;
    try {
        const [request] = await getById(requestId);
        res.json(request[0]);
    } catch (error) {
        res.status(500).json({ fatal: error.message })
    }
});

router.post('/', async (req, res) => {
    try {
        const [result] = await create(req.body);
        const [newrequest] = await getById(result.insertId);
        res.json(newrequest[0]);
    } catch (error) {
        res.status(500).json({ fatal: error.message })
    }
});


router.put('/:requestId', async (req, res) => {
    const { requestId } = req.params;

    try {
        await update(requestId, req.body);
        const [request] = await getById(requestId);
        res.json(request[0]);
    } catch (error) {
        res.status(500).json({ fatal: error.message })
    }
});

router.delete('/:requestId', async (req, res) => {
    const { requestId } = req.params;

    try {
        const [request] = await getById(requestId);
        await deleteById(requestId);
        res.json(request[0]);
    } catch (error) {
        res.status(500).json({ fatal: error.message })
    }
});

module.exports = router;