const crypto = require('crypto')

// modal
const Customer = require('../models/customer')
const Order = require('../models/order')
const AccountStatus = require('../models/accountStatus')

// utils
const display = require('../utils/display')
const generateAccessToken = require('../utils/generateAccessToken')

const getAll = async (req, res, next) => {
    try {
        const instance = await Customer.findAll({
            include: {
                association: 'accountStatus',
                attributes: ['code', 'name'],
            },
            attributes: {
                exclude: ['password', 'confirmationCode'],
            }
        })

        res.json(display(200, 'List of customers returned successfully', instance.length, instance))
    }
    catch (err) {
        next(err)
    }
}

const getById = async (req, res, next) => {
    try {
        const instance = await Customer.findByPk(req.params.id, {
            include: {
                association: 'accountStatus',
                attributes: ['code', 'name'],
            },
            attributes: {
                exclude: ['password', 'confirmationCode'],
            }
        })
        if (!instance) {
            return next(display(404, 'Customer not found'))
        }

        res.json(display(200, 'Customer returned successfully', instance && 1, instance))
    }
    catch (err) {
        next(err)
    }
}

const create = async (req, res, next) => {
    try {
        const instance = await Customer.findOne({ where: { account: req.body.account }, paranoid: false })
        if (instance) {
            return next(display(400, 'Customer already exists'))
        }

        const newInstance = await Customer.create({
            account: req.body.account,
            password: req.body.password,
            fullName: req.body.fullName,
            email: req.body.email,
            phone: req.body.phone,
            address: req.body.address,
            accountStatusId: req.body.accountStatusId,
        })

        res.json(display(200, 'Customer created successfully', newInstance && 1, newInstance))
    } catch (err) {
        next(err)
    }
}

const update = async (req, res, next) => {
    try {
        const instance = await Customer.findByPk(req.params.id)
        if (!instance) {
            return next(display(404, 'Customer not found'))
        }

        const [result, newInstance] = await Customer.update({
            password: req.body.password,
        }, {
            where: { id: req.params.id },
            returning: true,
            plain: true,
        })

        res.json(display(200, 'Customer updated successfully', !result && 1, newInstance))
    } catch (err) {
        next(err)
    }
}

const destroy = async (req, res, next) => {
    try {
        const instance = await Customer.findByPk(req.params.id)
        if (!instance) {
            return next(display(404, 'Customer not found'))
        }

        const newInstance = await Customer.destroy({
            where: { id: req.params.id },
            returning: true,
            plain: true
        })

        res.json(display(200, 'Customer deleted successfully', newInstance && 1, newInstance))
    } catch (err) {
        next(err)
    }
}

const restore = async (req, res, next) => {
    try {
        const instance = await Customer.findOne({ where: { id: req.params.id }, paranoid: false })
        if (!instance) {
            return next(display(404, 'Customer not found'))
        } else {
            if (instance.deletedAt === null) {
                return next(display(400, 'Customer must be soft deleted before continue'))
            }
        }

        const newInstance = await Customer.restore({
            where: { id: req.params.id },
            returning: true,
            plain: true
        })

        res.json(display(200, 'Restore customer successfully', newInstance && 1, newInstance))
    } catch (err) {
        next(err)
    }
}

const destroyForce = async (req, res, next) => {
    try {
        const instance = await Customer.findOne({ where: { id: req.params.id }, paranoid: false })
        if (!instance) {
            return next(display(404, 'Customer not found'))
        } else {
            if (instance.deletedAt === null) {
                return next(display(400, 'Customer must be soft deleted before continue'))
            }
        }

        const newInstance = await Customer.destroy({
            where: { id: req.params.id },
            returning: true,
            plain: true,
            force: true // delete record from database
        })

        res.json(display(200, 'Customer deleted successfully', newInstance))
    } catch (err) {
        next(err)
    }
}

const signUp = async (req, res, next) => {
    try {
        const instance = await Customer.findOne({ where: { account: req.body.account }, paranoid: false })
        if (instance) {
            return next(display(400, 'Customer already exists'))
        }

        const confirmationCode = crypto.randomBytes(16).toString('hex');

        const newInstance = await Customer.create({
            account: req.body.account,
            password: req.body.password,
            fullName: req.body.fullName,
            email: req.body.email,
            phone: req.body.phone,
            address: req.body.address,
            accountStatusId: 1,
            confirmationCode: confirmationCode
        }, {
            attributes: {
                exclude: ['password', 'confirmationCode']
            }
        })

        res.json(display(200, 'Customer created successfully', newInstance && 1))

        req.body.id = newInstance.id
        req.body.confirmationCode = newInstance.confirmationCode
        return next()  // go to sendMail
    } catch (err) {
        next(err)
    }
}

const verify = async (req, res, next) => {
    try {
        const instance = await Customer.findOne({
            where: { id: req.params.id },
            include: 'accountStatus'
        })
        if (!instance) {
            return next(display(400, 'Customer not found'))
        }

        if (instance.accountStatus.code !== 1) {
            return next(display(400, 'Customer not needed verify'))
        }

        if (instance.confirmationCode !== req.params.confirmationCode) {
            return next(display(400, 'Confirmation code not accepted'))
        }

        const instance3 = await AccountStatus.findOne({ where: { code: 2 } })

        const [result, newInstance] = await Customer.update({
            accountStatusId: instance3.id,
            confirmationCode: ''
        }, {
            where: { id: req.params.id },
            returning: true,
            plain: true,
        })

        res.json(display(200, 'Customer verfiy successfully', !result && 1))
    } catch (err) {
        next(err)
    }
}

const signIn = async (req, res, next) => {
    try {
        const instance = await Customer.findOne({ where: { account: req.body.account } })
        if (!instance) {
            return next(display(400, 'Account not exist'))
        }

        if (instance.password !== req.body.password) {
            return next(display(400, 'Password not match'))
        }

        const token = generateAccessToken({
            account: instance.account
        })

        res.json(display(200, 'Sign in successfully', 1, { token: token }))
    } catch (err) {
        next(err)
    }
}

const getAllOrder = async (req, res, next) => {
    try {
        const instance = await Order.findAll({ where: { customerId: req.params.id } })
        if (!instance) {
            return next(display(400, 'Order not found'))
        }

        res.json(display(200, 'Get all order successfully', instance.length, instance))
    } catch (err) {
        next(err)
    }
}

module.exports = { getAll, getById, create, update, destroy, restore, destroyForce, signUp, verify, signIn, getAllOrder }