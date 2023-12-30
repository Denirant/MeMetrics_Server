const router = require('express').Router();
const {
    createWorker,
    verifyWorker,
    getAllWorkers,
    getWorker,
    loginWorker,
    deleteWorker,
    onlineWorker,
    getAllWorkersByCompany,
    updateWorker
} = require("../controller/workerController");


router.post('/', createWorker);
router.post('/delete', deleteWorker);
router.get('/verify', verifyWorker);
router.get('/list', getAllWorkers);
router.get('/companyList', getAllWorkersByCompany);
router.get('/unique/:id', getWorker);
router.post('/login', loginWorker);
router.post('/online', onlineWorker);
router.post('/update', updateWorker);


module.exports = router;