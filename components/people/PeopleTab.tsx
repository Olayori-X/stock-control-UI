'use client'

import { useEffect, useState } from 'react'
import { UserPlus } from 'lucide-react'
import type { Session } from '@/lib/auth'
import { addUser, getUsers, type AddUserInput, type GroupedUsers } from '@/lib/api'
import { AddUserForm } from './AddUserForm'
import { UsersList } from './UsersList'

const emptyForm: AddUserInput = { name: '', email: '', phone: '', password: '', role: 'sales' }

export function PeopleTab({ session }: { session: Session }) {
  const [form, setForm] = useState<AddUserInput>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  const [users, setUsers] = useState<GroupedUsers>({ admins: [], sales: [], distributors: [], supervisors: [] })
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [session])

  async function load() {
    setLoadingUsers(true)
    setUsersError(null)
    try {
      setUsers(await getUsers(session))
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoadingUsers(false)
    }
  }

  function updateForm<K extends keyof AddUserInput>(key: K, value: AddUserInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    setFormSuccess(null)
    try {
      await addUser(session, form)
      setFormSuccess(`${form.name} was added as ${form.role}.`)
      setForm(emptyForm)
      load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><UserPlus size={14} /> PEOPLE &amp; ROLES</div>
          <h1>Add a user</h1>
          <p>Create accounts for sales associates, distributors, or fellow admins.</p>
        </div>
      </div>
      <AddUserForm form={form} submitting={submitting} error={formError} success={formSuccess} onChange={updateForm} onSubmit={handleSubmit} />
      <UsersList loading={loadingUsers} error={usersError} users={users} />
    </div>
  )
}