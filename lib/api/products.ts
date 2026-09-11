import { authFetch, type Session } from '../auth'
import { unwrap } from './client'

export interface Product {
  sku: string
  name: string
  created_at: string
  updated_at: string
}

export interface AddProductInput {
  sku: string
  name: string
}

export interface EditProductInput {
  sku: string
  name: string
}

// admin + sales both hit GET /*/products — same handler either way.
export async function getProducts(session: Session): Promise<Product[]> {
  const path = session.role === 'admin' ? '/admin/products' : '/sales/products'
  const res = await authFetch(path, session)
  return unwrap<Product[]>(res)
}

export async function addProduct(session: Session, input: AddProductInput): Promise<Product> {
  const res = await authFetch('/admin/addproduct', session, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return unwrap<Product>(res)
}

export async function getProductBySKU(session: Session, sku: string): Promise<Product> {
  const path = `/admin/productbysku?sku=${encodeURIComponent(sku)}`
  const res = await authFetch(path, session)
  return unwrap<Product>(res)
}

export async function editProduct(session: Session, input: EditProductInput): Promise<Product> {
  const res = await authFetch('/admin/editproduct', session, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
  return unwrap<Product>(res)
}

export async function deleteProduct(session: Session, sku: string): Promise<void> {
  const res = await authFetch('/admin/deleteproduct', session, {
    method: 'DELETE',
    body: JSON.stringify({ sku }),
  })
  await unwrap(res)
}