var express = require('express');
var router = express.Router();
const { 
  registerOwner,
  loginOwner,
  logoutOwner,
  refreshAccessToken,
  updateCurrentPassword,
  getCurrentOwner,
  updateAccountDetails,
  getOwnerListings
} = require('../controller/owner.controller'); 

router.post('/register', registerOwner);
router.post('/login', loginOwner);
router.post('/logout', logoutOwner);
router.post('/refresh-token', refreshAccessToken);
router.post('/change-password', updateCurrentPassword);
router.get('/profile', getCurrentOwner);
router.patch('/update-account', updateAccountDetails);
router.get('/listings/my-listings', getOwnerListings);

module.exports = router;