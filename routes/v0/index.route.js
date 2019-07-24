const express = require('express');
const router = express.Router();
const cors = require('cors');

const zipcodeRoute = require('../../routes/v0/zipcode.route');

router.use(cors());
router.use('/zipcode', zipcodeRoute);


router.use('/', async (req, res, next) => {
    res.json({status: false, message: 'V0 INDEX REACHED'});
});

module.exports = router;
