const router = require('express').Router();
const authMiddleware = require('../middleware/auth.middleware')

const {
    loginRoute,
    registerRoute,
    verifyRoute,
    resetRequestRoute,
    resetCheckRoute,
    resetChangeRoute,
    OTPRoute,
    OTPVerifyRoute,
    OTPtest,
    googleAuthRoute,
    AddNotification,
    DeleteNotification,
    authRoute,
    getDataRoute,
    updateUserPassword,
    uploadProfilePhoto,
    getAllTags,
    removeTag,
    addTag
} = require("../controller/userController");

const {
    getKeysAlfa,
    getInfoBank,
    getPaymentInfo,
    getSummeryInfo,
} = require('../controller/alfaBankController');


// Production routes
router.post("/login", loginRoute);
router.post("/register", registerRoute);
router.get("/verify", verifyRoute);
router.post("/reset_check", resetRequestRoute);
router.get("/reset", resetCheckRoute);
router.post("/reset", resetChangeRoute);
router.get('/OTP', OTPRoute);
router.get('/OTP/verify', OTPVerifyRoute);
router.post('/googleAuth', googleAuthRoute)

router.get('/data', getDataRoute);
router.post('/updatePassword', updateUserPassword);
router.post('/updateAvatar', uploadProfilePhoto);

router.get('/banks/alfa', getKeysAlfa);
router.get('/banks/alfa/info', getInfoBank);
router.get('/banks/alfa/payment', getPaymentInfo);
router.get('/banks/alfa/summery', getSummeryInfo);

router.post('/add-notification', AddNotification);
router.delete('/delete-notification', DeleteNotification);

router.get('/auth', authMiddleware, authRoute)

// Test routes
router.get('/test/otp', OTPtest);

// Get all tags
router.get('/tags', authMiddleware, getAllTags)
// Add tag by name
router.post('/tags', authMiddleware, addTag)
// Remove tag by name
router.delete('/tags', authMiddleware, removeTag)

module.exports = router;