const { Router } = require('express');
const { getMembers, postMember } = require('../controllers/member.controller');

const router = Router();

router.get('/members', getMembers);
router.post('/members', postMember);

module.exports = router;