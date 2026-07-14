import {
  normalizeDigits,
  isPhoneQuery,
  rankName,
  rankPhone,
  filterRanked,
} from '../customerSearch';
import { CustomerOption } from '../../../../redux/slices/salesApi';

describe('customerSearch', () => {
  describe('normalizeDigits', () => {
    it('strips +, spaces, dashes and other non-digits', () => {
      expect(normalizeDigits('+91 98-123 45678')).toBe('919812345678');
      expect(normalizeDigits('')).toBe('');
    });
  });

  describe('isPhoneQuery', () => {
    it('accepts digits with +, spaces and dashes', () => {
      expect(isPhoneQuery('9812345678')).toBe(true);
      expect(isPhoneQuery('+91 98-12')).toBe(true);
    });
    it('rejects text containing letters and empty input', () => {
      expect(isPhoneQuery('SUSRU')).toBe(false);
      expect(isPhoneQuery('98a12')).toBe(false);
      expect(isPhoneQuery('')).toBe(false);
      expect(isPhoneQuery('+')).toBe(false);
    });
  });

  describe('rankName', () => {
    it('ranks prefix < word-start < substring, case-insensitively', () => {
      expect(rankName('Susrutha Rao', 'susru')).toBe(0);
      expect(rankName('B S N Susrutha', 'susru')).toBe(1);
      expect(rankName('Vasusruthi', 'susru')).toBe(2);
      expect(rankName('B S N RAJU', 'susru')).toBe(-1);
    });
    it('handles null/blank names without throwing', () => {
      expect(rankName(null, 'x')).toBe(-1);
      expect(rankName(undefined, 'x')).toBe(-1);
      expect(rankName('', 'x')).toBe(-1);
    });
  });

  describe('rankPhone', () => {
    it('ranks digit prefix above substring; no match is dropped', () => {
      expect(rankPhone('9812345678', '9812')).toBe(0);
      expect(rankPhone('+919812345678', '9812')).toBe(1); // country code before it
      expect(rankPhone('9911223344', '9812')).toBe(-1);
      expect(rankPhone(null, '9812')).toBe(-1);
    });
  });

  describe('filterRanked', () => {
    const options: CustomerOption[] = [
      { id: '1', name: 'B S N RAJU', phone: '+919812345678' },
      { id: '2', name: 'Susrutha Rao', phone: '+919911223344' },
      { id: '3', name: 'Devi Susrutha', phone: '+918800112233' },
      { id: '4', name: 'Anita Desai', phone: null },
    ];
    const accessors = {
      getName: (o: CustomerOption) => o.name,
      getPhone: (o: CustomerOption) => o.phone,
    };

    it('returns options unchanged for an empty query', () => {
      expect(filterRanked(options, '  ', accessors)).toEqual(options);
    });

    it('ranks SUSRU-like names first and drops unrelated names', () => {
      const result = filterRanked(options, 'SUSRU', accessors);
      expect(result.map((o) => o.id)).toEqual(['2', '3']);
    });

    it('matches by phone when the query is digits (shared numbers stay separate options)', () => {
      const shared: CustomerOption[] = [
        ...options,
        { id: '5', name: 'Raju Twin', phone: '+919911223344' },
      ];
      const result = filterRanked(shared, '99112', accessors);
      expect(result.map((o) => o.id)).toEqual(['2', '5']);
    });

    it('matches phones despite +, spaces and dashes in the query', () => {
      const result = filterRanked(options, '+91 98-12', accessors);
      expect(result.map((o) => o.id)).toEqual(['1']);
    });

    it('falls back to name ranking when no phone accessor is given', () => {
      const names = ['Dr. Anand', 'Anand Rao', 'Ramanand'];
      const result = filterRanked(names, 'anand', { getName: (o) => o });
      expect(result).toEqual(['Anand Rao', 'Dr. Anand', 'Ramanand']);
    });
  });
});
