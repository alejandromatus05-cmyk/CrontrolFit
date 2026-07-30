const memberModel = require('../models/member.model');

const getMembers = async (req, res) => {
    try {
        const members = await memberModel.getAllMembers();
        res.json({ status: 'success', data: members });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const postMember = async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        if (!name || !email) {
            return res.status(400).json({ status: 'error', message: 'Nombre y email son obligatorios' });
        }
        const newMember = await memberModel.createMember(name, email, phone);
        res.status(201).json({ status: 'success', message: 'Socio registrado con éxito', data: newMember });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

module.exports = {
    getMembers,
    postMember
};