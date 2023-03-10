// modal
const { Op } = require('sequelize')
const Customer = require('~/models/customer')
const Order = require('~/models/order')

const getAll = async (req, res, next) => {
    try {
        const { query } = req
        const option = {}

        // search by field `id`
        if (query.ids) {
            const array = query.ids.split(',')
            const search = {
                [Op.in]: array,
            }
            option.id = search
        }

        // search by field `role_id`
        if (query.role_ids) {
            const array = query.role_ids.split(',')
            const search = {
                [Op.in]: array,
            }
            option.role_id = search
        }

        // search by field `status_id`
        if (query.status_ids) {
            const array = query.status_ids.split(',')
            const search = {
                [Op.in]: array,
            }
            option.status_id = search
        }

        // search by field `full_name`
        if (query.full_name) {
            const names = query.full_name.split(' ')
            const searchName = {
                [Op.or]: names.map(term => ({
                    [Op.like]: `%${term}%`,
                })),
            }
            option.full_name = searchName
        }

        // search by field `phone_number`
        if (query.phone_number) {
            const descriptions = query.phone_number.split(' ')
            const searchDescription = {
                [Op.or]: descriptions.map(term => ({
                    [Op.like]: `%${term}%`,
                })),
            }
            option.phone_number = searchDescription
        }

        // search by field `address`
        if (query.address) {
            const genres = query.address.split(',' || ' ')
            const searchGenre = {
                [Op.or]: genres.map(term => ({
                    [Op.like]: `%${term}%`,
                })),
            }
            option.address = searchGenre
        }

        // search by field `account`
        if (query.accounts) {
            const descriptions = query.accounts.split(',')
            const searchDescription = {
                [Op.or]: descriptions.map(term => ({
                    [Op.like]: `%${term}%`,
                })),
            }
            option.account = searchDescription
        }

        // search by field `email`
        if (query.emails) {
            const descriptions = query.emails.split(',')
            const searchDescription = {
                [Op.or]: descriptions.map(term => ({
                    [Op.like]: `%${term}%`,
                })),
            }
            option.email = searchDescription
        }

        // paginate results
        const perPage = query.per_page || 5
        const page = query.page || 1

        // sort by fields
        const sortBy =
            query?.sort_by?.split(',').map(e => {
                if (e.includes('-')) {
                    return [e.slice(1), 'DESC']
                }
                return [e, 'ASC']
            }) || []

        const { count, rows } = await Customer.findAndCountAll({
            include: 'orders',
            where: option,
            limit: Number(perPage),
            offset: Number(page * perPage - perPage),
            order: sortBy,
        })

        res.status(200).json({
            status: 200,
            page: Number(page),
            per_page: Number(perPage),
            total_page: Math.ceil(count / perPage),
            total_record: count,
            count: rows.length,
            data: rows,
        })
    } catch (error) {
        next(error)
    }
}

const getById = async (req, res, next) => {
    try {
        const customer = await Customer.findOne()

        if (!customer) {
            return res.status(404).json({
                status: 404,
                message: '404 Not Found',
            })
        }

        res.status(200).json({
            status: 200,
            data: customer,
        })
    } catch (error) {
        next(error)
    }
}

const update = async (req, res, next) => {
    try {
        const customer = await Customer.findByPk(req.params.id)

        if (!customer) {
            return res.status(404).json({
                status: 404,
                message: '404 Not Found',
            })
        }

        const newCustomer = await Customer.update(
            {
                full_name: req.body.full_name,
            },
            {
                where: { id: req.params.id },
                returning: true,
                plain: true,
            },
        )

        res.status(200).json({
            status: 200,
            data: newCustomer[1],
        })
    } catch (error) {
        next(error)
    }
}

const destroy = async (req, res, next) => {
    try {
        const instance = await Customer.findByPk(req.params.id)
        if (!instance) {
            return res.status(404).json({
                status: 404,
                message: '404 Not Found',
            })
        }

        await Customer.destroy({
            where: { id: req.params.id },
            returning: true,
            plain: true,
        })

        res.status(200).json({
            status: 200,
        })
    } catch (err) {
        next(err)
    }
}

const restore = async (req, res, next) => {
    try {
        const instance = await Customer.findOne({
            where: { id: req.params.id },
            paranoid: false,
        })

        if (!instance) {
            return res.status(404).json({
                status: 404,
                message: '404 Not Found',
            })
        }

        if (instance.deleted_at == null) {
            return res.status(404).json({
                status: 404,
                message: '404 Not Found',
            })
        }

        await Customer.restore({
            where: { id: req.params.id },
            returning: true,
            plain: true,
        })

        res.status(200).json({
            status: 200,
        })
    } catch (err) {
        next(err)
    }
}

const destroyForce = async (req, res, next) => {
    try {
        const instance = await Customer.findOne({
            where: { id: req.params.id },
            paranoid: false,
        })
        if (!instance) {
            return res.status(404).json({
                status: 404,
                message: '404 Not Found',
            })
        }

        if (instance.deleted_at == null) {
            return res.status(404).json({
                status: 404,
                message: '404 Not Found',
            })
        }

        await Customer.destroy({
            where: { id: req.params.id },
            returning: true,
            plain: true,
            force: true, // delete record from database
        })

        res.status(200).json({
            status: 200,
        })
    } catch (error) {
        next(error)
    }
}

const getAllOrder = async (req, res, next) => {
    try {
        const instance = await Order.findAll({
            where: { customerId: req.params.id },
        })
        if (!instance) {
            return res.status(404).json({
                status: 404,
                message: '404 Not Found',
            })
        }

        res.status(200).json({
            status: 200,
            data: instance,
        })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    getAll,
    getById,
    update,
    destroy,
    restore,
    destroyForce,
    getAllOrder,
}
