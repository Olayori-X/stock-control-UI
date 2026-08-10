'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle, Bell, Boxes, Check, ChevronDown, CircleHelp,
  LayoutDashboard, LogOut, Menu, PackageCheck, Pencil, Plus, ReceiptText,
  Search, Settings2, ShieldCheck, Trash2, UserPlus, UsersRound, X,
} from 'lucide-react'
import { navigation, roles, type IconName } from '@/lib/mock-data'
import { clearSession, getSession, type Session } from '@/lib/auth'
import {
  addProduct, addUser, confirmPickupRequest, createPickupRequest, deleteProduct, editProduct,
  getPendingPickupRequests, getProducts, getUnacceptedPickupRequests, getUsers, searchDistributors,
  type AddUserInput, type DistributorSearchResult, type GroupedUsers, type PickupRequest, type Product, type Role,
} from '@/lib/api'

const iconMap: Record<IconName, typeof LayoutDashboard> = { LayoutDashboard, PackageCheck, Boxes, ReceiptText, UsersRound }

// Which sidebar sections each role can see. Distributor never reaches this —
// they get a dedicated single-purpose view below, no sidebar at all.
// Admins do not create pickups, so 'Pickups' is sales-only.
const navByRole: Record<Role, string[]> = {
  admin: ['Inventory', 'People & roles'],
  sales: ['Pickups', 'Inventory'],
  distributor: [],
}

const emptyUserForm: AddUserInput = { name: '', email: '', phone: '', password: '', role: 'sales' }
const roleOptions: { value: Role; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'sales', label: 'Sales associate' },
  { value: 'distributor', label: 'Distributor' },
]

function Status({ value }: { value: string }) {
  const tone = value === 'Completed' || value === 'Confirmed' ? 'success' : value === 'Overdue' || value === 'Awaiting payment' ? 'danger' : 'warning'
  return <span className={`status status-${tone}`}><span className="status-dot" />{value}</span>
}

// ── New pickup modal: search a distributor, pick products, submit ──
// ── New pickup modal: search a distributor, pick products, submit ──
function NewPickupModal({
  session,
  onClose,
  onCreated,
}: {
  session: Session
  onClose: () => void
  onCreated: (req: PickupRequest) => void
}) {
  const [distributorQuery, setDistributorQuery] = useState('')
  const [distributorResults, setDistributorResults] = useState<DistributorSearchResult[]>([])
  const [searchingDistributors, setSearchingDistributors] = useState(false)
  const [selectedDistributor, setSelectedDistributor] = useState<DistributorSearchResult | null>(null)

  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [productsError, setProductsError] = useState<string | null>(null)
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Load the product catalog once, on open.
  useEffect(() => {
    let cancelled = false
    setLoadingProducts(true)
    getProducts(session)
      .then((result) => { if (!cancelled) setProducts(result ?? []) })
      .catch((err) => { if (!cancelled) setProductsError(err instanceof Error ? err.message : 'Failed to load products') })
      .finally(() => { if (!cancelled) setLoadingProducts(false) })
    return () => { cancelled = true }
  }, [session])

  // Debounced distributor search — skips empty queries, cancels stale requests.
  useEffect(() => {
    if (selectedDistributor) return
    if (distributorQuery.trim().length === 0) {
      setDistributorResults([])
      return
    }
    let cancelled = false
    setSearchingDistributors(true)
    const timeout = setTimeout(() => {
      searchDistributors(session, distributorQuery)
        .then((results) => { if (!cancelled) setDistributorResults(results) })
        .catch(() => { if (!cancelled) setDistributorResults([]) })
        .finally(() => { if (!cancelled) setSearchingDistributors(false) })
    }, 300)
    return () => { cancelled = true; clearTimeout(timeout) }
  }, [distributorQuery, selectedDistributor, session])

  function selectDistributor(d: DistributorSearchResult) {
    setSelectedDistributor(d)
    setDistributorQuery(d.name)
    setDistributorResults([])
  }

  function clearDistributor() {
    setSelectedDistributor(null)
    setDistributorQuery('')
  }

  function setQuantity(sku: string, value: number) {
    setQuantities((prev) => ({ ...prev, [sku]: Math.max(0, value) }))
  }

  const selectedProducts = products
    .filter((p) => (quantities[p.sku] ?? 0) > 0)
    .map((p) => ({ sku: p.sku, name: p.name, quantity: quantities[p.sku] }))

  async function handleSubmit() {
    setFormError(null)
    if (!selectedDistributor) {
      setFormError('Select a distributor for this pickup.')
      return
    }
    if (selectedProducts.length === 0) {
      setFormError('Add at least one product with a quantity.')
      return
    }
    setSubmitting(true)
    try {
      const created = await createPickupRequest(session, {
        distributor_id: selectedDistributor.user_id,
        products: selectedProducts,
      })
      onCreated(created)
      onClose()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create pickup request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="pickup-title">
        <div className="modal-heading">
          <div><span className="eyebrow">NEW WORKFLOW</span><h2 id="pickup-title">Create a new pickup</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        </div>

        <div className="form-grid">
          <div>
            <label htmlFor="distributor-search" style={{ display: 'block', marginBottom: 4 }}>Distributor</label>
            {selectedDistributor ? (
              <div className="table-search">
                <span style={{ flex: 1 }}>{selectedDistributor.name} — {selectedDistributor.email}</span>
                <button type="button" className="icon-button" onClick={clearDistributor} aria-label="Change distributor"><X size={14} /></button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <input
                  id="distributor-search"
                  value={distributorQuery}
                  onChange={(e) => setDistributorQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  autoComplete="off"
                />
                {searchingDistributors && <p className="muted-cell">Searching…</p>}
                {!searchingDistributors && distributorResults.length > 0 && (
                  <div className="table-wrap" style={{ marginTop: 6 }}>
                    <table>
                      <tbody>
                        {distributorResults.map((d) => (
                          <tr key={d.user_id} onClick={() => selectDistributor(d)} style={{ cursor: 'pointer' }}>
                            <td><strong>{d.name}</strong><span>{d.email}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {!searchingDistributors && distributorQuery.trim().length > 0 && distributorResults.length === 0 && (
                  <p className="muted-cell">No distributors found.</p>
                )}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>Products</label>
            {loadingProducts && <p className="muted-cell">Loading products…</p>}
            {!loadingProducts && productsError && <p className="muted-cell">{productsError}</p>}
            {!loadingProducts && !productsError && products.length === 0 && <p className="muted-cell">No products available.</p>}
            {!loadingProducts && !productsError && products.length > 0 && (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>SKU</th><th>Name</th><th>Qty</th></tr></thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.sku}>
                        <td><strong>{p.sku}</strong></td>
                        <td>{p.name}</td>
                        <td>
                          <input
                            type="number"
                            min={0}
                            value={quantities[p.sku] ?? 0}
                            onChange={(e) => setQuantity(p.sku, parseInt(e.target.value, 10) || 0)}
                            style={{ width: 64 }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {formError && <div className="empty-state"><AlertTriangle size={18} /><p>{formError}</p></div>}
        </div>

        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating…' : <><Check size={16} /> Create pickup</>}
          </button>
        </div>
      </section>
    </div>
  )
}

export default function Page() {
  const router = useRouter()
  const [session, setSessionState] = useState<Session | null | undefined>(undefined)
  const [activeNav, setActiveNav] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showPickup, setShowPickup] = useState(false)

  useEffect(() => {
    const existing = getSession()
    if (!existing) {
      router.replace('/login')
      return
    }
    setSessionState(existing)
  }, [router])

  const role = session?.role ?? 'admin'
  const currentNav = navByRole[role].includes(activeNav) ? activeNav : navByRole[role][0]

  // ── Pickup requests: sales' own requests, distributor's pending queue ──
  const [pickupRequests, setPickupRequests] = useState<PickupRequest[]>([])
  const [loadingPickups, setLoadingPickups] = useState(false)
  const [pickupError, setPickupError] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const counterpartLabel = role === 'distributor' ? 'Sales associate' : 'Distributor'

  useEffect(() => {
    if (!session || session.role === 'admin') return
    loadPickups(session)
  }, [session])

  async function loadPickups(s: Session) {
    setLoadingPickups(true)
    setPickupError(null)
    const fetcher = s.role === 'sales' ? getUnacceptedPickupRequests : getPendingPickupRequests
    try {
      const result = await fetcher(s)
      setPickupRequests(result ?? [])
    } catch (err) {
      setPickupError(err instanceof Error ? err.message : 'Failed to load pickups')
    } finally {
      setLoadingPickups(false)
    }
  }

  async function handleConfirm(requestId: string) {
    if (!session) return
    setConfirmingId(requestId)
    try {
      await confirmPickupRequest(session, requestId)
      setPickupRequests((prev) => prev.map((r) => (r.request_id === requestId ? { ...r, confirmed: true } : r)))
    } catch (err) {
      setPickupError(err instanceof Error ? err.message : 'Failed to confirm request')
    } finally {
      setConfirmingId(null)
    }
  }

  // A request the sales associate just created is, by definition, unaccepted —
  // prepend it locally instead of re-fetching the whole list.
  function handlePickupCreated(req: PickupRequest) {
    setPickupRequests((prev) => [req, ...prev])
  }

  // ── Products (Inventory tab — admin: full CRUD, sales: read only) ──
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [productsError, setProductsError] = useState<string | null>(null)
  const [productQuery, setProductQuery] = useState('')
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [newSku, setNewSku] = useState('')
  const [newProductName, setNewProductName] = useState('')
  const [savingProduct, setSavingProduct] = useState(false)
  const [productFormError, setProductFormError] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editProductName, setEditProductName] = useState('')
  const [deletingSku, setDeletingSku] = useState<string | null>(null)

  useEffect(() => {
    if (!session || currentNav !== 'Inventory') return
    loadProducts(session)
  }, [session, currentNav])

  async function loadProducts(s: Session) {
    setLoadingProducts(true)
    setProductsError(null)
    try {
      const result = await getProducts(s)
      setProducts(result ?? [])
    } catch (err) {
      setProductsError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setLoadingProducts(false)
    }
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!session) return
    setSavingProduct(true)
    setProductFormError(null)
    try {
      const created = await addProduct(session, { sku: newSku, name: newProductName })
      setProducts((prev) => [...prev, created])
      setNewSku('')
      setNewProductName('')
      setShowAddProduct(false)
    } catch (err) {
      setProductFormError(err instanceof Error ? err.message : 'Failed to add product')
    } finally {
      setSavingProduct(false)
    }
  }

  function openEditProduct(product: Product) {
    setEditingProduct(product)
    setEditProductName(product.name)
  }

  async function handleEditProductSave() {
    if (!session || !editingProduct) return
    setSavingProduct(true)
    setProductFormError(null)
    try {
      const updated = await editProduct(session, { sku: editingProduct.sku, name: editProductName })
      setProducts((prev) => prev.map((p) => (p.sku === updated.sku ? updated : p)))
      setEditingProduct(null)
    } catch (err) {
      setProductFormError(err instanceof Error ? err.message : 'Failed to update product')
    } finally {
      setSavingProduct(false)
    }
  }

  async function handleDeleteProduct(sku: string) {
    if (!session) return
    setDeletingSku(sku)
    setProductsError(null)
    try {
      await deleteProduct(session, sku)
      setProducts((prev) => prev.filter((p) => p.sku !== sku))
    } catch (err) {
      setProductsError(err instanceof Error ? err.message : 'Failed to delete product')
    } finally {
      setDeletingSku(null)
    }
  }

  // ── People & roles (admin only — create accounts via /admin/signup, list via /admin/users) ──
  const [userForm, setUserForm] = useState<AddUserInput>(emptyUserForm)
  const [submittingUser, setSubmittingUser] = useState(false)
  const [userFormError, setUserFormError] = useState<string | null>(null)
  const [userFormSuccess, setUserFormSuccess] = useState<string | null>(null)

  const [groupedUsers, setGroupedUsers] = useState<GroupedUsers>({ admins: [], sales: [], distributors: [] })
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)

  useEffect(() => {
    if (!session || role !== 'admin' || currentNav !== 'People & roles') return
    loadUsers(session)
  }, [session, role, currentNav])

  async function loadUsers(s: Session) {
    setLoadingUsers(true)
    setUsersError(null)
    try {
      setGroupedUsers(await getUsers(s))
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoadingUsers(false)
    }
  }

  function updateUserForm<K extends keyof AddUserInput>(key: K, value: AddUserInput[K]) {
    setUserForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault()
    if (!session) return
    setSubmittingUser(true)
    setUserFormError(null)
    setUserFormSuccess(null)
    try {
      await addUser(session, userForm)
      setUserFormSuccess(`${userForm.name} was added as ${userForm.role}.`)
      setUserForm(emptyUserForm)
      loadUsers(session)
    } catch (err) {
      setUserFormError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setSubmittingUser(false)
    }
  }

  function handleLogout() {
    clearSession()
    router.push('/login')
  }

  if (!session) return null

  // ── Distributor: single dedicated view, no sidebar, nothing else ──
  if (role === 'distributor') {
    const pending = pickupRequests.filter((r) => !r.confirmed)
    return (
      <main className="app-shell">
        <section className="main-panel" style={{ marginLeft: 0, width: '100%' }}>
          <header className="topbar">
            <div className="breadcrumb"><Boxes size={18} /><span>Stockwise</span><span>/</span><strong>Pickup requests</strong></div>
            <div className="top-actions">
              <button className="icon-button" onClick={handleLogout} aria-label="Log out" title="Log out"><LogOut size={17} /></button>
            </div>
          </header>
          <div className="content">
            <div className="page-heading">
              <div>
                <div className="eyebrow"><PackageCheck size={14} /> DISTRIBUTOR PORTAL</div>
                <h1>Pending pickup requests</h1>
                <p>Review incoming requests from sales associates and confirm the ones you can fulfill.</p>
              </div>
            </div>
            <section className="panel activity-panel">
              {loadingPickups && <div className="empty-state"><p>Loading…</p></div>}
              {!loadingPickups && pickupError && <div className="empty-state"><AlertTriangle size={18} /><strong>Couldn&apos;t load requests</strong><p>{pickupError}</p></div>}
              {!loadingPickups && !pickupError && pending.length === 0 && <div className="empty-state"><Check size={18} /><strong>You&apos;re all caught up</strong><p>New pickup requests will appear here.</p></div>}
              {!loadingPickups && !pickupError && pending.length > 0 && (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Request ID</th><th>Sales associate</th><th>Items</th><th>Status</th><th>Created</th><th /></tr></thead>
                    <tbody>
                      {pending.map((req) => (
                        <tr key={req.request_id}>
                          <td><strong>{req.request_id.slice(0, 8)}</strong></td>
                          <td>{req.sales_associate_name}</td>
                          <td>{req.products.length} item{req.products.length === 1 ? '' : 's'}</td>
                          <td><Status value={req.confirmed ? 'Confirmed' : 'Pending'} /></td>
                          <td className="muted-cell">{new Date(req.created_at).toLocaleString()}</td>
                          <td>
                            <button className="text-button" onClick={() => handleConfirm(req.request_id)} disabled={confirmingId === req.request_id}>
                              {confirmingId === req.request_id ? 'Confirming…' : 'Confirm'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
    )
  }

  // ── Admin & sales: full shell, sections switched via sidebar ──
  const visibleNav = navigation.filter((item) => navByRole[role].includes(item.label))
  const filteredProducts = products.filter(
    (p) => p.sku.toLowerCase().includes(productQuery.toLowerCase()) || p.name.toLowerCase().includes(productQuery.toLowerCase())
  )

  return <main className="app-shell">
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Boxes size={20} /></div><span>Stockwise</span><button className="icon-button mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button></div>
      <div className="workspace"><div className="workspace-avatar">N</div><div><strong>Northstar HQ</strong><span>Operations workspace</span></div><ChevronDown size={15} /></div>
      <nav className="nav-list" aria-label="Primary navigation">
        {visibleNav.map((item) => {
          const Icon = iconMap[item.icon as IconName]
          return (
            <button key={item.label} className={currentNav === item.label ? 'nav-item active' : 'nav-item'} onClick={() => { setActiveNav(item.label); setMobileOpen(false) }}>
              <Icon size={18} /><span>{item.label}</span>
            </button>
          )
        })}
      </nav>
      <div className="sidebar-bottom"><button className="nav-item"><Settings2 size={18} /><span>Settings</span></button><div className="help-card"><CircleHelp size={18} /><div><strong>Need a hand?</strong><span>Visit the help center</span></div></div><div className="user-row"><div className="user-avatar">{session.userId.slice(0, 2).toUpperCase()}</div><div><strong>{session.userId}</strong><span>{roles[role].label}</span></div><ChevronDown size={15} /></div></div>
    </aside>
    {mobileOpen && <button className="backdrop" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
    <section className="main-panel">
      <header className="topbar"><button className="icon-button menu-trigger" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20} /></button><div className="breadcrumb"><span>Workspace</span><span>/</span><strong>{currentNav}</strong></div><div className="top-actions"><label className="search-box"><Search size={17} /><input placeholder="Search anything..." aria-label="Search anything" /><kbd>⌘ K</kbd></label><button className="icon-button notification" aria-label="Notifications"><Bell size={18} /><i /></button><div className="role-switcher"><ShieldCheck size={16} /><span>{roles[role].label}</span></div><button className="icon-button" onClick={handleLogout} aria-label="Log out" title="Log out"><LogOut size={17} /></button></div></header>

      {currentNav === 'Pickups' && role === 'sales' && (
        <div className="content">
          <div className="page-heading">
            <div><div className="eyebrow"><PackageCheck size={14} /> PICKUPS</div><h1>Your pickup requests</h1><p>Requests you have sent, awaiting distributor confirmation.</p></div>
            <button className="primary-button" onClick={() => setShowPickup(true)}><Plus size={17} /> New pickup</button>
          </div>
          <section className="panel activity-panel">
            {loadingPickups && <div className="empty-state"><p>Loading…</p></div>}
            {!loadingPickups && pickupError && <div className="empty-state"><AlertTriangle size={18} /><strong>Couldn&apos;t load requests</strong><p>{pickupError}</p></div>}
            {!loadingPickups && !pickupError && pickupRequests.length === 0 && <div className="empty-state"><Check size={18} /><strong>You&apos;re all caught up</strong><p>New activity will appear here when it&apos;s ready.</p></div>}
            {!loadingPickups && !pickupError && pickupRequests.length > 0 && (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Request ID</th><th>{counterpartLabel}</th><th>Items</th><th>Status</th><th>Created</th></tr></thead>
                  <tbody>{pickupRequests.map((req) => <tr key={req.request_id}><td><strong>{req.request_id.slice(0, 8)}</strong></td><td>{req.sales_associate_name}</td><td>{req.products.length} item{req.products.length === 1 ? '' : 's'}</td><td><Status value={req.confirmed ? 'Confirmed' : 'Pending'} /></td><td className="muted-cell">{new Date(req.created_at).toLocaleString()}</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {currentNav === 'Inventory' && (
        <div className="content">
          <div className="page-heading">
            <div><div className="eyebrow"><Boxes size={14} /> INVENTORY</div><h1>Products</h1><p>{role === 'admin' ? 'Add, edit, or remove SKUs available to sales associates.' : 'Browse available SKUs for building pickup requests.'}</p></div>
            {role === 'admin' && <button className="primary-button" onClick={() => setShowAddProduct(true)}><Plus size={17} /> New product</button>}
          </div>
          <section className="panel activity-panel">
            <div className="filter-row"><div className="table-search"><Search size={15} /><input value={productQuery} onChange={(e) => setProductQuery(e.target.value)} placeholder="Search by SKU or name..." /></div></div>
            {loadingProducts && <div className="empty-state"><p>Loading…</p></div>}
            {!loadingProducts && productsError && <div className="empty-state"><AlertTriangle size={18} /><strong>Couldn&apos;t load products</strong><p>{productsError}</p></div>}
            {!loadingProducts && !productsError && filteredProducts.length === 0 && <div className="empty-state"><Check size={18} /><strong>No products found</strong><p>{role === 'admin' ? 'Add one to get started.' : 'Check back once inventory is added.'}</p></div>}
            {!loadingProducts && !productsError && filteredProducts.length > 0 && (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>SKU</th><th>Name</th><th>Updated</th>{role === 'admin' && <th />}</tr></thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.sku}>
                        <td><strong>{product.sku}</strong></td>
                        <td>{product.name}</td>
                        <td className="muted-cell">{new Date(product.updated_at).toLocaleString()}</td>
                        {role === 'admin' && (
                          <td>
                            <button className="icon-button" onClick={() => openEditProduct(product)} aria-label={`Edit ${product.sku}`}><Pencil size={15} /></button>
                            <button className="icon-button" onClick={() => handleDeleteProduct(product.sku)} disabled={deletingSku === product.sku} aria-label={`Delete ${product.sku}`}><Trash2 size={15} /></button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {currentNav === 'People & roles' && role === 'admin' && (
        <div className="content">
          <div className="page-heading"><div><div className="eyebrow"><UserPlus size={14} /> PEOPLE &amp; ROLES</div><h1>Add a user</h1><p>Create accounts for sales associates, distributors, or fellow admins.</p></div></div>
          <section className="panel" style={{ maxWidth: 520 }}>
            <form onSubmit={handleAddUser} className="form-grid">
              <label>Full name<input required value={userForm.name} onChange={(e) => updateUserForm('name', e.target.value)} placeholder="e.g. Ada Obi" /></label>
              <label>Email<input required type="email" value={userForm.email} onChange={(e) => updateUserForm('email', e.target.value)} placeholder="ada@example.com" /></label>
              <label>Phone<input required value={userForm.phone} onChange={(e) => updateUserForm('phone', e.target.value)} placeholder="+2348012345678" /></label>
              <label>Temporary password<input required type="password" value={userForm.password} onChange={(e) => updateUserForm('password', e.target.value)} placeholder="Set an initial password" /></label>
              <label>Role<select value={userForm.role} onChange={(e) => updateUserForm('role', e.target.value as Role)}>{roleOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></label>
              {userFormError && <div className="empty-state"><AlertTriangle size={18} /><strong>Couldn&apos;t add user</strong><p>{userFormError}</p></div>}
              {userFormSuccess && <div className="empty-state"><Check size={18} /><strong>User added</strong><p>{userFormSuccess}</p></div>}
              <div className="modal-actions"><button type="submit" className="primary-button" disabled={submittingUser}>{submittingUser ? 'Adding…' : <><UserPlus size={16} /> Add user</>}</button></div>
            </form>
          </section>

          <section className="panel activity-panel" style={{ marginTop: 24 }}>
            <div className="panel-heading"><div><h2>Existing users</h2><p>Grouped by role.</p></div></div>
            {loadingUsers && <div className="empty-state"><p>Loading…</p></div>}
            {!loadingUsers && usersError && <div className="empty-state"><AlertTriangle size={18} /><strong>Couldn&apos;t load users</strong><p>{usersError}</p></div>}
            {!loadingUsers && !usersError && (
              <>
                {([
                  ['Admins', groupedUsers.admins],
                  ['Sales associates', groupedUsers.sales],
                  ['Distributors', groupedUsers.distributors],
                ] as const).map(([label, list]) => (
                  <div key={label} style={{ marginBottom: 20 }}>
                    <h3 style={{ margin: '12px 0 8px' }}>{label} ({list.length})</h3>
                    {list.length === 0 ? (
                      <p className="muted-cell">None yet.</p>
                    ) : (
                      <div className="table-wrap">
                        <table>
                          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th></tr></thead>
                          <tbody>
                            {list.map((u) => (
                              <tr key={u.user_id}>
                                <td><strong>{u.name}</strong></td>
                                <td>{u.email}</td>
                                <td>{u.phone}</td>
                                <td><Status value={u.verified ? 'Confirmed' : 'Pending'} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </section>
        </div>
      )}
    </section>

    {showPickup && role === 'sales' && (
      <NewPickupModal session={session} onClose={() => setShowPickup(false)} onCreated={handlePickupCreated} />
    )}

    {showAddProduct && role === 'admin' && (
      <div className="modal-backdrop" role="presentation">
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="add-product-title">
          <div className="modal-heading"><div><span className="eyebrow">NEW PRODUCT</span><h2 id="add-product-title">Add a product</h2></div><button className="icon-button" onClick={() => setShowAddProduct(false)} aria-label="Close dialog"><X size={18} /></button></div>
          <form onSubmit={handleAddProduct} className="form-grid">
            <label>SKU<input required value={newSku} onChange={(e) => setNewSku(e.target.value)} placeholder="e.g. SKU-1042" /></label>
            <label>Name<input required value={newProductName} onChange={(e) => setNewProductName(e.target.value)} placeholder="e.g. Stainless Water Bottle" /></label>
            {productFormError && <div className="empty-state"><AlertTriangle size={18} /><p>{productFormError}</p></div>}
            <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowAddProduct(false)}>Cancel</button><button type="submit" className="primary-button" disabled={savingProduct}>{savingProduct ? 'Adding…' : 'Add product'}</button></div>
          </form>
        </section>
      </div>
    )}

    {editingProduct && role === 'admin' && (
      <div className="modal-backdrop" role="presentation">
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-product-title">
          <div className="modal-heading"><div><span className="eyebrow">{editingProduct.sku}</span><h2 id="edit-product-title">Edit product</h2></div><button className="icon-button" onClick={() => setEditingProduct(null)} aria-label="Close dialog"><X size={18} /></button></div>
          <div className="form-grid">
            <label>Name<input value={editProductName} onChange={(e) => setEditProductName(e.target.value)} /></label>
            {productFormError && <div className="empty-state"><AlertTriangle size={18} /><p>{productFormError}</p></div>}
          </div>
          <div className="modal-actions"><button className="secondary-button" onClick={() => setEditingProduct(null)}>Cancel</button><button className="primary-button" onClick={handleEditProductSave} disabled={savingProduct}>{savingProduct ? 'Saving…' : 'Save changes'}</button></div>
        </section>
      </div>
    )}
  </main>
}