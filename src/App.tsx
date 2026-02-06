import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { Session, User } from '@supabase/supabase-js'

import './App.css'
import { supabase } from './util/supabaseClient'

type TransactionAuthor = {
  id: string
  email: string | null
}

type Transaction = {
  id: string
  description: string
  amount: number
  category: string
  date: string
  household_id: string
  created_by: string | null
  author: TransactionAuthor | null
}

type Language = 'ua' | 'en'
type Theme = 'light' | 'dark'
type Currency = 'UAH' | 'USD' | 'EUR'

type Profile = {
  id: string
  email: string | null
  default_household_id: string | null
}

type HouseholdMembership = {
  household_id: string
  role: 'owner' | 'member'
  households: {
    id: string
    name: string
  } | null
}

type HouseholdMember = {
  profile_id: string
  role: 'owner' | 'member'
  profiles: {
    id: string
    email: string | null
  } | null
}

type HouseholdMembershipRow = {
  household_id: string
  role: 'owner' | 'member'
  households:
    | {
        id: string
        name: string
      }
    | {
        id: string
        name: string
      }[]
    | null
}

type HouseholdMemberRow = {
  profile_id: string
  role: 'owner' | 'member'
  profiles:
    | {
        id: string
        email: string | null
      }
    | {
        id: string
        email: string | null
      }[]
    | null
}

const categories = [
  { id: 'housing', color: '#a78bfa', labels: { ua: 'Житло', en: 'Housing' } },
  { id: 'food', color: '#fb7185', labels: { ua: 'Продукти', en: 'Groceries' } },
  { id: 'transport', color: '#34d399', labels: { ua: 'Транспорт', en: 'Transportation' } },
  { id: 'fun', color: '#fcd34d', labels: { ua: 'Розваги', en: 'Entertainment' } },
  { id: 'health', color: '#60a5fa', labels: { ua: 'Здоровʼя', en: 'Health' } },
  { id: 'utilities', color: '#f472b6', labels: { ua: 'Комуналка', en: 'Utilities' } },
  { id: 'other', color: '#f97316', labels: { ua: 'Інше', en: 'Other' } },
]

const translations = {
  ua: {
    heroEyebrow: 'Фінансовий компас',
    heroTitle: 'Відстежуйте, куди зникають гроші',
    heroSubtitle: 'Додавайте витрати, розподіляйте їх за категоріями та відразу бачте важливі тренди.',
    spentLabel: 'Витрачено',
    expenseCount: (count: number) => `${count} зафіксованих витрат`,
    addTransaction: 'Додати витрату',
    addTransactionHint: 'Запишіть витрату за кілька секунд.',
    descriptionLabel: 'Опис',
    amountLabel: 'Сума',
    categoryLabel: 'Категорія',
    dateLabel: 'Дата',
    descriptionPlaceholder: 'Кава з друзями',
    submitButton: 'Зберегти витрату',
    saveError: 'Не вдалося зберегти витрату. Спробуйте ще раз.',
    analyticsTitle: 'Аналітика',
    analyticsSubtitle: 'Зрозумійте витрати одним поглядом.',
    totalSpentLabel: 'Загальна сума',
    totalSpentHint: 'У всіх категоріях',
    averageTransactionLabel: 'Середня витрата',
    averageTransactionHint: (count: number) => (count ? `${count} записів` : 'Записів поки немає'),
    topCategoryLabel: 'Найбільша категорія',
    topCategoryHint: (amount: string, count: number) => `${amount} у ${count} витратах`,
    topCategoryEmpty: 'Додайте першу витрату',
    monthlyTrendTitle: 'Щомісячні витрати',
    monthlyTrendEmpty: 'Даних поки немає',
    transactionsTitle: 'Витрати',
    transactionsSubtitle: 'Фільтруйте категорії, щоб бачити потрібні витрати.',
    transactionAuthor: (author: string) => `Додав(ла): ${author}`,
    transactionAuthorUnknown: 'невідомо',
    transactionsLoading: 'Завантаження витрат...',
    transactionsError: 'Не вдалося завантажити витрати. Спробуйте ще раз.',
    retryLabel: 'Спробувати ще раз',
    filterAll: 'Усе',
    transactionEmpty: 'У цій категорії ще немає витрат.',
    breakdownTitle: 'Структура категорій',
    breakdownSubtitle: 'Подивіться, що забирає найбільше коштів.',
    categoryTransactions: (count: number) => `${count} витрат`,
    monthlyAmount: (value: string) => value,
    languageLabel: 'Мова',
    currencyLabel: 'Валюта',
    themeLabel: 'Тема',
    themeLight: 'День',
    themeDark: 'Ніч',
    authTitle: 'Увійдіть, щоб почати',
    authSubtitle: 'Надішлемо магічне посилання на пошту. Жодних паролів.',
    authEmailLabel: 'Ел. пошта',
    authEmailPlaceholder: 'you@example.com',
    authSendLink: 'Надіслати посилання',
    authSent: 'Перевірте пошту — посилання вже там.',
    authSendError: 'Не вдалося надіслати посилання. Спробуйте знову.',
    authInviteNotice: 'Вас запросили до бюджету. Авторизуйтеся, щоб приєднатися.',
    authMethodMagic: 'Магічне посилання',
    authMethodPassword: 'Пошта + пароль',
    authPasswordLabel: 'Пароль',
    authPasswordPlaceholder: 'Вигадайте пароль',
    authPasswordModeSignIn: 'У мене вже є пароль',
    authPasswordModeSignUp: 'Створити акаунт',
    authPasswordSubmitSignIn: 'Увійти',
    authPasswordSubmitSignUp: 'Створити акаунт',
    authPasswordHintSignIn: 'Введіть пошту та пароль, які ви вже використовуєте.',
    authPasswordHintSignUp: 'Створіть пароль мінімум з 6 символів і підтвердьте пошту.',
    authPasswordRequirement: 'Пароль має містити щонайменше 6 символів.',
    authPasswordSignInSuccess: 'Входимо у ваш обліковий запис...',
    authPasswordSignUpSuccess: 'Готово! Перевірте пошту, щоб підтвердити акаунт.',
    authPasswordError: 'Не вдалося обробити пошту чи пароль. Спробуйте ще раз.',
    authProcessing: 'Опрацьовуємо...',
    signOut: 'Вийти',
    householdLabel: 'Домогосподарство',
    householdTitle: 'Сімейний доступ',
    householdSubtitle: 'Керуйте, хто бачить бюджет.',
    householdEmpty: 'Домогосподарство ще не створене.',
    membersTitle: 'Учасники',
    memberRoleOwner: 'Власник',
    memberRoleMember: 'Учасник',
    membersEmpty: 'Ще ніхто не приєднався.',
    inviteTitle: 'Запросити члена сімʼї',
    inviteSubtitle: 'Згенеруйте посилання для дружини чи партнера.',
    inviteEmailLabel: 'Ел. пошта партнера',
    inviteEmailPlaceholder: 'partner@example.com',
    inviteButton: 'Створити посилання',
    inviteSuccess: 'Посилання створено! Поділіться ним у будь-якому месенджері.',
    inviteError: 'Не вдалося створити запрошення. Спробуйте ще раз.',
    inviteLinkLabel: 'Посилання на приєднання',
    inviteCopy: 'Скопіювати',
    inviteCopySuccess: 'Посилання скопійовано!',
    inviteCopyError: 'Не вдалося скопіювати посилання.',
    acceptingInvite: 'Додаємо вас до сімейного бюджету...',
    inviteAccepted: 'Готово! Ви приєдналися до бюджету.',
    inviteFailed: 'Не вдалося прийняти запрошення. Перевірте, чи воно ще активне.',
    accountLoading: 'Готуємо ваш профіль та домогосподарство...',
    accountError: 'Не вдалося налаштувати профіль. Оновіть сторінку або спробуйте ще раз.',
  },
  en: {
    heroEyebrow: 'Budget Compass',
    heroTitle: 'Track where your money goes',
    heroSubtitle: 'Add expenses, categorize them, and spot trends instantly.',
    spentLabel: 'Spent so far',
    expenseCount: (count: number) => `${count} tracked expenses`,
    addTransaction: 'Add expense',
    addTransactionHint: 'Log a new expense in seconds.',
    descriptionLabel: 'Description',
    amountLabel: 'Amount',
    categoryLabel: 'Category',
    dateLabel: 'Date',
    descriptionPlaceholder: 'Coffee with friends',
    submitButton: 'Save expense',
    saveError: 'Failed to save the expense. Please try again.',
    analyticsTitle: 'Insights',
    analyticsSubtitle: 'Understand your spending at a glance.',
    totalSpentLabel: 'Total spent',
    totalSpentHint: 'Across all categories',
    averageTransactionLabel: 'Average expense',
    averageTransactionHint: (count: number) => (count ? `${count} records` : 'No records yet'),
    topCategoryLabel: 'Top category',
    topCategoryHint: (amount: string, count: number) => `${amount} in ${count} expenses`,
    topCategoryEmpty: 'Add your first expense',
    monthlyTrendTitle: 'Monthly spending',
    monthlyTrendEmpty: 'No data yet',
    transactionsTitle: 'Expenses',
    transactionsSubtitle: 'Use categories to focus on specific spending.',
    transactionAuthor: (author: string) => `Added by ${author}`,
    transactionAuthorUnknown: 'unknown',
    transactionsLoading: 'Loading expenses...',
    transactionsError: 'We could not load your expenses. Please try again.',
    retryLabel: 'Retry',
    filterAll: 'All',
    transactionEmpty: 'No expenses in this category yet.',
    breakdownTitle: 'Category breakdown',
    breakdownSubtitle: 'See which areas absorb most spending.',
    categoryTransactions: (count: number) => `${count} transactions`,
    monthlyAmount: (value: string) => value,
    languageLabel: 'Language',
    currencyLabel: 'Currency',
    themeLabel: 'Theme',
    themeLight: 'Day',
    themeDark: 'Night',
    authTitle: 'Sign in to start',
    authSubtitle: 'We will email you a magic link. No passwords required.',
    authEmailLabel: 'Email',
    authEmailPlaceholder: 'you@example.com',
    authSendLink: 'Send magic link',
    authSent: 'Check your inbox — the link is on its way.',
    authSendError: 'We could not send the link. Try again.',
    authInviteNotice: 'Got an invite? Sign in to join the family budget.',
    authMethodMagic: 'Magic link',
    authMethodPassword: 'Email + password',
    authPasswordLabel: 'Password',
    authPasswordPlaceholder: 'Enter password',
    authPasswordModeSignIn: 'I already have a password',
    authPasswordModeSignUp: 'Create account',
    authPasswordSubmitSignIn: 'Sign in',
    authPasswordSubmitSignUp: 'Create account',
    authPasswordHintSignIn: 'Enter the email and password you use for this app.',
    authPasswordHintSignUp: 'Create a password with at least 6 characters and confirm via email.',
    authPasswordRequirement: 'Password must be at least 6 characters long.',
    authPasswordSignInSuccess: 'Signed in. Redirecting you...',
    authPasswordSignUpSuccess: 'Account created! Check your inbox to confirm.',
    authPasswordError: 'We could not process that email/password. Please try again.',
    authProcessing: 'Working...',
    signOut: 'Sign out',
    householdLabel: 'Household',
    householdTitle: 'Family access',
    householdSubtitle: 'Control who can see this budget.',
    householdEmpty: 'No households yet.',
    membersTitle: 'Members',
    memberRoleOwner: 'Owner',
    memberRoleMember: 'Member',
    membersEmpty: 'No one else has joined yet.',
    inviteTitle: 'Invite a family member',
    inviteSubtitle: 'Generate a link for your partner.',
    inviteEmailLabel: 'Partner email',
    inviteEmailPlaceholder: 'partner@example.com',
    inviteButton: 'Create invite link',
    inviteSuccess: 'Invite created! Share it in any messenger.',
    inviteError: 'Could not create an invite. Please retry.',
    inviteLinkLabel: 'Share this link',
    inviteCopy: 'Copy',
    inviteCopySuccess: 'Link copied!',
    inviteCopyError: 'Could not copy the link.',
    acceptingInvite: 'Adding you to the household...',
    inviteAccepted: 'Done! You now share the budget.',
    inviteFailed: 'We could not accept that invite. Check if it is still active.',
    accountLoading: 'Preparing your profile and household...',
    accountError: 'We could not finish onboarding. Refresh or try again.',
  },
} as const

const currencyOptions = [
  { code: 'UAH', labels: { ua: 'Гривня (UAH)', en: 'Hryvnia (UAH)' } },
  { code: 'USD', labels: { ua: 'Долар США (USD)', en: 'US Dollar (USD)' } },
  { code: 'EUR', labels: { ua: 'Євро (EUR)', en: 'Euro (EUR)' } },
] as const

const localeMap: Record<Language, string> = {
  ua: 'uk-UA',
  en: 'en-US',
}

const defaultSettings = {
  language: 'ua' as Language,
  currency: 'UAH' as Currency,
  theme: 'light' as Theme,
}

type Settings = typeof defaultSettings

const settingsKey = 'budget-tracker-settings'
const inviteTokenKey = 'budget-invite-token'

const loadSettings = (): Settings => {
  if (typeof window === 'undefined') {
    return defaultSettings
  }
  try {
    const stored = window.localStorage.getItem(settingsKey)
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<Settings>
      return { ...defaultSettings, ...parsed }
    }
  } catch (error) {
    console.warn('Failed to load settings', error)
  }
  return defaultSettings
}

const formatCurrencyValue = (value: number, currency: Currency, language: Language) =>
  new Intl.NumberFormat(localeMap[language], {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)

const generateToken = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

const logDebug = (...args: unknown[]) => {
  // unified logger to track Supabase/auth flows
  console.log('[BudgetApp]', ...args)
}

const transactionSelect = [
  'id',
  'description',
  'amount',
  'category',
  'date',
  'household_id',
  'created_by',
  'author:profiles!transactions_created_by_fkey(id, email)',
].join(', ')

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [formState, setFormState] = useState({
    description: '',
    amount: '',
    category: categories[0]?.id ?? 'other',
    date: new Date().toISOString().split('T')[0],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasLoadError, setHasLoadError] = useState(false)
  const [hasSaveError, setHasSaveError] = useState(false)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authMethod, setAuthMethod] = useState<'magic' | 'password'>('magic')
  const [passwordMode, setPasswordMode] = useState<'signIn' | 'signUp'>('signIn')
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false)
  const [isHandlingPasswordAuth, setIsHandlingPasswordAuth] = useState(false)
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [memberships, setMemberships] = useState<HouseholdMembership[]>([])
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([])
  const [activeHouseholdId, setActiveHouseholdId] = useState<string | null>(null)
  const [isAccountLoading, setIsAccountLoading] = useState(true)
  const [accountError, setAccountError] = useState<string | null>(null)
  const [pendingInviteToken, setPendingInviteToken] = useState<string | null>(null)
  const [isAcceptingInvite, setIsAcceptingInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [inviteMessage, setInviteMessage] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [isSendingInvite, setIsSendingInvite] = useState(false)

  const locale = localeMap[settings.language]
  const t = translations[settings.language]

  const buildInviteAwareRedirect = useCallback(() => {
    if (typeof window === 'undefined') {
      return undefined
    }
    const origin = window.location.origin
    try {
      const storedToken = window.localStorage.getItem(inviteTokenKey)
      const token = pendingInviteToken ?? storedToken
      return token ? `${origin}?invite=${encodeURIComponent(token)}` : origin
    } catch (error) {
      console.warn('Failed to access invite token storage', error)
      return origin
    }
  }, [pendingInviteToken])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const params = new URLSearchParams(window.location.search)
    const token = params.get('invite')
    if (token) {
      setPendingInviteToken(token)
      window.localStorage.setItem(inviteTokenKey, token)
      params.delete('invite')
      const newQuery = params.toString()
      const nextUrl = `${window.location.origin}${window.location.pathname}${newQuery ? `?${newQuery}` : ''}${
        window.location.hash
      }`
      window.history.replaceState({}, '', nextUrl)
      return
    }
    const storedInvite = window.localStorage.getItem(inviteTokenKey)
    if (storedInvite) {
      setPendingInviteToken(storedInvite)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const initSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!isMounted) {
        return
      }
      logDebug('Initial session fetched', data.session ? data.session.user?.id : 'none')
      setSession(data.session ?? null)
      if (!data.session) {
        setIsAccountLoading(false)
      }
    }
    void initSession()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      logDebug('Auth state change', _event, nextSession?.user?.id)
      setSession(nextSession)
      setIsAccountLoading(Boolean(nextSession))
    })
    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const loadMemberships = useCallback(async (profileId: string) => {
    logDebug('Loading memberships', profileId)
    const { data, error } = await supabase
      .from('household_members')
      .select('household_id, role, households(id, name)')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: true })
    if (error) {
      throw error
    }
    logDebug('Membership rows', data?.length ?? 0)
    const records = (data ?? []) as HouseholdMembershipRow[]
    return records.map((entry) => ({
      household_id: entry.household_id as string,
      role: entry.role as HouseholdMembership['role'],
      households: entry.households
        ? {
            id: Array.isArray(entry.households)
              ? (entry.households[0]?.id as string)
              : (entry.households.id as string),
            name: Array.isArray(entry.households)
              ? (entry.households[0]?.name as string)
              : (entry.households.name as string),
          }
        : null,
    }))
  }, [])

  const refreshMemberships = useCallback(
    async (profileId: string) => {
      const list = await loadMemberships(profileId)
      setMemberships(list)
      return list
    },
    [loadMemberships],
  )

  const loadOrCreateProfile = useCallback(async (user: User) => {
    logDebug('Loading profile', user.id)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, default_household_id')
      .eq('id', user.id)
      .maybeSingle()
    if (error && error.code !== 'PGRST116') {
      throw error
    }
    let currentProfile = data as Profile | null
    if (!currentProfile) {
      logDebug('Profile missing, creating new', user.id)
      const { data: created, error: createError } = await supabase
        .from('profiles')
        .insert({ id: user.id, email: user.email })
        .select('id, email, default_household_id')
        .single()
      if (createError) {
        throw createError
      }
      logDebug('Profile created', created)
      currentProfile = created as Profile
    }
    return currentProfile
  }, [])

  const ensureDefaultHousehold = useCallback(
    async (user: User, profileRecord: Profile) => {
      if (profileRecord.default_household_id) {
        logDebug('Profile already has default household', profileRecord.default_household_id)
        return profileRecord
      }
      const fallbackName = user.email ? `${user.email.split('@')[0]} family` : 'Family budget'
      logDebug('Creating fallback household', { fallbackName, owner: user.id })
      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert({ name: fallbackName })
        .select('id')
        .single()
      if (householdError) {
        throw householdError
      }
      const householdId = household.id as string
      logDebug('Household created', householdId)
      const { error: memberError } = await supabase
        .from('household_members')
        .insert({ household_id: householdId, profile_id: profileRecord.id, role: 'owner' })
      if (memberError) {
        throw memberError
      }
      logDebug('Owner membership inserted', { householdId, profileId: profileRecord.id })
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ default_household_id: householdId })
        .eq('id', profileRecord.id)
        .select('id, email, default_household_id')
        .single()
      if (updateError) {
        throw updateError
      }
      logDebug('Profile updated with default household', updatedProfile)
      return updatedProfile as Profile
    },
    [],
  )

  const bootstrapAccount = useCallback(
    async (user: User) => {
      logDebug('Bootstrapping account', user.id)
      try {
        setAccountError(null)
        let profileRecord = await loadOrCreateProfile(user)
        profileRecord = await ensureDefaultHousehold(user, profileRecord)
        setProfile(profileRecord)
        const list = await refreshMemberships(profileRecord.id)
        logDebug('Membership list', list.map((entry) => entry.household_id))
        const defaultHousehold =
          profileRecord.default_household_id && list.some((entry) => entry.household_id === profileRecord.default_household_id)
            ? profileRecord.default_household_id
            : list[0]?.household_id ?? null
        setActiveHouseholdId((prev) => prev ?? defaultHousehold)
      } catch (error) {
        console.error('Failed to bootstrap account', error)
        logDebug('Bootstrap error', error)
        setAccountError('account')
      } finally {
        setIsAccountLoading(false)
      }
    },
    [ensureDefaultHousehold, loadOrCreateProfile, refreshMemberships],
  )

  useEffect(() => {
    if (!session?.user) {
      setProfile(null)
      setMemberships([])
      setHouseholdMembers([])
      setActiveHouseholdId(null)
      setTransactions([])
      setIsAccountLoading(false)
      return
    }
    setIsAccountLoading(true)
    void bootstrapAccount(session.user)
  }, [bootstrapAccount, session])

  const acceptInviteToken = useCallback(
    async (token: string, userEmail: string, profileId: string) => {
      setIsAcceptingInvite(true)
      setInviteError(null)
      try {
        logDebug('Accepting invite', { token, userEmail })
        const { data, error } = await supabase
          .from('household_invites')
          .select('id, household_id, email, status')
          .eq('token', token)
          .maybeSingle()
        if (error) {
          throw error
        }
        if (!data) {
          throw new Error('Invite not found')
        }
        if (data.status && data.status !== 'pending') {
          throw new Error('Invite already used')
        }
        logDebug('Invite found', data.household_id)
        if (data.email && data.email.toLowerCase() !== userEmail.toLowerCase()) {
          throw new Error('Invite email mismatch')
        }
        const householdId = data.household_id as string
        const { error: upsertError } = await supabase
          .from('household_members')
          .upsert({ household_id: householdId, profile_id: profileId, role: 'member' }, { onConflict: 'household_id,profile_id' })
        if (upsertError) {
          throw upsertError
        }
        logDebug('Membership upserted via invite', { householdId, profileId })
        const { error: inviteStatusError } = await supabase
          .from('household_invites')
          .update({ status: 'accepted', accepted_profile: profileId })
          .eq('id', data.id)
        if (inviteStatusError) {
          console.warn('Failed to update invite status', inviteStatusError)
          logDebug('Invite status update skipped', inviteStatusError)
        }
        await refreshMemberships(profileId)
        setActiveHouseholdId(householdId)
        setInviteMessage(t.inviteAccepted)
        setPendingInviteToken(null)
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(inviteTokenKey)
        }
      } catch (error) {
        console.error('Failed to accept invite', error)
        logDebug('Invite accept error', error)
        setInviteError(t.inviteFailed)
      } finally {
        setIsAcceptingInvite(false)
      }
    },
    [refreshMemberships, t.inviteAccepted, t.inviteFailed],
  )

  useEffect(() => {
    if (!pendingInviteToken || !profile?.id || !session?.user?.email) {
      return
    }
    void acceptInviteToken(pendingInviteToken, session.user.email, profile.id)
  }, [acceptInviteToken, pendingInviteToken, profile, session])

  const fetchTransactions = useCallback(async () => {
    if (!activeHouseholdId) {
      setTransactions([])
      setIsLoading(false)
      return
    }
    logDebug('Fetching transactions', activeHouseholdId)
    setIsLoading(true)
    setHasLoadError(false)
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(transactionSelect)
        .eq('household_id', activeHouseholdId)
        .order('date', { ascending: false })
      if (error) {
        throw error
      }
      logDebug('Transactions loaded', data?.length ?? 0)
      setTransactions((data ?? []) as Transaction[])
    } catch (error) {
      console.error('Failed to load transactions from Supabase', error)
      logDebug('Transactions error', error)
      setHasLoadError(true)
    } finally {
      setIsLoading(false)
    }
  }, [activeHouseholdId])

  const loadHouseholdMembers = useCallback(async (householdId: string) => {
    logDebug('Loading household members', householdId)
    const { data, error } = await supabase
      .from('household_members')
      .select('profile_id, role, profiles(id, email)')
      .eq('household_id', householdId)
      .order('role', { ascending: true })
    if (error) {
      console.error('Failed to load members', error)
      logDebug('Household members error', error)
      return
    }
    const records = (data ?? []) as HouseholdMemberRow[]
    setHouseholdMembers(
      records.map((entry) => ({
        profile_id: entry.profile_id as string,
        role: entry.role as HouseholdMember['role'],
        profiles: entry.profiles
          ? {
              id: Array.isArray(entry.profiles)
                ? (entry.profiles[0]?.id as string)
                : (entry.profiles.id as string),
              email: Array.isArray(entry.profiles)
                ? ((entry.profiles[0]?.email as string) ?? null)
                : ((entry.profiles.email as string | null) ?? null),
            }
          : null,
      })),
    )
  }, [])

  useEffect(() => {
    if (!activeHouseholdId) {
      setHouseholdMembers([])
      return
    }
    void fetchTransactions()
    void loadHouseholdMembers(activeHouseholdId)
  }, [activeHouseholdId, fetchTransactions, loadHouseholdMembers])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    window.localStorage.setItem(settingsKey, JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }
    document.documentElement.setAttribute('data-theme', settings.theme)
  }, [settings.theme])

  useEffect(() => {
    setSelectedCategory('all')
  }, [activeHouseholdId])

  const handleAuthMethodChange = (method: 'magic' | 'password') => {
    setAuthMethod(method)
    setAuthMessage(null)
    setAuthError(null)
    if (method === 'magic') {
      setPasswordMode('signIn')
      setAuthPassword('')
    }
  }

  const handlePasswordModeChange = (mode: 'signIn' | 'signUp') => {
    setPasswordMode(mode)
    setAuthMessage(null)
    setAuthError(null)
  }

  const handleMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!authEmail.trim()) {
      return
    }
    logDebug('Sending magic link', { email: authEmail.trim().toLowerCase() })
    setIsSendingMagicLink(true)
    setAuthMessage(null)
    setAuthError(null)
    try {
      const redirectTo = buildInviteAwareRedirect()
      const { error } = await supabase.auth.signInWithOtp({
        email: authEmail.trim().toLowerCase(),
        options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
      })
      if (error) {
        throw error
      }
      logDebug('Magic link sent successfully')
      setAuthMessage(t.authSent)
    } catch (error) {
      console.error('Failed to send magic link', error)
      logDebug('Magic link error', error)
      setAuthError(t.authSendError)
    } finally {
      setIsSendingMagicLink(false)
    }
  }

  const handlePasswordAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const email = authEmail.trim().toLowerCase()
    if (!email) {
      setAuthError(t.authPasswordError)
      return
    }
    if (authPassword.length < 6) {
      setAuthError(t.authPasswordRequirement)
      return
    }
    setIsHandlingPasswordAuth(true)
    setAuthMessage(null)
    setAuthError(null)
    try {
      if (passwordMode === 'signIn') {
        logDebug('Attempt password sign-in', { email })
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: authPassword,
        })
        if (error) {
          throw error
        }
        logDebug('Password sign-in success')
        setAuthMessage(t.authPasswordSignInSuccess)
      } else {
        logDebug('Attempt password sign-up', { email })
        const redirectTo = buildInviteAwareRedirect()
        const { error } = await supabase.auth.signUp({
          email,
          password: authPassword,
          options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
        })
        if (error) {
          throw error
        }
        logDebug('Password sign-up success')
        setAuthMessage(t.authPasswordSignUpSuccess)
      }
      setAuthPassword('')
      if (passwordMode === 'signUp') {
        setPasswordMode('signIn')
      }
    } catch (error) {
      console.error('Failed to handle password auth', error)
      logDebug('Password auth error', { passwordMode, error })
      setAuthError(t.authPasswordError)
    } finally {
      setIsHandlingPasswordAuth(false)
    }
  }

  const handleSignOut = async () => {
    logDebug('Signing out user', session?.user?.id)
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
    setActiveHouseholdId(null)
    setTransactions([])
  }

  const handleHouseholdChange = async (value: string) => {
    logDebug('Switching household', value)
    setActiveHouseholdId(value)
    if (!profile?.id) {
      return
    }
    try {
      await supabase
        .from('profiles')
        .update({ default_household_id: value })
        .eq('id', profile.id)
      setProfile((previous) => (previous ? { ...previous, default_household_id: value } : previous))
    } catch (error) {
      console.error('Failed to update default household', error)
    }
  }

  const handleInviteSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activeHouseholdId || !inviteEmail.trim()) {
      return
    }
    logDebug('Creating invite', { household: activeHouseholdId, inviteEmail })
    setIsSendingInvite(true)
    setInviteMessage(null)
    setInviteError(null)
    try {
      const token = generateToken()
      const { data, error } = await supabase
        .from('household_invites')
        .insert({
          household_id: activeHouseholdId,
          email: inviteEmail.trim().toLowerCase(),
          token,
        })
        .select('token')
        .single()
      if (error || !data) {
        throw error ?? new Error('Invite not created')
      }
      logDebug('Invite token created', data.token)
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const link = `${origin}?invite=${data.token}`
      setInviteLink(link)
      setInviteMessage(t.inviteSuccess)
      setInviteEmail('')
    } catch (error) {
      console.error('Failed to create invite', error)
      logDebug('Invite creation error', error)
      setInviteError(t.inviteError)
    } finally {
      setIsSendingInvite(false)
    }
  }

  const handleCopyInvite = async () => {
    if (!inviteLink) {
      return
    }
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteLink)
        setInviteMessage(t.inviteCopySuccess)
        logDebug('Invite link copied')
      } else {
        throw new Error('Clipboard not available')
      }
    } catch (error) {
      console.error('Failed to copy invite', error)
      logDebug('Invite copy error', error)
      setInviteError(t.inviteCopyError)
    }
  }

  const filteredTransactions = useMemo(() => {
    if (selectedCategory === 'all') {
      return transactions
    }
    return transactions.filter((txn) => txn.category === selectedCategory)
  }, [transactions, selectedCategory])

  const categorySummary = useMemo(() => {
    const summary = categories.map((category) => {
      const totalForCategory = transactions
        .filter((txn) => txn.category === category.id)
        .reduce((sum, txn) => sum + txn.amount, 0)

      const count = transactions.filter((txn) => txn.category === category.id).length

      return {
        id: category.id,
        color: category.color,
        name: category.labels[settings.language],
        total: totalForCategory,
        count,
      }
    })

    const totalSpent = summary.reduce((sum, category) => sum + category.total, 0)
    const averageTransaction = transactions.length ? totalSpent / transactions.length : 0

    const topCategory = transactions.length
      ? summary.reduce((currentTop, category) => (category.total > currentTop.total ? category : currentTop), summary[0])
      : undefined

    return {
      summary,
      totalSpent,
      averageTransaction,
      topCategory,
    }
  }, [transactions, settings.language])

  const monthlyTrend = useMemo(() => {
    const monthlyTotals = new Map<
      string,
      {
        total: number
        date: Date
      }
    >()

    transactions.forEach((txn) => {
      const date = new Date(txn.date)
      const key = `${date.getFullYear()}-${date.getMonth()}`
      if (!monthlyTotals.has(key)) {
        monthlyTotals.set(key, {
          total: 0,
          date: new Date(date.getFullYear(), date.getMonth(), 1),
        })
      }
      const current = monthlyTotals.get(key)
      if (current) {
        current.total += txn.amount
      }
    })

    return Array.from(monthlyTotals.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-6)
  }, [transactions])

  const highestMonthlyTotal = useMemo(
    () => monthlyTrend.reduce((max, entry) => Math.max(max, entry.total), 0),
    [monthlyTrend],
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!activeHouseholdId) {
      logDebug('Submit transaction aborted, missing household')
      return
    }

    const parsedAmount = Number.parseFloat(formState.amount)
    if (!formState.description.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return
    }

    setIsSaving(true)
    setHasSaveError(false)
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        description: formState.description.trim(),
        amount: Number(parsedAmount.toFixed(2)),
        category: formState.category,
        date: formState.date,
        household_id: activeHouseholdId,
        created_by: profile?.id ?? session?.user?.id ?? null,
      })
      .select(transactionSelect)
      .single()
    setIsSaving(false)

    if (error || !data) {
      console.error('Failed to save transaction to Supabase', error)
      logDebug('Transaction save error', error)
      setHasSaveError(true)
      return
    }
    logDebug('Transaction saved', data.id)

    setTransactions((previous) => [data as Transaction, ...previous])
    setSelectedCategory('all')
    setFormState((prev) => ({
      ...prev,
      description: '',
      amount: '',
    }))
  }

  const formatAmount = (value: number) => formatCurrencyValue(value, settings.currency, settings.language)

  if (!session) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <p className="eyebrow">{t.heroEyebrow}</p>
          <h1>{t.authTitle}</h1>
          <p className="subtitle">{t.authSubtitle}</p>
          {pendingInviteToken && <div className="auth-notice">{t.authInviteNotice}</div>}
          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              className={authMethod === 'magic' ? 'active' : ''}
              onClick={() => handleAuthMethodChange('magic')}
            >
              {t.authMethodMagic}
            </button>
            <button
              type="button"
              className={authMethod === 'password' ? 'active' : ''}
              onClick={() => handleAuthMethodChange('password')}
            >
              {t.authMethodPassword}
            </button>
          </div>
          {authMethod === 'magic' ? (
            <form className="auth-form" onSubmit={handleMagicLink}>
              <label>
                {t.authEmailLabel}
                <input
                  type="email"
                  value={authEmail}
                  onChange={(event) => setAuthEmail(event.target.value)}
                  placeholder={t.authEmailPlaceholder}
                  autoComplete="email"
                  required
                />
              </label>
              <button type="submit" disabled={isSendingMagicLink}>
                {isSendingMagicLink ? t.authProcessing : t.authSendLink}
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handlePasswordAuth}>
              <div className="password-mode-toggle" role="group">
                <button
                  type="button"
                  className={passwordMode === 'signIn' ? 'active' : ''}
                  onClick={() => handlePasswordModeChange('signIn')}
                >
                  {t.authPasswordModeSignIn}
                </button>
                <button
                  type="button"
                  className={passwordMode === 'signUp' ? 'active' : ''}
                  onClick={() => handlePasswordModeChange('signUp')}
                >
                  {t.authPasswordModeSignUp}
                </button>
              </div>
              <p className="auth-hint">
                {passwordMode === 'signIn' ? t.authPasswordHintSignIn : t.authPasswordHintSignUp}
              </p>
              <label>
                {t.authEmailLabel}
                <input
                  type="email"
                  value={authEmail}
                  onChange={(event) => setAuthEmail(event.target.value)}
                  placeholder={t.authEmailPlaceholder}
                  autoComplete="email"
                  required
                />
              </label>
              <label>
                {t.authPasswordLabel}
                <input
                  type="password"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  placeholder={t.authPasswordPlaceholder}
                  autoComplete={passwordMode === 'signIn' ? 'current-password' : 'new-password'}
                  minLength={6}
                  required
                />
              </label>
              <p className="password-hint">{t.authPasswordRequirement}</p>
              <button type="submit" disabled={isHandlingPasswordAuth}>
                {isHandlingPasswordAuth
                  ? t.authProcessing
                  : passwordMode === 'signIn'
                    ? t.authPasswordSubmitSignIn
                    : t.authPasswordSubmitSignUp}
              </button>
            </form>
          )}
          {authMessage && <p className="success-text">{authMessage}</p>}
          {authError && <p className="form-error">{authError}</p>}
        </div>
      </div>
    )
  }

  if (isAccountLoading) {
    return (
      <div className="auth-shell">
        <div className="auth-card loading-card">
          <p>{t.accountLoading}</p>
        </div>
      </div>
    )
  }

  if (accountError) {
    return (
      <div className="auth-shell">
        <div className="auth-card loading-card">
          <p>{t.accountError}</p>
          <button type="button" onClick={() => session.user && bootstrapAccount(session.user)}>
            {t.retryLabel}
          </button>
        </div>
      </div>
    )
  }

  if (!activeHouseholdId) {
    return (
      <div className="auth-shell">
        <div className="auth-card loading-card">
          <p>{t.householdEmpty}</p>
          <button type="button" onClick={() => session.user && bootstrapAccount(session.user)}>
            {t.retryLabel}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">{t.heroEyebrow}</p>
          <h1>{t.heroTitle}</h1>
          <p className="subtitle">{t.heroSubtitle}</p>
        </div>
        <div className="header-actions">
          <div className="header-highlight">
            <span>{t.spentLabel}</span>
            <strong>{formatAmount(categorySummary.totalSpent)}</strong>
            <small>{t.expenseCount(transactions.length)}</small>
          </div>
          <button type="button" className="ghost-button" onClick={handleSignOut}>
            {t.signOut}
          </button>
        </div>
      </header>

      <section className="settings-bar">
        <label>
          {t.languageLabel}
          <select
            value={settings.language}
            onChange={(event) =>
              setSettings((prev) => ({ ...prev, language: event.target.value as Language }))
            }
          >
            <option value="ua">Українська</option>
            <option value="en">English</option>
          </select>
        </label>
        <label>
          {t.currencyLabel}
          <select
            value={settings.currency}
            onChange={(event) =>
              setSettings((prev) => ({ ...prev, currency: event.target.value as Currency }))
            }
          >
            {currencyOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.labels[settings.language]}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.householdLabel}
          <select
            value={activeHouseholdId}
            onChange={(event) => handleHouseholdChange(event.target.value)}
          >
            {memberships.map((membership) => (
              <option key={membership.household_id} value={membership.household_id}>
                {membership.households?.name ?? membership.household_id}
              </option>
            ))}
          </select>
        </label>
        <div className="theme-toggle">
          <span>{t.themeLabel}</span>
          <div className="theme-buttons">
            <button
              type="button"
              className={settings.theme === 'light' ? 'active' : ''}
              onClick={() => setSettings((prev) => ({ ...prev, theme: 'light' }))}
            >
              {t.themeLight}
            </button>
            <button
              type="button"
              className={settings.theme === 'dark' ? 'active' : ''}
              onClick={() => setSettings((prev) => ({ ...prev, theme: 'dark' }))}
            >
              {t.themeDark}
            </button>
          </div>
        </div>
      </section>

      <section className="household-panel">
        <div className="panel household-card">
          <div className="panel-header">
            <h2>{t.householdTitle}</h2>
            <p>{t.householdSubtitle}</p>
          </div>
          <div className="household-members">
            <h3>{t.membersTitle}</h3>
            <ul>
              {householdMembers.map((member) => (
                <li key={member.profile_id}>
                  <span>{member.profiles?.email ?? '—'}</span>
                  <small>
                    {member.role === 'owner' ? t.memberRoleOwner : t.memberRoleMember}
                  </small>
                </li>
              ))}
              {!householdMembers.length && <li>{t.membersEmpty}</li>}
            </ul>
          </div>
          {isAcceptingInvite && <p className="info-text">{t.acceptingInvite}</p>}
        </div>
        <div className="panel household-card">
          <div className="panel-header">
            <h2>{t.inviteTitle}</h2>
            <p>{t.inviteSubtitle}</p>
          </div>
          <form className="invite-form" onSubmit={handleInviteSubmit}>
            <label>
              {t.inviteEmailLabel}
              <input
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder={t.inviteEmailPlaceholder}
                required
              />
            </label>
            <button type="submit" disabled={isSendingInvite}>
              {isSendingInvite ? t.transactionsLoading : t.inviteButton}
            </button>
          </form>
          {inviteLink && (
            <div className="invite-link">
              <p>{t.inviteLinkLabel}</p>
              <code>{inviteLink}</code>
              <button type="button" onClick={handleCopyInvite}>
                {t.inviteCopy}
              </button>
            </div>
          )}
          {inviteMessage && <p className="success-text">{inviteMessage}</p>}
          {inviteError && <p className="form-error">{inviteError}</p>}
        </div>
      </section>

      <section className="grid-two">
        <div className="panel">
          <div className="panel-header">
            <h2>{t.addTransaction}</h2>
            <p>{t.addTransactionHint}</p>
          </div>
          <form className="transaction-form" onSubmit={handleSubmit}>
            <label>
              {t.descriptionLabel}
              <input
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder={t.descriptionPlaceholder}
                required
              />
            </label>
            <label>
              {t.amountLabel}
              <input
                type="number"
                min="0"
                step="0.01"
                value={formState.amount}
                onChange={(event) => setFormState((prev) => ({ ...prev, amount: event.target.value }))}
                placeholder="0.00"
                required
              />
            </label>
            <label>
              {t.categoryLabel}
              <select
                value={formState.category}
                onChange={(event) => setFormState((prev) => ({ ...prev, category: event.target.value }))}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.labels[settings.language]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t.dateLabel}
              <input
                type="date"
                value={formState.date}
                onChange={(event) => setFormState((prev) => ({ ...prev, date: event.target.value }))}
                required
              />
            </label>
            <button type="submit" disabled={isSaving} aria-busy={isSaving}>
              {t.submitButton}
            </button>
            {hasSaveError && <p className="form-error">{t.saveError}</p>}
          </form>
        </div>

        <div className="panel analytics-panel">
          <div className="panel-header">
            <h2>{t.analyticsTitle}</h2>
            <p>{t.analyticsSubtitle}</p>
          </div>
          <div className="insights-grid">
            <div className="insight-card">
              <p>{t.totalSpentLabel}</p>
              <strong>{formatAmount(categorySummary.totalSpent)}</strong>
              <small>{t.totalSpentHint}</small>
            </div>
            <div className="insight-card">
              <p>{t.averageTransactionLabel}</p>
              <strong>{formatAmount(categorySummary.averageTransaction)}</strong>
              <small>{t.averageTransactionHint(transactions.length)}</small>
            </div>
            <div className="insight-card">
              <p>{t.topCategoryLabel}</p>
              <strong>{categorySummary.topCategory?.name ?? '—'}</strong>
              <small>
                {categorySummary.topCategory
                  ? t.topCategoryHint(
                      formatAmount(categorySummary.topCategory.total),
                      categorySummary.topCategory.count,
                    )
                  : t.topCategoryEmpty}
              </small>
            </div>
          </div>
          <div className="monthly-trend">
            <h3>{t.monthlyTrendTitle}</h3>
            <ul>
              {monthlyTrend.map((entry) => (
                <li key={entry.date.toISOString()}>
                  <span>
                    {new Intl.DateTimeFormat(locale, {
                      month: 'short',
                      year: 'numeric',
                    }).format(entry.date)}
                  </span>
                  <div className="bar">
                    <div
                      className="bar-fill"
                      style={{
                        width: highestMonthlyTotal ? `${(entry.total / highestMonthlyTotal) * 100}%` : '0%',
                      }}
                    />
                  </div>
                  <span className="amount">{t.monthlyAmount(formatAmount(entry.total))}</span>
                </li>
              ))}
              {!monthlyTrend.length && <li className="empty-state">{t.monthlyTrendEmpty}</li>}
            </ul>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>{t.transactionsTitle}</h2>
          <p>{t.transactionsSubtitle}</p>
        </div>
        <div className="filters">
          <button
            type="button"
            className={selectedCategory === 'all' ? 'active' : ''}
            onClick={() => setSelectedCategory('all')}
          >
            {t.filterAll}
          </button>
          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              className={selectedCategory === category.id ? 'active' : ''}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.labels[settings.language]}
            </button>
          ))}
        </div>

        <ul className="transaction-list">
          {filteredTransactions.map((txn) => {
            const category = categories.find((cat) => cat.id === txn.category)
            const authorLabel = txn.author?.email ?? t.transactionAuthorUnknown
            return (
              <li key={txn.id}>
                <div>
                  <strong>{txn.description}</strong>
                  <p>
                    {category?.labels[settings.language] ?? '--'} •{' '}
                    {new Intl.DateTimeFormat(locale, {
                      month: 'short',
                      day: 'numeric',
                    }).format(new Date(txn.date))}{' '}
                    • {t.transactionAuthor(authorLabel)}
                  </p>
                </div>
                <span>{formatAmount(txn.amount)}</span>
              </li>
            )
          })}
          {isLoading && !transactions.length && (
            <li className="empty-state">{t.transactionsLoading}</li>
          )}
          {hasLoadError && (
            <li className="empty-state">
              <span>{t.transactionsError}</span>
              <button type="button" onClick={() => void fetchTransactions()}>
                {t.retryLabel}
              </button>
            </li>
          )}
          {!isLoading && !hasLoadError && !filteredTransactions.length && (
            <li className="empty-state">{t.transactionEmpty}</li>
          )}
        </ul>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>{t.breakdownTitle}</h2>
          <p>{t.breakdownSubtitle}</p>
        </div>
        <ul className="category-breakdown">
          {categorySummary.summary.map((category) => (
            <li key={category.id}>
              <div className="category-label">
                <span className="dot" style={{ background: category.color }} />
                <div>
                  <strong>{category.name}</strong>
                  <p>{t.categoryTransactions(category.count)}</p>
                </div>
              </div>
              <div className="category-progress">
                <div
                  className="fill"
                  style={{
                    width: categorySummary.totalSpent
                      ? `${(category.total / categorySummary.totalSpent) * 100}%`
                      : '0%',
                    background: category.color,
                  }}
                />
              </div>
              <span>{formatAmount(category.total)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export default App
