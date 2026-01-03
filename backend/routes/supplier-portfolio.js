/**
 * API Routes: Supplier Portfolio (Productos/Servicios)
 *
 * Gestiona el catálogo de productos y servicios del proveedor
 */

import express from 'express';
import { db, FieldValue } from '../config/firebase.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/suppliers/:id/products
 * Listar productos del portfolio
 */
router.get('/:id/products', async (req, res) => {
  try {
    const { id } = req.params;

    // Validar autenticación del proveedor
    const supplierId = req.headers['x-supplier-id'];
    if (!supplierId || supplierId !== id) {
      return res.status(403).json({ error: 'forbidden' });
    }

    const snapshot = await db
      .collection('suppliers')
      .doc(id)
      .collection('portfolio')
      .orderBy('createdAt', 'desc')
      .get();

    const products = [];
    snapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return res.json({
      success: true,
      products,
      total: products.length,
    });
  } catch (error) {
    logger.error('Error fetching portfolio:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * POST /api/suppliers/:id/products
 * Crear nuevo producto en el portfolio
 */
router.post('/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, basePrice, unit, features, isPackage, packageItems } =
      req.body;

    // Validar autenticación del proveedor
    const supplierId = req.headers['x-supplier-id'];
    if (!supplierId || supplierId !== id) {
      return res.status(403).json({ error: 'forbidden' });
    }

    // Validaciones
    if (!name || !basePrice) {
      return res.status(400).json({ error: 'name_and_price_required' });
    }

    const product = {
      name: name.trim(),
      description: description?.trim() || '',
      category: category || 'general',
      basePrice: Number(basePrice),
      unit: unit || 'servicio',
      features: Array.isArray(features) ? features : [],
      isPackage: isPackage || false,
      packageItems: isPackage ? packageItems || [] : [],
      active: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('suppliers').doc(id).collection('products').add(product);

    logger.info(`✅ Producto creado en portfolio: ${docRef.id} para proveedor ${id}`);

    return res.status(201).json({
      success: true,
      product: {
        id: docRef.id,
        ...product,
      },
      message: 'Producto agregado al portfolio',
    });
  } catch (error) {
    logger.error('Error creating portfolio product:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * PUT /api/suppliers/:id/products/:productId
 * Actualizar producto del portfolio
 */
router.put('/:id/products/:productId', async (req, res) => {
  try {
    const { id, productId } = req.params;
    const {
      name,
      description,
      category,
      basePrice,
      unit,
      features,
      isPackage,
      packageItems,
      active,
    } = req.body;

    // Validar autenticación del proveedor
    const supplierId = req.headers['x-supplier-id'];
    if (!supplierId || supplierId !== id) {
      return res.status(403).json({ error: 'forbidden' });
    }

    const productRef = db.collection('suppliers').doc(id).collection('products').doc(productId);

    const productDoc = await productRef.get();
    if (!productDoc.exists) {
      return res.status(404).json({ error: 'product_not_found' });
    }

    const updates = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (name) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (category) updates.category = category;
    if (basePrice !== undefined) updates.basePrice = Number(basePrice);
    if (unit) updates.unit = unit;
    if (features) updates.features = Array.isArray(features) ? features : [];
    if (isPackage !== undefined) updates.isPackage = isPackage;
    if (packageItems) updates.packageItems = packageItems;
    if (active !== undefined) updates.active = active;

    await productRef.update(updates);

    logger.info(`✅ Producto actualizado: ${productId} del proveedor ${id}`);

    return res.json({
      success: true,
      message: 'Producto actualizado',
    });
  } catch (error) {
    logger.error('Error updating portfolio product:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * DELETE /api/suppliers/:id/products/:productId
 * Eliminar producto del portfolio
 */
router.delete('/:id/products/:productId', async (req, res) => {
  try {
    const { id, productId } = req.params;

    // Validar autenticación del proveedor
    const supplierId = req.headers['x-supplier-id'];
    if (!supplierId || supplierId !== id) {
      return res.status(403).json({ error: 'forbidden' });
    }

    await db.collection('suppliers').doc(id).collection('portfolio').doc(productId).delete();

    logger.info(`✅ Producto eliminado: ${productId} del proveedor ${id}`);

    return res.json({
      success: true,
      message: 'Producto eliminado del portfolio',
    });
  } catch (error) {
    logger.error('Error deleting portfolio product:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

export default router;
