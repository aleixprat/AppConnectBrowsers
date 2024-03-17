const router = require('express').Router();
const { getAll, create, getById, update, deleteById } = require('../../models/company.model');
const { checkAdmin } = require('../../utils/middlewares');

router.get('/', async (req, res) => {
    try {
        const [companies] = await getAll();
        res.json(companies);
    } catch (error) {
        res.status(500).json({ fatal: error.message });
    }
});

router.get('/:companyId', async (req, res) => {
    const { companyId } = req.params;
    try {
        const [company] = await getById(companyId);
        res.json(company[0]);
    } catch (error) {
        res.status(500).json({ fatal: error.message });
    }
})

router.post('/',checkAdmin, async (req, res) => {
    try {
        const [result] = await create(req.body);
        const [newcompany] = await getById(result.insertId);
        res.json(newcompany[0]);
    } catch (error) {
        res.status(500).json({ fatal: error.message })
    }
});

router.put('/:companyId', checkAdmin, async (req, res) => {
    const { companyId } = req.params;

    try {
        await update(companyId, req.body);
        const [company] = await getById(companyId);
        res.json(company[0]);
    } catch (error) {
        res.status(500).json({ fatal: error.message })
    }
});

router.delete('/:companyId', checkAdmin, async (req, res) => {
    const { companyId } = req.params;

    try {
        const [company] = await getById(companyId);
        await deleteById(companyId);
        res.json(company[0]);
    } catch (error) {
        res.status(500).json({ fatal: error.message })
    }
});

module.exports = router;