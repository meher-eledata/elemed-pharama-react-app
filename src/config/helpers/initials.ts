// Shared initials helper — derives avatar initials from a full name.
// Used by TopBar and the User Profile page so the logic lives in one place.
export const getInitials = (fullName?: string): string => {
  if (!fullName || fullName.trim() === '' || fullName === 'Guest') return 'G';

  const nameParts = fullName.trim().split(/\s+/);
  if (nameParts.length >= 2) {
    // First letter of first name + first letter of last name
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  }
  // Single name: take first two letters
  return nameParts[0].substring(0, 2).toUpperCase();
};
