'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Plus, Trash2, UserCheck, UserX } from 'lucide-react'
import { Badge, Card, Field, inputClass } from '@/components/admin/ui'
import { useToast } from '@/components/toast'
import { createAdminUser, deleteAdminUser, setAdminUserActive } from '@/lib/actions/admin'
import type { Profile } from '@/lib/types'
import { formatDate } from '@/lib/utils'

export function UsersManager({
  users,
  currentUserId,
}: {
  users: Profile[]
  currentUserId: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const toast = useToast()

  return (
    <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
      <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
        <header className="border-b border-ink-100 px-5 py-4">
          <h3 className="font-bold text-ink-900">
            {users.length} compte{users.length > 1 ? 's' : ''}
          </h3>
        </header>
        <ul>
          {users.map((user) => (
            <li
              key={user.id}
              className="flex flex-wrap items-center gap-3 border-b border-ink-50 px-5 py-4 last:border-0"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink-900 text-sm font-bold text-white">
                {(user.full_name ?? user.email).slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink-900">
                    {user.full_name ?? user.email}
                  </span>
                  {user.id === currentUserId && <Badge tone="brand">Vous</Badge>}
                  {!user.is_active && <Badge tone="muted">Désactivé</Badge>}
                </span>
                <span className="block truncate text-sm text-ink-400">{user.email}</span>
              </span>
              <span className="hidden text-xs text-ink-400 sm:block">
                depuis le {formatDate(user.created_at)}
              </span>

              {user.id !== currentUserId && (
                <span className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    disabled={pending}
                    title={user.is_active ? 'Désactiver' : 'Activer'}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await setAdminUserActive(user.id, !user.is_active)
                        const who = user.full_name ?? user.email
                        if (result.ok) {
                          toast.success(user.is_active ? 'Accès désactivé' : 'Accès rétabli', {
                            key: 'utilisateur',
                            description: user.is_active
                              ? `${who} ne peut plus se connecter au back-office.`
                              : `${who} peut de nouveau se connecter au back-office.`,
                          })
                        } else {
                          toast.error('Modification impossible', {
                            key: 'utilisateur',
                            description: result.error,
                          })
                        }
                        router.refresh()
                      })
                    }
                    className="grid size-9 place-items-center rounded-lg border border-ink-200 text-ink-500 hover:border-ink-400 hover:text-ink-900"
                  >
                    {user.is_active ? <UserX className="size-4" /> : <UserCheck className="size-4" />}
                  </button>
                  {confirmId === user.id ? (
                    <>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            const result = await deleteAdminUser(user.id)
                            if (result.ok) {
                              toast.success('Compte supprimé', {
                                key: 'utilisateur',
                                description: `${user.full_name ?? user.email} n’a plus accès au back-office.`,
                              })
                            } else {
                              toast.error('Suppression impossible', {
                                key: 'utilisateur',
                                description: result.error,
                              })
                            }
                            setConfirmId(null)
                            router.refresh()
                          })
                        }
                        className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white"
                      >
                        Confirmer
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        className="rounded-lg border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-600"
                      >
                        Annuler
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmId(user.id)}
                      title="Supprimer"
                      className="grid size-9 place-items-center rounded-lg border border-ink-200 text-ink-500 hover:border-brand-400 hover:text-brand-600"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <form
        action={(formData) => {
          const email = String(formData.get('email') ?? '')
          startTransition(async () => {
            const result = await createAdminUser(formData)
            if (result.ok) {
              toast.success('Compte administrateur créé', {
                key: 'utilisateur',
                duration: 9000,
                description: `${email} peut se connecter dès maintenant sur /admin/login.`,
              })
              router.refresh()
            } else {
              toast.error('Création impossible', { key: 'utilisateur', description: result.error })
            }
          })
        }}
        className="xl:sticky xl:top-24 xl:self-start"
      >
        <Card title="Ajouter un administrateur">
          <div className="space-y-4">
            <Field label="Nom complet">
              <input name="full_name" className={inputClass} />
            </Field>
            <Field label="Adresse e-mail *">
              <input name="email" type="email" required className={inputClass} />
            </Field>
            <Field label="Mot de passe *" hint="8 caractères minimum.">
              <input name="password" type="password" required minLength={8} className={inputClass} />
            </Field>

            <button
              type="submit"
              disabled={pending}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              <Plus className="size-4" />
              {pending ? 'Création…' : 'Créer le compte'}
            </button>
          </div>
        </Card>
      </form>
    </div>
  )
}
