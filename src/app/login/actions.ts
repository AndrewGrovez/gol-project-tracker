'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // Try to authenticate the user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword(data)

  if (authError) {
    // Return the error instead of redirecting
    return { error: authError.message || "Invalid login credentials" }
  }

  // After successful authentication, verify user exists in your profiles table
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', authData.user.id)
    .single()

  if (userError || !userData) {
    // User authenticated but doesn't exist in profiles - sign them out
    await supabase.auth.signOut()
    return { error: "User not authorized" }
  }

  revalidatePath('/', 'layout')
  redirect('/?refresh=true')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}