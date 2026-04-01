type TUserWithProfileName = {
  firstName: string | null
  lastName: string | null
  username: string | null
}

export const getProfileName = (user: TUserWithProfileName) => {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`
  }

  if (user.firstName) {
    return user.firstName
  }

  if (user.lastName) {
    return user.lastName
  }

  if (user.username) {
    return user.username
  }

  return 'USER'
}
