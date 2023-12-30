const router = require('express').Router();
const {
    listCompanyRoute,
    companyRoute,
    deleteCompanyRoute,
    addCompanyRoute,
    getCompanyDepartments,
    getAllStructureByCompany,
    updateCompanyRoute
} = require("../controller/companyController");
const authMiddleware = require('../middleware/auth.middleware')

// Production routes
router.get("/", companyRoute);
router.get("/list", listCompanyRoute);
router.delete("/delete", deleteCompanyRoute);
router.post("/add", addCompanyRoute);
router.post("/update", updateCompanyRoute);
router.get("/departments", getCompanyDepartments);
router.get("/tree", getAllStructureByCompany);



module.exports = router;