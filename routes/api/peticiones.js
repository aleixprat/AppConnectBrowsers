const router = require('express').Router();
const { getAll, create, getById, update, deleteById } = require('../../models/peticiones.model');

router.get('/', async (req, res) => {
    try {
        const [peticiones] = await getAll();
        res.json(peticiones);
    } catch (error) {
        res.status(500).json({ fatal: error.message });
    }
});

router.get('/peticiones', async (req, res) => {
    try {
        const [peticiones] = await getAll();
        res.json(peticiones);
    } catch (error) {
        res.status(500).json({ fatal: error.message });
    }
})

router.post('/', async (req, res) => {
    try {
        const [result] = await create(req.body);
        const [newPeticion] = await getById(result.insertId);
        res.json(newPeticion[0]);
    } catch (error) {
        res.status(500).json({ fatal: error.message })
    }
});

router.put('/:peticionId', async (req, res) => {
    const { peticionId } = req.params;

    try {
        await update(peticionId, req.body);
        const [peticion] = await getById(peticionId);
        res.json(peticion[0]);
    } catch (error) {
        res.status(500).json({ fatal: error.message })
    }
});

router.delete('/:peticionId', async (req, res) => {
    const { peticionId } = req.params;

    try {
        const [peticion] = await getById(peticionId);
        await deleteById(peticionId);
        res.json(peticion[0]);
    } catch (error) {
        res.status(500).json({ fatal: error.message })
    }
});

module.exports = router;