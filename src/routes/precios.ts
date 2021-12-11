import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import { camelizeKeys, formatKeys } from '../utils/utils';

const router = express.Router();

router.get('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    try {
        const listasPrecio = await knex('ListasPrecio').select('*');
        res.status(200).json(camelizeKeys(listasPrecio));
    } catch (err) {
        next(err);
    }
});

router.get('/:precio_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    const precio_id = req.params.precio_id;

    try {
        const precios = await knex('ListasPrecioDet').select('*').where({ListaPrecioID: precio_id});
        res.status(200).json(camelizeKeys(precios));
    } catch (err) {
        next(err);
    }
});

router.post('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    const values: any = formatKeys(req.body);
    try {
        await knex.transaction(async trx => {
           const precioEnc =  (await trx('ListasPrecio').insert({ListaPrecioNombre: values.listaprecionombre}, '*'))[0];
           const items = values.items.map(item => ({
               ...formatKeys(item),
               ListaPrecioID: precioEnc.ListaPrecioID
           }))
            await trx('ListasPrecioDet').insert(items, '*');
        });

        res.status(200).json('Ok');
    } catch (err) {
        next(err);
    }
})

router.put('/:precio_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    const values: any = formatKeys(req.body);
    const precio_id = req.params.precio_id;
    try {
        await knex.transaction(async trx => {
            for (let i = 0; i < values.items.length; i++) {
                const v = values.items[i];

                if (v.lista_precio_det_id) {
                    const id = v.lista_precio_det_id;
                    const updateRow = formatKeys(v, 'lista_precio_det_id');
                    await knex('ListasPrecioDet').where({ListaPrecioDetID: id}).update(updateRow, '*');
                }
            }
        });

        res.status(200).json('Ok');
    } catch (err) {
        next(err);
    }
})

export default router;
