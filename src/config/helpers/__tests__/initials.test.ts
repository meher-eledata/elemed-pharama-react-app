import { getInitials } from '../initials';

describe('getInitials', () => {
  it('first + last name -> two uppercase letters', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('uppercases initials from lowercase input', () => {
    expect(getInitials('jane smith')).toBe('JS');
  });

  it('uses first + LAST token when there are 3+ name parts', () => {
    expect(getInitials('Mary Jane Watson')).toBe('MW');
  });

  it('collapses extra whitespace between names', () => {
    expect(getInitials('  John    Doe  ')).toBe('JD');
  });

  it('single name -> first two letters uppercased', () => {
    expect(getInitials('Alice')).toBe('AL');
  });

  it('single short name -> just that letter uppercased', () => {
    expect(getInitials('A')).toBe('A');
  });

  it('empty string -> safe "G" fallback', () => {
    expect(getInitials('')).toBe('G');
  });

  it('whitespace-only string -> safe "G" fallback', () => {
    expect(getInitials('   ')).toBe('G');
  });

  it('undefined -> safe "G" fallback', () => {
    expect(getInitials(undefined)).toBe('G');
  });

  it('"Guest" -> safe "G" fallback', () => {
    expect(getInitials('Guest')).toBe('G');
  });
});
